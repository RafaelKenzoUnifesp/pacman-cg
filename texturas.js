// --------------------------------------------------
// GERENCIAMENTO DE TEXTURAS PNG (PBR) E COORDENADAS UV
// --------------------------------------------------

const TextureAssets = (() => {
    const loader = new THREE.TextureLoader();

    function configureTexture(texture, {
        repeatX = 1,
        repeatY = 1,
        isColor = false,
        anisotropy = 4
    } = {}) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(repeatX, repeatY);
        texture.anisotropy = anisotropy;
        if (isColor) {
            texture.encoding = THREE.sRGBEncoding;
        }
        return texture;
    }

    function loadPBRSet(baseName, {
        repeatX = 1,
        repeatY = 1,
        anisotropy = 4,
        onFallback = null
    } = {}) {
        const opts = { repeatX, repeatY, anisotropy };
        const result = {
            map: null,
            normalMap: null,
            roughnessMap: null
        };

        result.map = loader.load(
            `texturas/${baseName}_diff.png`,
            (tex) => {
                configureTexture(tex, { ...opts, isColor: true });
                tex.needsUpdate = true;
            },
            undefined,
            () => {
                result.map = onFallback ? onFallback() : null;
            }
        );
        configureTexture(result.map, { ...opts, isColor: true });

        result.normalMap = loader.load(
            `texturas/${baseName}_normal.png`,
            (tex) => {
                configureTexture(tex, { ...opts, isColor: false });
                tex.needsUpdate = true;
            }
        );
        configureTexture(result.normalMap, { ...opts, isColor: false });

        result.roughnessMap = loader.load(
            `texturas/${baseName}_rough.png`,
            (tex) => {
                configureTexture(tex, { ...opts, isColor: false });
                tex.needsUpdate = true;
            }
        );
        configureTexture(result.roughnessMap, { ...opts, isColor: false });

        return result;
    }

    // Escala as coordenadas UV das 6 faces de um BoxGeometry proporcionalmente
    // às dimensões reais, evitando distorção em blocos não cúbicos.
    function applyBoxUVScale(geometry, width, height, depth, tileSize = 3) {
        const uv = geometry.attributes.uv;
        if (!uv) return;

        // Ordem padrão das 6 faces em THREE.BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
        const faceDimensions = [
            [depth, height],
            [depth, height],
            [width, depth],
            [width, depth],
            [width, height],
            [width, height]
        ];

        for (let face = 0; face < 6; face++) {
            const scaleU = faceDimensions[face][0] / tileSize;
            const scaleV = faceDimensions[face][1] / tileSize;
            const baseVertex = face * 4;

            for (let v = 0; v < 4; v++) {
                const idx = baseVertex + v;
                uv.setXY(idx, uv.getX(idx) * scaleU, uv.getY(idx) * scaleV);
            }
        }

        uv.needsUpdate = true;
    }

    return {
        loadPBRSet,
        applyBoxUVScale
    };
})();
