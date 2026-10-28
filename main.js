(() => {
  // --------------------------------------------------
  // CONSTANTES
  // --------------------------------------------------
  const TILE = 3;
  const WALL_HEIGHT = 3;
  const EYE_HEIGHT = 1.4;
  const PLAYER_RADIUS = 0.8;
  const MOVE_SPEED = 6;
  const TURN_SPEED = 2.4;

  const ROWS = MAZE_MAP.length;
  const COLS = MAZE_MAP[0].length;

  // --------------------------------------------------
  // UTILITÁRIOS DO MAPA
  // --------------------------------------------------
  function tileToWorld(col, row) {
    return new THREE.Vector3(
      (col + 0.5 - COLS / 2) * TILE,
      0,
      (row + 0.5 - ROWS / 2) * TILE
    );
  }

  function isWallTile(col, row) {
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) {
      return true;
    }

    const tile = MAZE_MAP[row][col];

    return tile === '#' || tile === '-';
  }

  // Verifica se um círculo (x, z) de raio r colide com alguma parede
  function collides(x, z, r) {
    const minCol = Math.floor((x - r) / TILE + COLS / 2);
    const maxCol = Math.floor((x + r) / TILE + COLS / 2);
    const minRow = Math.floor((z - r) / TILE + ROWS / 2);
    const maxRow = Math.floor((z + r) / TILE + ROWS / 2);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (!isWallTile(col, row)) {
          continue;
        }

        const left = (col - COLS / 2) * TILE;
        const top = (row - ROWS / 2) * TILE;
        const nearestX = Math.max(left, Math.min(x, left + TILE));
        const nearestZ = Math.max(top, Math.min(z, top + TILE));
        const dx = x - nearestX;
        const dz = z - nearestZ;

        if (dx * dx + dz * dz < r * r) {
          return true;
        }
      }
    }

    return false;
  }

  // --------------------------------------------------
  // TEXTURAS PROCEDURAIS
  // --------------------------------------------------
  function createWallTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a1a3a';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#2f6bff';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    ctx.strokeStyle = '#12306e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;

    return texture;
  }

  function createFloorTexture() {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#07070d';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, size / 2, size / 2);
    ctx.fillRect(size / 2, size / 2, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(COLS, ROWS);
    texture.encoding = THREE.sRGBEncoding;

    return texture;
  }

  // --------------------------------------------------
  // CENA, RENDERER E CÂMERAS
  // --------------------------------------------------
  const canvas = document.getElementById('gameCanvas');
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.autoClear = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 18, 60);

  // Câmera POV (perspectiva, primeira pessoa)
  const povCamera = new THREE.PerspectiveCamera(
    75,
    1,
    0.1,
    200
  );

  // Câmera da vista superior (perspectiva, mostra o labirinto inteiro)
  const TOP_FOV = 50;
  const topCamera = new THREE.PerspectiveCamera(
    TOP_FOV,
    1,
    0.1,
    500
  );

  const mazeSize = Math.max(COLS, ROWS) * TILE;
  const topDistance = (mazeSize / 2) / Math.tan(THREE.MathUtils.degToRad(TOP_FOV / 2)) * 1.05;

  topCamera.position.set(
    0,
    topDistance,
    0
  );
  topCamera.up.set(0, 0, -1);
  topCamera.lookAt(0, 0, 0);
  topCamera.layers.enable(1);

  // --------------------------------------------------
  // LUZES
  // --------------------------------------------------
  const ambientLight = new THREE.AmbientLight(0x5566aa, 0.9);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
  sunLight.position.set(10, 40, 20);
  scene.add(sunLight);

  // Lanterna que acompanha o jogador
  const playerLight = new THREE.PointLight(0xffe9a8, 1.2, 22, 1.5);
  scene.add(playerLight);

  // --------------------------------------------------
  // CENÁRIO: CHÃO, PAREDES E ITENS
  // --------------------------------------------------
  const mazeGroup = new THREE.Group();
  scene.add(mazeGroup);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(COLS * TILE, ROWS * TILE),
    new THREE.MeshStandardMaterial({
      map: createFloorTexture(),
      roughness: 0.9
    })
  );

  floor.rotation.x = -Math.PI / 2;
  mazeGroup.add(floor);

  const wallTexture = createWallTexture();
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    roughness: 0.6,
    metalness: 0.1
  });

  const wallGeometry = new THREE.BoxGeometry(
    TILE,
    WALL_HEIGHT,
    TILE
  );

  const doorMaterial = new THREE.MeshStandardMaterial({
    color: 0xff9ad5,
    emissive: 0x551133
  });

  const dotGeometry = new THREE.SphereGeometry(0.18, 12, 12);
  const dotMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe9b0,
    emissive: 0x665533
  });

  const pelletGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const pelletMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffee99,
    emissiveIntensity: 0.9
  });

  const dots = [];
  const pellets = [];
  const ghostSpawns = [];
  let playerSpawn = tileToWorld(1, 1);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tile = MAZE_MAP[row][col];
      const position = tileToWorld(col, row);

      if (tile === '#') {
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);

        wall.position.set(
          position.x,
          WALL_HEIGHT / 2,
          position.z
        );

        mazeGroup.add(wall);
      } else if (tile === '-') {
        const door = new THREE.Mesh(
          new THREE.BoxGeometry(TILE, 0.4, TILE * 0.3),
          doorMaterial
        );

        door.position.set(
          position.x,
          WALL_HEIGHT / 2,
          position.z
        );

        mazeGroup.add(door);
      } else if (tile === '.') {
        const dot = new THREE.Mesh(dotGeometry, dotMaterial);

        dot.position.set(
          position.x,
          1.0,
          position.z
        );

        mazeGroup.add(dot);
        dots.push(dot);
      } else if (tile === 'o') {
        const pellet = new THREE.Mesh(pelletGeometry, pelletMaterial);

        pellet.position.set(
          position.x,
          1.2,
          position.z
        );

        mazeGroup.add(pellet);
        pellets.push(pellet);

        const pelletLight = new THREE.PointLight(0xffee99, 0.6, 9, 2);

        pelletLight.position.copy(pellet.position);
        mazeGroup.add(pelletLight);
      } else if (tile === 'P') {
        playerSpawn = position;
      } else if (tile === 'G') {
        ghostSpawns.push(position);
      }
    }
  }

  // --------------------------------------------------
  // MARCADOR DO JOGADOR (visível apenas na vista superior)
  // --------------------------------------------------
  // TODO: substituir pelo modelo 3D do Pac-Man quando estiver pronto
  const playerMarker = new THREE.Group();

  const markerBody = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 20, 20),
    new THREE.MeshStandardMaterial({
      color: 0xffd200,
      emissive: 0x887000
    })
  );

  const markerArrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.7, 1.6, 16),
    new THREE.MeshStandardMaterial({
      color: 0xff5500,
      emissive: 0x662200
    })
  );

  markerArrow.rotation.x = -Math.PI / 2;
  markerArrow.position.set(0, 0, -1.6);

  markerBody.layers.set(1);
  markerArrow.layers.set(1);
  playerMarker.add(markerBody);
  playerMarker.add(markerArrow);
  playerMarker.position.y = 1.2;
  scene.add(playerMarker);

  // --------------------------------------------------
  // ESTADO DO JOGADOR E CONTROLES
  // --------------------------------------------------
  const player = {
    x: playerSpawn.x,
    z: playerSpawn.z,
    yaw: 0
  };

  const keys = {};

  window.addEventListener('keydown', (event) => {
    keys[event.code] = true;

    if (event.code.startsWith('Arrow')) {
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    keys[event.code] = false;
  });

  function updatePlayer(dt) {
    if (keys['KeyA'] || keys['ArrowLeft']) {
      player.yaw += TURN_SPEED * dt;
    }

    if (keys['KeyD'] || keys['ArrowRight']) {
      player.yaw -= TURN_SPEED * dt;
    }

    const forwardX = -Math.sin(player.yaw);
    const forwardZ = -Math.cos(player.yaw);
    const rightX = -forwardZ;
    const rightZ = forwardX;

    let moveX = 0;
    let moveZ = 0;

    if (keys['KeyW'] || keys['ArrowUp']) {
      moveX += forwardX;
      moveZ += forwardZ;
    }

    if (keys['KeyS'] || keys['ArrowDown']) {
      moveX -= forwardX;
      moveZ -= forwardZ;
    }

    if (keys['KeyE']) {
      moveX += rightX;
      moveZ += rightZ;
    }

    if (keys['KeyQ']) {
      moveX -= rightX;
      moveZ -= rightZ;
    }

    const length = Math.hypot(moveX, moveZ);

    if (length > 0) {
      moveX = (moveX / length) * MOVE_SPEED * dt;
      moveZ = (moveZ / length) * MOVE_SPEED * dt;

      // Colisão separada por eixo para permitir deslizar nas paredes
      if (!collides(player.x + moveX, player.z, PLAYER_RADIUS)) {
        player.x += moveX;
      }

      if (!collides(player.x, player.z + moveZ, PLAYER_RADIUS)) {
        player.z += moveZ;
      }
    }

    povCamera.position.set(
      player.x,
      EYE_HEIGHT,
      player.z
    );
    povCamera.rotation.set(0, player.yaw, 0);

    playerLight.position.set(
      player.x,
      EYE_HEIGHT + 0.5,
      player.z
    );

    playerMarker.position.x = player.x;
    playerMarker.position.z = player.z;
    playerMarker.rotation.y = player.yaw;
  }

  // --------------------------------------------------
  // JANELA, VIEWPORTS E RENDERIZAÇÃO
  // --------------------------------------------------
  const topBorder = document.createElement('div');

  topBorder.style.position = 'absolute';
  topBorder.style.border = '3px solid #ffd200';
  topBorder.style.pointerEvents = 'none';
  topBorder.style.boxSizing = 'border-box';
  document.body.appendChild(topBorder);

  let width = window.innerWidth;
  let height = window.innerHeight;
  let topSize = 0;
  const TOP_MARGIN = 16;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height, false);

    povCamera.aspect = width / height;
    povCamera.updateProjectionMatrix();

    topCamera.aspect = 1;
    topCamera.updateProjectionMatrix();

    topSize = Math.max(200, Math.round(Math.min(width, height) * 0.32));

    topBorder.style.width = topSize + 'px';
    topBorder.style.height = topSize + 'px';
    topBorder.style.top = TOP_MARGIN + 'px';
    topBorder.style.right = TOP_MARGIN + 'px';
  }

  window.addEventListener('resize', resize);
  resize();

  function render() {
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
    renderer.clear();
    renderer.render(scene, povCamera);

    const topX = width - topSize - TOP_MARGIN;
    const topY = height - topSize - TOP_MARGIN;

    renderer.setScissorTest(true);
    renderer.setViewport(topX, topY, topSize, topSize);
    renderer.setScissor(topX, topY, topSize, topSize);
    renderer.clear();
    renderer.render(scene, topCamera);
  }

  // --------------------------------------------------
  // LOOP PRINCIPAL
  // --------------------------------------------------
  const clock = new THREE.Clock();

  function loop() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    updatePlayer(dt);

    pellets.forEach((pellet) => {
      pellet.scale.setScalar(1 + 0.15 * Math.sin(time * 5));
    });

    render();
    requestAnimationFrame(loop);
  }

  loop();
})();
