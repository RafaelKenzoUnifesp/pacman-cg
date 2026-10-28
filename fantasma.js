// --------------------------------------------------
// CLASS - GHOST (FANTASMA DO PAC-MAN)
// --------------------------------------------------

class Ghost extends SceneObject {

    constructor(maze, spawnIndex = 0, color = 0xff3030) {
        super();

        this.maze = maze;
        this.color = color;
        this.phase = Math.random() * Math.PI * 2;

        const spawn = this.pickSpawn(spawnIndex);
        this.x = spawn.x;
        this.z = spawn.z;

        this.buildModel();
        this.object3D.position.set(this.x, 0, this.z);
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
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: this.color });
        const eyeWhiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x101044 });

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

    update(dt) {
        this.phase += dt * 4;
        this.object3D.position.y = 0.08 + Math.sin(this.phase) * 0.08;
    }
}
