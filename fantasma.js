// --------------------------------------------------
// CLASS - GHOST (FANTASMA DO PAC-MAN)
// --------------------------------------------------

class Ghost extends SceneObject {

    constructor(maze, spawnIndex = 0, color = 0xff3030) {
        super();

        this.maze = maze;
        this.color = color;
        this.phase = Math.random() * Math.PI * 2;
        this.state = "house";
        this.mode = "scatter";
        this.previousMode = "scatter";
        this.direction = { col: -1, row: 0 };
        this.inTunnel = false;
        this.frightenedTime = 0;
        this.frightDuration = 0;
        this.debug = false;
        this.modelMaterials = [];
        this.decidedKey = null;
        this.baseSpeed = 0;
        this.speed = 0;
        this.speedMultipliers = { ghost: 1, tunnel: 1, frightened: 1 };

        const spawn = this.pickSpawn(spawnIndex);
        this.x = spawn.x;
        this.z = spawn.z;

        this.buildModel();
        this.buildLight();
        this.object3D.position.set(this.x, 0, this.z);
    }

    tilePosition(col, row) {
        return transformacoes.tileParaMundo(col, row, this.maze.cols, this.maze.rows, this.maze.tile);
    }

    currentTile() {
        return transformacoes.mundoParaTile(this.x, this.z, this.maze.cols, this.maze.rows, this.maze.tile);
    }

    setMode(mode) {
        if (this.mode === mode) return;
        this.mode = mode;
        if (this.debug) console.debug(`[Ghost] ${this.name}: modo ${mode}`);
        const frightened = mode === "frightened";
        this.modelMaterials.forEach(material => {
            if (material.color) material.color.set(frightened ? 0x1644ff : this.color);
            if (material.emissive) material.emissive.set(frightened ? 0x163cff : this.color);
        });
        if (mode === "chase" || mode === "scatter") this.direction = { col: -this.direction.col, row: -this.direction.row };
    }

    frighten(duration) {
        if (this.state === "house" || this.state === "leaving" || this.state === "eyes") return;
        if (this.mode !== "frightened") this.previousMode = this.mode;
        this.frightDuration = duration;
        this.frightenedTime = duration;
        this.direction = { col: -this.direction.col, row: -this.direction.row };
        if (duration > 0) this.setMode("frightened");
    }

    getTarget(playerTile) {
        if (this.mode === "scatter") {
            const corners = {
                Blinky: { col: this.maze.cols - 2, row: 1 },
                Pinky: { col: 1, row: 1 },
                Inky: { col: this.maze.cols - 2, row: this.maze.rows - 2 },
                Clyde: { col: 1, row: this.maze.rows - 2 }
            };
            return corners[this.name];
        }
        return playerTile;
    }

    chooseDirection(playerTile) {
        const tile = this.currentTile();
        const directions = [
            { col: 0, row: -1 }, { col: 1, row: 0 },
            { col: 0, row: 1 }, { col: -1, row: 0 }
        ];
        const target = this.getTarget(playerTile);
        let options = directions.filter(direction => {
            if (direction.col === -this.direction.col && direction.row === -this.direction.row) return false;
            const col = tile.col + direction.col;
            const row = tile.row + direction.row;
            return this.maze.isOpenGhostTile(col, row);
        });
        if (!options.length) {
            const reverse = { col: -this.direction.col, row: -this.direction.row };
            if (this.maze.isOpenGhostTile(tile.col + reverse.col, tile.row + reverse.row)) options = [reverse];
        }
        if (!options.length) return;
        if (this.mode === "frightened") {
            this.direction = options[Math.floor(Math.random() * options.length)];
            return;
        }
        options.sort((a, b) => {
            const da = (tile.col + a.col - target.col) ** 2 + (tile.row + a.row - target.row) ** 2;
            const db = (tile.col + b.col - target.col) ** 2 + (tile.row + b.row - target.row) ** 2;
            return da - db;
        });
        this.direction = options[0];
    }

    updateTunnelState() {
        const tile = this.currentTile();
        this.inTunnel = this.maze.isTunnelTile(tile.col, tile.row);
    }

    // Usa quatro posições distintas da casa dos fantasmas.
    pickSpawn(index) {
        if (!this.maze.ghostSpawns.length) {
            return { x: 0, z: 0 };
        }

        const uniqueSpawns = this.maze.ghostSpawns.filter((spawn, i, all) =>
            all.findIndex(other => other.x === spawn.x && other.z === spawn.z) === i
        );

        return uniqueSpawns[index % uniqueSpawns.length];
    }

    buildModel() {
        const coreColor = new THREE.Color(this.color).lerp(new THREE.Color(0xffffff), 0.35);

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: coreColor,
            emissive: this.color,
            emissiveIntensity: 2.0,
            roughness: 0.15,
            metalness: 0.3
        });
        const haloMaterial = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.28,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: coreColor,
            transparent: true,
            opacity: 0.75,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xd8f8ff,
            emissiveIntensity: 1.6,
            roughness: 0.1
        });
        const pupilMaterial = new THREE.MeshStandardMaterial({
            color: 0x050518,
            emissive: 0x00e5ff,
            emissiveIntensity: 0.9,
            roughness: 0.1
        });
        this.modelMaterials = [bodyMaterial, haloMaterial, ringMaterial];

        // Cúpula superior do corpo.
        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(0.9, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
            bodyMaterial
        );
        dome.position.y = 1.0;
        this.object3D.add(dome);

        // Parte inferior: cilindro com base ondulada feita de semiesferas.
        const skirt = new THREE.Mesh(
            new THREE.CylinderGeometry(0.9, 0.9, 0.9, 24, 1, false),
            bodyMaterial
        );
        skirt.position.y = 0.55;
        this.object3D.add(skirt);

        // Casca externa aditiva (efeito neon bloom / holograma cyberpunk)
        const domeHalo = new THREE.Mesh(
            new THREE.SphereGeometry(1.02, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
            haloMaterial
        );
        domeHalo.position.y = 1.0;
        this.object3D.add(domeHalo);

        const skirtHalo = new THREE.Mesh(
            new THREE.CylinderGeometry(1.02, 1.06, 0.96, 24, 1, true),
            haloMaterial
        );
        skirtHalo.position.y = 0.55;
        this.object3D.add(skirtHalo);

        // Anéis de energia neon estilo tech/cyberpunk
        [0.35, 0.75, 1.15].forEach(y => {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.93, 0.022, 8, 32),
                ringMaterial
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.y = y;
            this.object3D.add(ring);
        });

        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const wave = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 12, 8),
                bodyMaterial
            );
            wave.scale.y = 0.55;
            wave.position.set(Math.cos(angle) * 0.62, 0.16, Math.sin(angle) * 0.62);
            this.object3D.add(wave);
        }

        // Olhos voltados para -Z, direção frontal padrão da câmera.
        [-0.32, 0.32].forEach(x => {
            const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.25, 16, 12),
                eyeWhiteMaterial
            );
            eye.position.set(x, 1.1, -0.72);
            this.object3D.add(eye);

            const pupil = new THREE.Mesh(
                new THREE.SphereGeometry(0.11, 12, 8),
                pupilMaterial
            );
            pupil.position.set(x, 1.08, -0.94);
            this.object3D.add(pupil);
        });
    }

    buildLight() {
        this.light = new THREE.PointLight(this.color, 4.5, 8.5, 1);
        this.light.position.set(0, 1.3, 0);
        this.object3D.add(this.light);

        // Halo óptico de brilho neon (Sprite com AdditiveBlending)
        const size = 128;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        grad.addColorStop(0.25, "rgba(255, 255, 255, 0.45)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        const glowSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: new THREE.CanvasTexture(canvas),
                color: this.color,
                transparent: true,
                opacity: 0.65,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        glowSprite.position.set(0, 0.9, 0);
        glowSprite.scale.set(3.8, 3.8, 1);
        this.object3D.add(glowSprite);
    }

    update(dt) {
        this.phase += dt * 4;
        this.object3D.position.y = 0.08 + Math.sin(this.phase) * 0.08;
        this.light.intensity = 4.5 + Math.sin(this.phase * 1.5) * 0.6;
        this.object3D.visible = !(this.mode === "frightened" && this.frightenedTime <= 2 && Math.floor(this.frightenedTime * 8) % 2 === 0);

        if (this.state === "house") return;
        if (this.state === "leaving") {
            const door = this.maze.ghostDoor || this.maze.ghostSpawns[0] || { x: this.x, z: this.z };
            const exitZ = door.z - this.maze.tile;
            const step = this.baseSpeed * this.speedMultipliers.ghost * dt;
            this.x = door.x;
            // Sai pela abertura marcada no mapa, sem testar a colisão da porta.
            this.z = Math.max(exitZ, this.z - step);
            if (this.z <= exitZ) {
                this.z = exitZ;
                this.state = "active";
                this.setMode("scatter");
                this.direction = { col: -1, row: 0 };
                this.decidedKey = null;
                if (this.isBlinky) this.elroyDisabled = false;
            }
            this.object3D.position.x = this.x;
            this.object3D.position.z = this.z;
            return;
        }
        if (this.state === "active" && ["chase", "scatter", "frightened"].includes(this.mode)) {
            if (this.mode === "frightened" && this.frightDuration > 0) {
                this.frightenedTime = Math.max(0, this.frightenedTime - dt);
                if (this.frightenedTime === 0) this.setMode(this.previousMode);
            }
            this.updateTunnelState();
            const multiplier = this.inTunnel ? this.speedMultipliers.tunnel :
                this.mode === "frightened" ? this.speedMultipliers.frightened : this.speedMultipliers.ghost;
            const delta = this.baseSpeed * multiplier * dt;
            const tile = this.currentTile();
            const center = this.tilePosition(tile.col, tile.row);
            const key = `${tile.col},${tile.row}`;
            const dist = Math.abs(center.x - this.x) + Math.abs(center.z - this.z);
            if (dist <= delta && this.decidedKey !== key) {
                const alongX = this.direction.col !== 0;
                this.x = alongX ? center.x : this.x;
                this.z = alongX ? this.z : center.z;
                this.decidedKey = key;
                this.chooseDirection(this.maze.playerTile || tile);
            }
            const nextX = this.x + this.direction.col * delta;
            const nextZ = this.z + this.direction.row * delta;
            const nextTile = transformacoes.mundoParaTile(nextX, nextZ, this.maze.cols, this.maze.rows, this.maze.tile);
            if (this.maze.isTunnelTile(tile.col, tile.row) && this.maze.isTunnelTile(nextTile.col, nextTile.row)) {
                const bounds = this.maze.tunnelWorldBounds();
                this.x = nextX < bounds.left ? bounds.right : nextX > bounds.right ? bounds.left : nextX;
                this.z = nextZ;
            } else if (!this.maze.collides(nextX, nextZ, 0.8)) {
                this.x = nextX;
                this.z = nextZ;
            } else {
                this.decidedKey = null;
            }
            this.updateTunnelState();
            this.object3D.position.x = this.x;
            this.object3D.position.z = this.z;
        }
        this.object3D.position.x = this.x;
        this.object3D.position.z = this.z;
    }
}
