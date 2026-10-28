// --------------------------------------------------
// CLASS - SCENE
// --------------------------------------------------

class Scene {

    constructor(canvas) {

        const TILE = 3;
        const WALL_HEIGHT = 3;
        const EYE_HEIGHT = 1.4;
        const PLAYER_RADIUS = 0.8;
        const MOVE_SPEED = 6;
        const TURN_SPEED = 2.4;

        this.renderer = new Renderer(canvas);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Cenário e jogador
        this.maze = new Maze(MAZE_MAP, TILE, WALL_HEIGHT);
        this.player = new Player(this.maze, PLAYER_RADIUS, MOVE_SPEED, TURN_SPEED);

        this.maze.addTo(this.scene);
        this.player.addTo(this.scene);

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

        this.maze.update(dt);

        this.povCamera.follow(
            this.player
        );
    }

    draw() {

        this.renderer.draw(
            this.scene,
            this.povCamera.camera,
            this.topCamera.camera
        );
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
