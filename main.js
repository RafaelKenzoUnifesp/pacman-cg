(() => {

    // --------------------------------------------------
    // CONFIGURAÇÃO INICIAL
    // --------------------------------------------------

    const canvas =
        document.getElementById("gameCanvas");

    if (typeof THREE === "undefined") {
        throw new Error("Three.js não foi carregado.");
    }

    // --------------------------------------------------
    // CRIAR CENA
    // --------------------------------------------------

    const scene =
        new Scene(canvas);

    // --------------------------------------------------
    // INICIAR ANIMAÇÃO
    // --------------------------------------------------

    scene.init();

})();
