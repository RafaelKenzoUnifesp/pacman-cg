
class Gameplay {

    constructor(maze, player, cherry, hud) {

        this.maze = maze;
        this.player = player;
        this.cherry = cherry;
        this.hud = hud;

        this.score = 0;
        this.totalDots = maze.dots.length + maze.pellets.length;
        this.collectedDots = 0;

        this.cherryCollected = false;
        this.finished = false;

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

        this.addScore(this.dotPoints);
    }

    // Remove uma bolinha especial
    collectPowerPellet(pellet) {

        this.maze.object3D.remove(pellet);

        this.maze.pellets =
            this.maze.pellets.filter(item => item !== pellet);

        this.collectedDots++;

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

        const remaining =
            this.maze.dots.length + this.maze.pellets.length;

        this.hud.innerHTML =
            `PONTUAÇÃO: ${this.score}<br>`;
    }

    // Verifica se todas as bolinhas foram coletadas
    checkVictory() {

        const remaining =
            this.maze.dots.length + this.maze.pellets.length;

        if (remaining === 0 && !this.finished) {

            this.finished = true;

            this.hud.innerHTML =
                `FASE CONCLUÍDA!<br>
                 PONTUAÇÃO FINAL: ${this.score}`;
        }
    }

    // Ciclo principal da jogabilidade
    update() {

        if (this.finished) {
            return;
        }

        this.checkDots();

        this.checkCherry();

        this.checkVictory();

        this.updateHUD();
    }
}
