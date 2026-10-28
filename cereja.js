// --------------------------------------------------
// CLASS - CHERRY (Teste)
// --------------------------------------------------

class Cherry extends SceneObject {

    constructor(position) {
        super();
        this.phase = Math.random() * Math.PI * 2;
        this.buildModel();
        this.object3D.position.set(position.x, 0, position.z);
        this.buildMinimapMarker();
    }

    buildModel() {
        const red = new THREE.MeshBasicMaterial({ color: 0xe51b3e });
        const green = new THREE.MeshBasicMaterial({ color: 0x32b85a });
        const fruitGeometry = new THREE.SphereGeometry(0.32, 20, 16);

        const leftFruit = new THREE.Mesh(fruitGeometry, red);
        leftFruit.position.set(-0.25, 0.38, 0);
        leftFruit.scale.set(1, 1.05, 0.9);

        const rightFruit = new THREE.Mesh(fruitGeometry, red);
        rightFruit.position.set(0.25, 0.38, 0);
        rightFruit.scale.set(1, 1.05, 0.9);

        const leftStem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.035, 0.65, 8), green
        );
        leftStem.position.set(-0.12, 0.83, 0);
        leftStem.rotation.z = -0.35;

        const rightStem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.035, 0.65, 8), green
        );
        rightStem.position.set(0.12, 0.83, 0);
        rightStem.rotation.z = 0.35;

        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), green);
        leaf.position.set(0.1, 1.08, 0);
        leaf.scale.set(1.5, 0.45, 0.65);
        leaf.rotation.z = -0.35;

        this.object3D.add(leftFruit, rightFruit, leftStem, rightStem, leaf);
    }

    buildMinimapMarker() {
        const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 12, 8),
            new THREE.MeshBasicMaterial({ color: 0xe51b3e })
        );
        marker.layers.set(1);
        this.object3D.add(marker);
    }

    update(dt) {
        this.phase += dt;
        this.object3D.position.y = 0.08 + Math.sin(this.phase * 2) * 0.08;
        this.object3D.rotation.y += dt * 0.5;
    }
}
