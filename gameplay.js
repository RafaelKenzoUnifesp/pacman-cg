
class Gameplay {

    constructor(maze, player, cherry, hud) {

        this.maze = maze;
        this.player = player;
        this.cherry = cherry;
        this.hud = hud;
        this.ghostHouse = null;
        this.ghosts = [];
        this.onPowerPellet = null;

        this.score = 0;
        this.totalDots = maze.dots.length + maze.pellets.length;
        this.collectedDots = 0;

        this.cherryCollected = false;
        this.finished = false;
        this.gameOver = false;
        this.victory = false;
        this.ghostsEatenThisPower = 0;

        this.dotPoints = 10;
        this.powerPoints = 50;
        this.cherryPoints = 100;

        this.updateHUD();
    }

    // Calcula a distância entre jogador e objeto
    distanceTo(item) {

        const dx = this.player.x - item.position.x;
        const dz = this.player.z - item.position.z;

        return Math.sqrt(dx * dx + dz * dz);
    }

    // Adiciona pontos à pontuação
    addScore(points) {

        this.score += points;

        this.updateHUD();
    }

    // Remove uma bolinha normal
    collectDot(dot) {

        this.maze.object3D.remove(dot);

        this.maze.dots =
            this.maze.dots.filter(item => item !== dot);

        this.collectedDots++;
        if (this.ghostHouse) this.ghostHouse.onDotEaten();

        this.addScore(this.dotPoints);
    }

    // Remove uma bolinha especial
    collectPowerPellet(pellet) {

        this.maze.object3D.remove(pellet);

        this.maze.pellets =
            this.maze.pellets.filter(item => item !== pellet);

        this.collectedDots++;
        if (this.ghostHouse) this.ghostHouse.onDotEaten();

        // Cada nova bola especial reinicia a sequência de pontos dos fantasmas.
        this.ghostsEatenThisPower = 0;
        if (this.onPowerPellet) this.onPowerPellet();

        this.addScore(this.powerPoints);
    }

    // Coleta a cereja
    collectCherry() {
        
        if (this.cherryCollected) {
        return;
        }

        this.cherryCollected = true;

        this.cherry.object3D.visible = false;

        this.addScore(this.cherryPoints);

    }

    // Verifica a coleta das bolinhas
    checkDots() {

        const collectionRadius = 1.0;

        [...this.maze.dots].forEach(dot => {

            if (this.distanceTo(dot) <= collectionRadius) {

                this.collectDot(dot);
            }
        });

        [...this.maze.pellets].forEach(pellet => {

            if (this.distanceTo(pellet) <= collectionRadius) {

                this.collectPowerPellet(pellet);
            }
        });
    }

    // Verifica a coleta da fruta
    checkCherry() {

        if (this.cherryCollected) {
            return;
        }

        const cherryPosition = this.cherry.object3D.position;

        const dx = this.player.x - cherryPosition.x;
        const dz = this.player.z - cherryPosition.z;

        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance <= 1.3) {

            this.collectCherry();

        }
    }

    // Atualiza a interface
    updateHUD() {

        if (!this.hud) {
            return;
        }

        if (this.gameOver) {
            this.hud.classList.add("game-over");
            this.hud.classList.remove("game-won");
            this.hud.innerHTML =
                `GAME OVER<br>PONTUAÇÃO FINAL: ${this.score}<br>PRESSIONE F5 PARA RECOMEÇAR`;
            return;
        }

        if (this.victory) {
            this.hud.classList.add("game-won");
            this.hud.classList.remove("game-over");
            this.hud.innerHTML =
                `FASE CONCLUÍDA!<br>PONTUAÇÃO FINAL: ${this.score}`;
            return;
        }

        this.hud.classList.remove("game-over", "game-won");
        this.hud.innerHTML = `PONTUAÇÃO: ${this.score}<br>`;
    }

    // Verifica se todas as bolinhas foram coletadas
    checkVictory() {

        const remaining =
            this.maze.dots.length + this.maze.pellets.length;

        if (remaining === 0 && !this.finished) {
            this.victory = true;
            this.finished = true;
            this.updateHUD();
        }
    }

    // Verifica o contato entre Pac-Man e os fantasmas após o movimento deles.
    checkGhostCollisions() {

        if (this.finished) {
            return;
        }

        const playerRadius = this.player.radius || 0.8;
        const ghostRadius = 0.9;
        const collisionDistance = playerRadius + ghostRadius;
        const collisionDistanceSquared = collisionDistance * collisionDistance;

        for (const ghost of this.ghosts) {

            // Fantasmas na casa ou retornando após serem comidos não oferecem perigo.
            if (ghost.state !== "active") {
                continue;
            }

            const dx = this.player.x - ghost.x;
            const dz = this.player.z - ghost.z;
            const distanceSquared = dx * dx + dz * dz;

            if (distanceSquared > collisionDistanceSquared) {
                continue;
            }

            if (ghost.mode === "frightened" && ghost.frightenedTime > 0) {
                this.eatGhost(ghost);
            } else {
                this.triggerGameOver();
                return;
            }
        }
    }

    // Come um fantasma vulnerável e aplica a pontuação crescente do Pac-Man clássico.
    eatGhost(ghost) {

        if (!ghost.eat()) {
            return;
        }

        const points = Math.min(200 * (2 ** this.ghostsEatenThisPower), 1600);
        this.ghostsEatenThisPower++;
        this.addScore(points);
    }

    // Encerra a partida sem reiniciar automaticamente; o jogador usa F5.
    triggerGameOver() {

        if (this.finished) {
            return;
        }

        this.gameOver = true;
        this.finished = true;
        this.updateHUD();
    }

    // Ciclo principal da jogabilidade
    update() {

        if (this.finished) {
            return;
        }

        this.checkDots();

        this.checkCherry();

        this.checkVictory();
    }

}
