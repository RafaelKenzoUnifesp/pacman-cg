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
        this.buildLight();
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
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.85,
            roughness: 0.25,
            metalness: 0.2
        });
        const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.4,
            roughness: 0.2
        });
        const pupilMaterial = new THREE.MeshStandardMaterial({
            color: 0x101044,
            roughness: 0.2
        });

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

    buildLight() {
        this.light = new THREE.PointLight(this.color, 1.8, 6.5, 2);
        this.light.position.set(0, 1.2, 0);
        this.light.castShadow = true;
        this.light.shadow.mapSize.set(256, 256);
        this.light.shadow.camera.near = 0.2;
        this.light.shadow.camera.far = 7;
        this.light.shadow.bias = -0.002;
        this.object3D.add(this.light);
    }

    update(dt) {
        this.phase += dt * 4;
        this.object3D.position.y = 0.08 + Math.sin(this.phase) * 0.08;
    }
}
