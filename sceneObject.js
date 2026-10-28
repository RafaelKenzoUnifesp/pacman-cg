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

        const wallMaterial =
            new THREE.MeshBasicMaterial({
                color: 0x1919a6
            });

        const wallEdgeMaterial =
            new THREE.LineBasicMaterial({
                color: 0x5aa0ff
            });

        const doorGeometry =
            new THREE.BoxGeometry(
                this.tile,
                0.4,
                this.tile * 0.3
            );

        const doorMaterial =
            new THREE.MeshBasicMaterial({
                color: 0xff9ad5
            });

        const dotGeometry =
            new THREE.SphereGeometry(
                0.18,
                12,
                12
            );

        const dotMaterial =
            new THREE.MeshBasicMaterial({
                color: 0xffe9b0
            });

        const pelletGeometry =
            new THREE.SphereGeometry(
                0.5,
                16,
                16
            );

        const pelletMaterial =
            new THREE.MeshBasicMaterial({
                color: 0xffffff
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
                new THREE.MeshBasicMaterial({
                    color: 0x0a0a14
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

        this.buildMarker();
    }

    // TODO: substituir pelo modelo 3D do Pac-Man quando estiver pronto
    // O marcador usa a camada 1, portanto só aparece na vista superior
    buildMarker() {

        const body =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    1.1,
                    20,
                    20
                ),
                new THREE.MeshBasicMaterial({
                    color: 0xffd200
                })
            );

        const arrow =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    0.7,
                    1.6,
                    16
                ),
                new THREE.MeshBasicMaterial({
                    color: 0xff5500
                })
            );

        arrow.rotation.x = -Math.PI / 2;

        arrow.position.set(
            0,
            0,
            -1.6
        );

        body.layers.set(1);
        arrow.layers.set(1);

        this.object3D.add(body);
        this.object3D.add(arrow);

        this.object3D.position.y = 1.2;
    }

    update(dt, keys) {

        // Rotação
        if (keys["KeyA"] || keys["ArrowLeft"]) {
            this.yaw += this.turnSpeed * dt;
        }

        if (keys["KeyD"] || keys["ArrowRight"]) {
            this.yaw -= this.turnSpeed * dt;
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

        this.object3D.position.x = this.x;
        this.object3D.position.z = this.z;
        this.object3D.rotation.y = this.yaw;
    }
}


