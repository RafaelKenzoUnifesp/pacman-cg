// --------------------------------------------------
// CLASS - SCENE
// --------------------------------------------------

const BASE_SPEED = 6;
const POWER_DURATION_BY_LEVEL = [6, 5, 4, 3, 2, 5, 2, 2, 1, 5, 2, 1, 1, 3, 1, 1, 0, 1, 0];
const MODE_PHASES_LEVEL_1 = [{ mode: "scatter", duration: 7 }, { mode: "chase", duration: 20 }];
function levelSpeeds(level) {
    if (level === 1) return { player: 0.80, ghost: 0.75, tunnel: 0.40, frightened: 0.50, power: 0.90 };
    if (level <= 4) return { player: 0.90, ghost: 0.85, tunnel: 0.45, frightened: 0.55, power: 0.95 };
    if (level <= 20) return { player: 1.00, ghost: 0.95, tunnel: 0.50, frightened: 0.60, power: 1.00 };
    return { player: 0.90, ghost: 0.95, tunnel: 0.50, frightened: null, power: 0.90 };
}

class Scene {

    constructor(canvas) {

        const TILE = 3;
        const WALL_HEIGHT = 3;
        const EYE_HEIGHT = 1.4;
        const PLAYER_RADIUS = 0.8;
        const MOVE_SPEED = BASE_SPEED;
        const TURN_SPEED = 2.4;

        this.renderer = new Renderer(canvas);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(
            0x000000,
            3,
            15
        );
        this.scene.background = new THREE.Color(0x000000);

        // Iluminação ambiente fraca
        this.ambientLight = new THREE.AmbientLight(0x141e38, 0.1);
        this.scene.add(this.ambientLight);
        this.scene.userData.ambientLight = this.ambientLight;

        // Luz difusa ao redor do jogador (ilumina os arredores e o minimapa)
        this.playerLight = new THREE.PointLight(0xffe6b8, 1.8, 12, 1);
        this.scene.add(this.playerLight);

        // Lanterna do jogador com cone aberto e suave
        this.flashlight = new THREE.SpotLight(
            0xfff4dc,
            2.2,
            18,
            Math.PI / 3,
            0.85,
            1
        );

        this.flashlightTarget = new THREE.Object3D();

        this.scene.add(this.flashlight);
        this.scene.add(this.flashlightTarget);

        this.flashlight.target = this.flashlightTarget;

        // Cenário e jogador
        this.maze = new Maze(MAZE_MAP, TILE, WALL_HEIGHT);
        this.level = 1;
        this.speeds = levelSpeeds(this.level);
        this.player = new Player(this.maze, PLAYER_RADIUS, MOVE_SPEED * this.speeds.player, TURN_SPEED);
        this.player.baseSpeed = MOVE_SPEED;
        this.player.powerSpeedMultiplier = this.speeds.power;

        // Mantem a cereja perto do player e evita nascer sobre uma bolinha
        //spawn da cereja vai ser alterado posteriormente 
        const cherrySpawnCandidates = [
            { x: this.player.x + TILE, z: this.player.z },
            { x: this.player.x + TILE * 0.6, z: this.player.z }
        ];

        const cherrySpawn = cherrySpawnCandidates.find(position =>
            !this.maze.hasPelletAt(position.x, position.z)
        );

        this.cherry = new Cherry(cherrySpawn || cherrySpawnCandidates[1]);

        const ghostColors = [0xff0055, 0xff00ea, 0x00f7ff, 0xff7b00];
        this.ghosts = ghostColors.map((color, index) =>
            new Ghost(this.maze, index, color)
        );
        this.debug = new URLSearchParams(window.location.search).get("debug") === "1";
        this.ghosts.forEach((ghost, index) => {
            ghost.name = ["Blinky", "Pinky", "Inky", "Clyde"][index];
            ghost.speed = BASE_SPEED * this.speeds.ghost;
            ghost.direction = { col: -1, row: 0 };
            ghost.isBlinky = index === 0;
            ghost.state = index === 0 ? "active" : "house";
            ghost.baseSpeed = BASE_SPEED;
            ghost.speed = BASE_SPEED * this.speeds.ghost;
            ghost.speedMultipliers = {
                ghost: this.speeds.ghost,
                tunnel: this.speeds.tunnel,
                frightened: this.speeds.frightened || this.speeds.ghost
            };
            ghost.debug = this.debug;
            ghost.scatterCorner = index;
        });
        this.ghostHouse = new GhostHouse(this.level, this.debug);
        this.powerTimer = 0;
        this.modePhaseIndex = 0;
        this.modePhaseTime = MODE_PHASES_LEVEL_1[0].duration;
        this.ghosts.forEach(ghost => ghost.setMode("scatter"));
        this.ghosts[0].x = this.maze.ghostDoor.x;
        this.ghosts[0].z = this.maze.ghostDoor.z - this.maze.tile;
        this.ghosts[0].object3D.position.set(this.ghosts[0].x, 0, this.ghosts[0].z);

        this.maze.addTo(this.scene);
        this.player.addTo(this.scene);
        this.cherry.addTo(this.scene);
        this.ghosts.forEach(ghost => ghost.addTo(this.scene));
        this.gameplay = new Gameplay(
            this.maze,
            this.player,
            this.cherry,
            document.getElementById("hud")
        );
        this.gameplay.ghostHouse = this.ghostHouse;
        this.gameplay.ghosts = this.ghosts;
        this.gameplay.onPowerPellet = () => this.activatePowerPellet();
        

        // Câmeras
        const mazeSize = Math.max(this.maze.cols, this.maze.rows) * TILE;
        this.povCamera = new PovCamera(EYE_HEIGHT);
        this.topCamera = new TopCamera(mazeSize);

        this.keys = {};

        document.addEventListener("keydown", (event) => {

            this.keys[event.code] = true;

            if (event.code.startsWith("Arrow")) {
                event.preventDefault();
            }
        });

        document.addEventListener("keyup", (event) => {
            this.keys[event.code] = false;
        });

        window.addEventListener("resize", () => {
            this.resize();
        });

        this.lastTime = performance.now();

        this.resize();
    }

    resize() {

        this.renderer.resize();

        this.povCamera.setAspect(
            this.renderer.width / this.renderer.height
        );
    }

    update() {

        // Mantém a cena congelada após vitória ou game over até o F5.
        if (this.gameplay && this.gameplay.finished) {
            return;
        }

        const now = performance.now();

        const dt =
            Math.min(
                (now - this.lastTime) / 1000,
                0.05
            );

        this.lastTime = now;

        this.player.update(
            dt,
            this.keys
        );
        this.maze.playerTile = transformacoes.mundoParaTile(this.player.x, this.player.z, this.maze.cols, this.maze.rows, this.maze.tile);
        this.powerTimer = Math.max(0, this.powerTimer - dt);
        if (this.level === 1) {
            this.modePhaseTime -= dt;
            if (this.modePhaseTime <= 0) {
                this.modePhaseIndex = (this.modePhaseIndex + 1) % MODE_PHASES_LEVEL_1.length;
                this.modePhaseTime = MODE_PHASES_LEVEL_1[this.modePhaseIndex].duration;
                const nextMode = MODE_PHASES_LEVEL_1[this.modePhaseIndex].mode;
                this.ghosts.forEach(ghost => {
                    if (ghost.state === "active" && ghost.mode !== "frightened" && ghost.mode !== "eyes") ghost.setMode(nextMode);
                });
            }
        }
        if (this.powerTimer === 0 && this.player.powerActive) {
            this.player.powerActive = false;
            this.player.speed = BASE_SPEED * this.speeds.player;
            this.ghosts.forEach(ghost => {
                if (ghost.mode === "frightened") ghost.setMode(ghost.previousMode);
                ghost.pendingFrightenDuration = 0;
            });
        }
        this.player.powerSpeedMultiplier = this.speeds.power;

        const releasedGhost = this.ghostHouse.update(dt);
        if (releasedGhost) {
            const ghost = this.ghosts.find(item => item.name === releasedGhost);
            if (ghost && ghost.state === "house") {
                ghost.state = "leaving";
                if (this.debug) console.debug(`[GhostHouse] ${releasedGhost} começou a sair`);
            }
            if (!this.ghostHouse.queue.length) this.ghosts.find(item => item.name === "Blinky").elroyDisabled = false;
        }
        
        this.gameplay.update();
        if (this.gameplay.finished) {
            return;
        }

        this.maze.update(dt);
        this.cherry.update(dt);
        this.ghosts.forEach(ghost => {
            if (ghost.pendingFrightenDuration > 0) {
                ghost.pendingFrightenDuration = this.powerTimer;
            }
            ghost.speed = BASE_SPEED * ghost.speedMultipliers.ghost;
            const remaining = this.maze.dots.length + this.maze.pellets.length;
            if (ghost.name === "Blinky" && !this.ghostHouse.queue.length && !ghost.elroyDisabled && this.level === 1 && ["chase", "scatter"].includes(ghost.mode)) {
                if (remaining <= 10) ghost.speed = Math.max(ghost.speed, BASE_SPEED * 0.85);
                else if (remaining <= 20) ghost.speed = Math.max(ghost.speed, BASE_SPEED * 0.80);
            }
            if (this.debug && ghost.lastLoggedSpeed !== ghost.speed) {
                ghost.lastLoggedSpeed = ghost.speed;
                console.debug(`[Ghost] ${ghost.name}: velocidade ${ghost.speed.toFixed(2)}`);
            }
            ghost.update(dt);
        });

        this.povCamera.follow(
            this.player
        );
        this.topCamera.follow(
         this.player
        );
        
        // Atualiza a posição da lanterna
        this.playerLight.position.set(
            this.player.x,
            this.povCamera.eyeHeight + 0.5,
            this.player.z
        );

        this.flashlight.position.copy(
         this.povCamera.camera.position
        );

        // Obtém a direção para a qual a câmera está olhando
        const direction = new THREE.Vector3();

        this.povCamera.camera.getWorldDirection(direction);

        // Posiciona o alvo à frente do jogador
        this.flashlightTarget.position
         .copy(this.povCamera.camera.position)
          .add(direction.multiplyScalar(10));

        // A colisão é avaliada depois que os fantasmas também se movimentaram.
        this.gameplay.checkGhostCollisions();
    }

    draw() {

        this.renderer.draw(
            this.scene,
            this.povCamera.camera,
            this.topCamera.camera
        );
    }

    activatePowerPellet() {
        const duration = POWER_DURATION_BY_LEVEL[this.level - 1] ?? 0;
        this.powerTimer = duration;
        this.player.powerActive = duration > 0;
        this.player.speed = BASE_SPEED * this.speeds.player;
        this.ghosts.forEach(ghost => ghost.frighten(duration));
    }

    // Redireciona o gancho de perda de vida para a fila global da casa.
    onLifeLost() {
        this.ghostHouse.onLifeLost();
    }

    // Repõe fantasmas na casa após uma morte; o subsistema de vidas chama este gancho.
    resetGhostsAfterDeath() {
        this.ghostHouse.resetQueue();
        this.ghosts.forEach((ghost, index) => {
            const spawn = ghost.pickSpawn(index);
            ghost.x = this.maze.ghostDoor ? this.maze.ghostDoor.x : spawn.x;
            ghost.z = spawn.z;
            ghost.object3D.position.set(ghost.x, 0, spawn.z);
            ghost.state = index === 0 ? "active" : "house";
            ghost.setMode("scatter");
            ghost.direction = { col: -1, row: 0 };
            ghost.elroyDisabled = true;
            ghost.frightenedTime = 0;
            ghost.frightDuration = 0;
            ghost.object3D.visible = true;
        });
        this.ghosts.find(ghost => ghost.name === "Blinky").elroyDisabled = true;
        this.powerTimer = 0;
        this.player.powerActive = false;
        this.player.powerSpeedMultiplier = this.speeds.power;
        this.player.speed = BASE_SPEED * this.speeds.player;
    }

    // Alias para consumidores que já referenciam o nome anterior do gancho.
    resetGhostsAfterLifeLost() {
        this.resetGhostsAfterDeath();
    }

    // Altera o estado externo sem incluir esse fantasma nas regras de movimento ou velocidade.
    setGhostState(name, state) {
        const ghost = this.ghosts.find(item => item.name === name);
        if (ghost) {
            ghost.state = state;
            if (state === "eyes") ghost.frightenedTime = 0;
        }
    }

    // Retorna a coordenada tile atual do fantasma pelo nome.
    getGhostTile(name) {
        const ghost = this.ghosts.find(item => item.name === name);
        return ghost ? ghost.currentTile() : null;
    }

    // Retorna o modo atual do fantasma pelo nome.
    getGhostMode(name) {
        const ghost = this.ghosts.find(item => item.name === name);
        return ghost ? ghost.mode : null;
    }

    execute() {

        this.update();
        this.draw();

        requestAnimationFrame(
            () => this.execute()
        );
    }

    init() {
        requestAnimationFrame(
            () => this.execute()
        );
    }
}
