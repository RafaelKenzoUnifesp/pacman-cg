// --------------------------------------------------
// CLASS - POV CAMERA (PRIMEIRA PESSOA)
// --------------------------------------------------

class PovCamera {

    constructor(eyeHeight) {

        this.eyeHeight = eyeHeight;

        // Projeção perspectiva
        this.camera =
            new THREE.PerspectiveCamera(
                75,
                1,
                0.1,
                200
            );
    }

    setAspect(aspect) {

        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    // Acompanha a posição e a rotação do jogador
    follow(player) {

        this.camera.position.set(
            player.x,
            this.eyeHeight,
            player.z
        );

        this.camera.rotation.set(
            0,
            player.yaw,
            0
        );
    }
}

// --------------------------------------------------
// CLASS - TOP CAMERA (VISTA SUPERIOR)
// --------------------------------------------------

class TopCamera {

    constructor(mazeSize) {

        const fov = 50;

        // Projeção perspectiva
        this.camera =
            new THREE.PerspectiveCamera(
                fov,
                1,
                0.1,
                500
            );

        // Distância necessária para enquadrar o labirinto inteiro
        const distance =
            (mazeSize / 2) /
            Math.tan(THREE.MathUtils.degToRad(fov / 2)) *
            1.05;

        this.camera.position.set(
            0,
            distance,
            0
        );

        this.camera.up.set(
            0,
            0,
            -1
        );

        this.camera.lookAt(
            0,
            0,
            0
        );

        // Camada 1: marcador do jogador
        this.camera.layers.enable(1);
    }
}
