// --------------------------------------------------
// CLASSE RENDERER
// --------------------------------------------------

class Renderer {

    constructor(canvas) {

        this.renderer =
            new THREE.WebGLRenderer({
                canvas: canvas,
                antialias: true
            });

        this.renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2)
        );

        this.renderer.autoClear = false;

        this.topBorder =
            document.getElementById("topBorder");

        this.topMargin = 16;
        this.width = 0;
        this.height = 0;
        this.topSize = 0;

        this.resize();
    }

    resize() {

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.renderer.setSize(
            this.width,
            this.height,
            false
        );

        this.topSize =
            Math.max(
                200,
                Math.round(
                    Math.min(this.width, this.height) * 0.32
                )
            );

        this.topBorder.style.width = this.topSize + "px";
        this.topBorder.style.height = this.topSize + "px";
        this.topBorder.style.top = this.topMargin + "px";
        this.topBorder.style.right = this.topMargin + "px";
    }

    draw(
        scene,
        povCamera,
        topCamera
    ) {

        const renderer = this.renderer;

        // Câmera POV: ocupa toda a tela
        renderer.setScissorTest(false);

        renderer.setViewport(
            0,
            0,
            this.width,
            this.height
        );

        renderer.clear();
        renderer.render(scene, povCamera);

        // Vista superior: canto superior direito
        const topX =
            this.width - this.topSize - this.topMargin;

        const topY =
            this.height - this.topSize - this.topMargin;

        renderer.setScissorTest(true);

        renderer.setViewport(
            topX,
            topY,
            this.topSize,
            this.topSize
        );

        renderer.setScissor(
            topX,
            topY,
            this.topSize,
            this.topSize
        );

        renderer.clear();
        renderer.render(scene, topCamera);
    }
}
