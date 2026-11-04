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
    }
}
