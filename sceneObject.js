// --------------------------------------------------
// CLASS - SCENE OBJECT
// --------------------------------------------------

class SceneObject {

    constructor() {
        // Objeto 3D (Three.js) que representa este elemento na cena
        this.object3D =
            new THREE.Group();
    }

    update(dt) {
    }

    addTo(scene) {
        scene.add(
            this.object3D
        );
    }
}

// --------------------------------------------------
// CLASS - MAZE (CENÁRIO)
// --------------------------------------------------

class Maze extends SceneObject {

    constructor(map, tile, wallHeight) {

        super();

        this.map = map;
        this.tile = tile;
        this.wallHeight = wallHeight;

        this.rows = map.length;
        this.cols = map[0].length;

        this.playerSpawn = { x: 0, z: 0 };
        this.ghostSpawns = [];
        this.dots = [];
        this.pellets = [];

        this.build();
    }

    // --------------------------------------------------
    // TEXTURAS PROCEDURAIS
    // --------------------------------------------------

    createWallTexture() {

        const size = 128;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");

        ctx.fillStyle = "#142c66";
        ctx.fillRect(0, 0, size, size);

        ctx.strokeStyle = "#234a9e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, size / 2);
        ctx.lineTo(size, size / 2);
        ctx.moveTo(size / 2, 0);
        ctx.lineTo(size / 2, size);
        ctx.stroke();

        ctx.strokeStyle = "#4580ff";
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, size - 4, size - 4);

        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;

        return texture;
    }

    createFloorTexture() {

        const size = 256;
        const half = size / 2;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");

        // Ladrilhos xadrez com tom difuso para espalhar a luz ao redor
        ctx.fillStyle = "#181c2e";
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = "#2c3350";
        ctx.fillRect(0, 0, half, half);
        ctx.fillRect(half, half, half, half);

        // Borda interna sutil de cada ladrilho
        ctx.strokeStyle = "rgba(130, 150, 210, 0.15)";
        ctx.lineWidth = 2;
        ctx.strokeRect(4, 4, half - 8, half - 8);
        ctx.strokeRect(half + 4, 4, half - 8, half - 8);
        ctx.strokeRect(4, half + 4, half - 8, half - 8);
        ctx.strokeRect(half + 4, half + 4, half - 8, half - 8);

        // Rejunte escuro entre os blocos
        ctx.strokeStyle = "#0c0e18";
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, half, half);
        ctx.strokeRect(half, 0, half, half);
        ctx.strokeRect(0, half, half, half);
        ctx.strokeRect(half, half, half, half);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(this.cols, this.rows);
        texture.encoding = THREE.sRGBEncoding;

        return texture;
    }

    // --------------------------------------------------
    // CONSTRUÇÃO DO CENÁRIO
    // --------------------------------------------------

    build() {

        this.buildFloor();

        const wallGeometry =
            new THREE.BoxGeometry(
                this.tile,
                this.wallHeight,
                this.tile
            );

        const wallEdges =
            new THREE.EdgesGeometry(
                wallGeometry
            );

        const wallTexture = this.createWallTexture();

        const wallMaterial =
            new THREE.MeshStandardMaterial({
                map: wallTexture,
                color: 0x70a0ff,
                emissive: 0x061236,
                emissiveMap: wallTexture,
                emissiveIntensity: 0.2,
                roughness: 0.78,
                metalness: 0.12
            });

        const wallEdgeMaterial =
            new THREE.LineBasicMaterial({
                color: 0x4d88ff
            });

        const doorGeometry =
            new THREE.BoxGeometry(
                this.tile,
                0.4,
                this.tile * 0.3
            );

        const doorMaterial =
            new THREE.MeshStandardMaterial({
                color: 0xff9ad5,
                emissive: 0x441133,
                roughness: 0.4
            });

        const dotGeometry =
            new THREE.SphereGeometry(
                0.18,
                12,
                12
            );

        const dotMaterial =
            new THREE.MeshStandardMaterial({
                color: 0xffe9b0,
                emissive: 0xffb84d,
                emissiveIntensity: 0.22,
                roughness: 0.35
            });

        const pelletGeometry =
            new THREE.SphereGeometry(
                0.5,
                16,
                16
            );

        const pelletMaterial =
            new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xffe066,
                emissiveIntensity: 1.4,
                roughness: 0.1
            });

        for (let row = 0; row < this.rows; row++) {

            for (let col = 0; col < this.cols; col++) {

                const tileChar =
                    this.map[row][col];

                const position =
                    transformacoes.tileParaMundo(
                        col,
                        row,
                        this.cols,
                        this.rows,
                        this.tile
                    );

                if (tileChar === "#") {

                    const wall =
                        new THREE.Mesh(
                            wallGeometry,
                            wallMaterial
                        );

                    wall.position.set(
                        position.x,
                        this.wallHeight / 2,
                        position.z
                    );

                    const edges =
                        new THREE.LineSegments(
                            wallEdges,
                            wallEdgeMaterial
                        );

                    edges.position.copy(
                        wall.position
                    );
                    edges.layers.set(1);

                    this.object3D.add(wall);
                    this.object3D.add(edges);

                } else if (tileChar === "-") {

                    const door =
                        new THREE.Mesh(
                            doorGeometry,
                            doorMaterial
                        );

                    door.position.set(
                        position.x,
                        this.wallHeight / 2,
                        position.z
                    );

                    this.object3D.add(door);

                } else if (tileChar === ".") {

                    const dot =
                        new THREE.Mesh(
                            dotGeometry,
                            dotMaterial
                        );

                    dot.position.set(
                        position.x,
                        1.0,
                        position.z
                    );

                    this.object3D.add(dot);
                    this.dots.push(dot);

                } else if (tileChar === "o") {

                    const pellet =
                        new THREE.Mesh(
                            pelletGeometry,
                            pelletMaterial
                        );

                    pellet.position.set(
                        position.x,
                        1.2,
                        position.z
                    );

                    this.object3D.add(pellet);
                    this.pellets.push(pellet);

                } else if (tileChar === "P") {

                    this.playerSpawn = position;

                } else if (tileChar === "G") {

                    this.ghostSpawns.push(position);
                }
            }
        }
    }

    buildFloor() {

        const floor =
            new THREE.Mesh(
                new THREE.PlaneGeometry(
                    this.cols * this.tile,
                    this.rows * this.tile
                ),
                new THREE.MeshStandardMaterial({
                    map: this.createFloorTexture(),
                    roughness: 0.88,
                    metalness: 0.05
                })
            );

        floor.rotation.x = -Math.PI / 2;

        this.object3D.add(floor);
    }

    // --------------------------------------------------
    // COLISÃO
    // --------------------------------------------------

    isWallTile(col, row) {

        if (
            col < 0 ||
            row < 0 ||
            col >= this.cols ||
            row >= this.rows
        ) {
            return true;
        }

        const tileChar =
            this.map[row][col];

        return tileChar === "#" || tileChar === "-";
    }

    // Verifica se uma posição colide com alguma bolinha do mapa
    hasPelletAt(x, z, radius = 0.6) {

        const overlaps = (pellet) => {
            const dx = x - pellet.position.x;
            const dz = z - pellet.position.z;
            const pelletRadius = pellet.geometry.parameters.radius;
            const combinedRadius = radius + pelletRadius;

            return dx * dx + dz * dz < combinedRadius * combinedRadius;
        };

        return this.dots.some(overlaps) || this.pellets.some(overlaps);
    }

    // Verifica se um círculo (x, z) de raio r colide com alguma parede
    collides(x, z, r) {

        const min =
            transformacoes.mundoParaTile(
                x - r,
                z - r,
                this.cols,
                this.rows,
                this.tile
            );

        const max =
            transformacoes.mundoParaTile(
                x + r,
                z + r,
                this.cols,
                this.rows,
                this.tile
            );

        for (let row = min.row; row <= max.row; row++) {

            for (let col = min.col; col <= max.col; col++) {

                if (!this.isWallTile(col, row)) {
                    continue;
                }

                const left =
                    (col - this.cols / 2) * this.tile;

                const top =
                    (row - this.rows / 2) * this.tile;

                const nearestX =
                    Math.max(
                        left,
                        Math.min(x, left + this.tile)
                    );

                const nearestZ =
                    Math.max(
                        top,
                        Math.min(z, top + this.tile)
                    );

                const dx = x - nearestX;
                const dz = z - nearestZ;

                if (dx * dx + dz * dz < r * r) {
                    return true;
                }
            }
        }

        return false;
    }

    update(dt) {

        // Animação simples dos pontos especiais
        const time =
            performance.now() / 1000;

        this.pellets.forEach((pellet) => {

            pellet.scale.setScalar(
                1 + 0.15 * Math.sin(time * 5)
            );
        });
    }
}

// --------------------------------------------------
// CLASS - PLAYER (JOGADOR + MARCADOR DA VISTA SUPERIOR)
// --------------------------------------------------

class Player extends SceneObject {

    constructor(
        maze,
        radius,
        speed,
        turnSpeed
    ) {

        super();

        this.maze = maze;
        this.radius = radius;
        this.speed = speed;
        this.turnSpeed = turnSpeed;

        this.x = maze.playerSpawn.x;
        this.z = maze.playerSpawn.z;
        this.yaw = 0;

        // Posição suave da sprite no mapa superior
        this.markerX = this.x;
        this.markerZ = this.z;

        this.buildMarker();
    }

    // Gera a sprite 2D do Pac-Man clássico em um canvas com abertura de boca parametrizável
    createPacmanSpriteTexture(directionAngle, mouthAngleFraction = 0.28) {

        const size = 64;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        const center = size / 2;
        const radius = size * 0.44;
        const mouthAngle = mouthAngleFraction * Math.PI;

        ctx.fillStyle = "#ffe600";
        ctx.beginPath();
        if (mouthAngleFraction <= 0.02) {
            ctx.arc(center, center, radius, 0, Math.PI * 2, false);
        } else {
            const startAngle = directionAngle + mouthAngle / 2;
            const endAngle = directionAngle + (2 * Math.PI - mouthAngle / 2);
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, startAngle, endAngle, false);
            ctx.closePath();
        }
        ctx.fill();

        // Borda sutil de destaque
        ctx.strokeStyle = "#cca300";
        ctx.lineWidth = 2;
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;
        return texture;
    }

    // Marcador 2D do Pac-Man exclusivo da vista superior
    buildMarker() {

        // Frames de animação da boca: aberta (0.30), semiaberta (0.16) e fechada (0.0)
        const mouthAngles = [0.30, 0.16, 0.02];
        const dirAngles = {
            up: -Math.PI / 2,
            right: 0,
            down: Math.PI / 2,
            left: Math.PI
        };

        this.pacmanTextures = {
            up: mouthAngles.map(m => this.createPacmanSpriteTexture(dirAngles.up, m)),
            right: mouthAngles.map(m => this.createPacmanSpriteTexture(dirAngles.right, m)),
            down: mouthAngles.map(m => this.createPacmanSpriteTexture(dirAngles.down, m)),
            left: mouthAngles.map(m => this.createPacmanSpriteTexture(dirAngles.left, m))
        };

        const spriteMaterial = new THREE.SpriteMaterial({
            map: this.pacmanTextures.up[0],
            transparent: true,
            depthTest: false,
            depthWrite: false
        });

        this.markerSprite = new THREE.Sprite(spriteMaterial);
        this.markerSprite.scale.set(2.4, 2.4, 1.0);
        this.markerSprite.layers.set(1);

        this.object3D.add(this.markerSprite);
        this.object3D.position.y = 1.6;
        this.currentDirection = "up";
        this.mouthTimer = 0;
        this.mouthFrame = 0;
        this.mouthFrameSeq = [0, 1, 2, 1]; // aberta -> meia -> fechada -> meia
    }

    update(dt, keys) {

        // Rotação
        if (keys["KeyA"] || keys["ArrowLeft"]) {
            this.yaw += this.turnSpeed * dt;
        }

        if (keys["KeyD"] || keys["ArrowRight"]) {
            this.yaw -= this.turnSpeed * dt;
        }

        // Determina a direção cardeal mais próxima com base no yaw
        // yaw 0 = olhando para -Z (Cima na tela)
        let normalizedYaw = this.yaw % (Math.PI * 2);
        if (normalizedYaw < 0) normalizedYaw += Math.PI * 2;

        let nextDirection = "up";
        if (normalizedYaw >= Math.PI * 0.25 && normalizedYaw < Math.PI * 0.75) {
            nextDirection = "left";
        } else if (normalizedYaw >= Math.PI * 0.75 && normalizedYaw < Math.PI * 1.25) {
            nextDirection = "down";
        } else if (normalizedYaw >= Math.PI * 1.25 && normalizedYaw < Math.PI * 1.75) {
            nextDirection = "right";
        } else {
            nextDirection = "up";
        }

        // Translação
        const frente =
            transformacoes.direcaoFrente(
                this.yaw
            );

        let moveX = 0;
        let moveZ = 0;

        if (keys["KeyW"] || keys["ArrowUp"]) {
            moveX += frente.x;
            moveZ += frente.z;
        }

        if (keys["KeyS"] || keys["ArrowDown"]) {
            moveX -= frente.x;
            moveZ -= frente.z;
        }

        const delta =
            transformacoes.deslocamento(
                moveX,
                moveZ,
                this.speed,
                dt
            );

        // Colisão separada por eixo para permitir deslizar nas paredes
        if (
            !this.maze.collides(
                this.x + delta.x,
                this.z,
                this.radius
            )
        ) {
            this.x += delta.x;
        }

        if (
            !this.maze.collides(
                this.x,
                this.z + delta.z,
                this.radius
            )
        ) {
            this.z += delta.z;
        }

        // Animação da boquinha abrindo e fechando
        const isMoving = Math.hypot(delta.x, delta.z) > 0.0001;
        this.mouthTimer += dt * (isMoving ? 14 : 7);
        const seqIndex = Math.floor(this.mouthTimer) % this.mouthFrameSeq.length;
        const currentMouthIndex = this.mouthFrameSeq[seqIndex];

        if (nextDirection !== this.currentDirection || currentMouthIndex !== this.mouthFrame) {
            this.currentDirection = nextDirection;
            this.mouthFrame = currentMouthIndex;
            this.markerSprite.material.map = this.pacmanTextures[nextDirection][currentMouthIndex];
            this.markerSprite.material.needsUpdate = true;
        }

        // Mantém a sprite no centro dos corredores mesmo em interseções e curvas
        const currentTile = transformacoes.mundoParaTile(
            this.x,
            this.z,
            this.maze.cols,
            this.maze.rows,
            this.maze.tile
        );

        if (!this.maze.isWallTile(currentTile.col, currentTile.row)) {
            const centerWorld = transformacoes.tileParaMundo(
                currentTile.col,
                currentTile.row,
                this.maze.cols,
                this.maze.rows,
                this.maze.tile
            );

            // Alvo padrão alinhado ao centro da célula
            let targetX = centerWorld.x;
            let targetZ = centerWorld.z;

            // No eixo em que o jogador está se movendo / orientado, segue o deslocamento
            if (this.currentDirection === "up" || this.currentDirection === "down") {
                targetX = centerWorld.x; // trava no meio do corredor vertical
                targetZ = this.z;        // avança suavemente em Z
            } else {
                targetX = this.x;        // avança suavemente em X
                targetZ = centerWorld.z; // trava no meio do corredor horizontal
            }

            // Interpolação suave (lerp) para transição perfeita em curvas e cruzamentos sem pulos
            const lerpFactor = Math.min(1.0, dt * 18);
            this.markerX += (targetX - this.markerX) * lerpFactor;
            this.markerZ += (targetZ - this.markerZ) * lerpFactor;
        } else {
            this.markerX = this.x;
            this.markerZ = this.z;
        }

        this.object3D.position.x = this.markerX;
        this.object3D.position.z = this.markerZ;
    }
}


