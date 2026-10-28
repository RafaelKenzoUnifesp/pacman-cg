// --------------------------------------------------
// TRANSFORMAÇÕES
// --------------------------------------------------

const transformacoes = {

    // Converte a posição (coluna, linha) do mapa
    // para coordenadas (x, z) do mundo, centralizadas na origem
    tileParaMundo: function (
        col,
        row,
        cols,
        rows,
        tile
    ) {

        return {
            x: (col + 0.5 - cols / 2) * tile,
            z: (row + 0.5 - rows / 2) * tile
        };
    },

    // Converte a coordenada (x, z) do mundo
    // para o índice (coluna, linha) do mapa
    mundoParaTile: function (
        x,
        z,
        cols,
        rows,
        tile
    ) {

        return {
            col: Math.floor(x / tile + cols / 2),
            row: Math.floor(z / tile + rows / 2)
        };
    },

    // Vetor unitário que aponta para frente
    // dado o ângulo de rotação (yaw) em torno do eixo Y
    direcaoFrente: function (yaw) {

        return {
            x: -Math.sin(yaw),
            z: -Math.cos(yaw)
        };
    },

    // Normaliza um vetor 2D e aplica a velocidade e o tempo
    deslocamento: function (
        x,
        z,
        velocidade,
        dt
    ) {

        const comprimento =
            Math.hypot(x, z);

        if (comprimento === 0) {

            return {
                x: 0,
                z: 0
            };
        }

        return {
            x: (x / comprimento) * velocidade * dt,
            z: (z / comprimento) * velocidade * dt
        };
    }
};
