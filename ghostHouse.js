// Controla a fila, os dots pessoais e a liberação por timer ou contador global.
class GhostHouse {
    constructor(level = 1, debug = false) {
        this.level = level;
        this.debug = debug;
        this.queue = ["Pinky", "Inky", "Clyde"];
        this.personalThresholds = level === 1 ? [0, 30, 60] :
            level === 2 ? [0, 0, 50] : [0, 0, 0];
        this.globalThresholds = [7, 17, 32];
        this.personalCounts = { Pinky: 0, Inky: 0, Clyde: 0 };
        this.globalMode = false;
        this.globalCount = 0;
        this.idleTime = 0;
        this.lastDotTime = 0;
        this.lastReleaseReason = null;
    }

    onDotEaten() {
        this.idleTime = 0;
        this.lastDotTime = 0;
        if (!this.queue.length) return;
        if (this.globalMode) {
            this.globalCount++;
            return;
        }
        this.personalCounts[this.queue[0]]++;
    }

    // Ativa o contador global e zera seu progresso para a vida recém perdida.
    onLifeLost() {
        this.globalMode = true;
        this.globalCount = 0;
        this.idleTime = 0;
    }

    update(dt) {
        if (!this.queue.length) return null;
        this.idleTime += dt;
        this.lastDotTime += dt;
        const idleLimit = this.level >= 5 ? 3 : 4;
        const name = this.queue[0];
        const queueIndex = 3 - this.queue.length;
        if (this.globalMode) {
            if (this.globalCount >= this.globalThresholds[queueIndex]) return this.releaseNext("global");
            if (this.lastDotTime >= idleLimit) {
                this.lastDotTime = 0;
                return this.releaseNext("timer");
            }
            return null;
        }
        if (this.personalCounts[name] >= this.personalThresholds[queueIndex]) return this.releaseNext("personal");
        if (this.lastDotTime >= idleLimit) {
            this.lastDotTime = 0;
            return this.releaseNext("timer");
        }
        return null;
    }

    releaseNext(reason) {
        const name = this.queue.shift() || null;
        if (!name) return null;
        this.lastReleaseReason = reason;
        if (this.debug) console.debug(`[GhostHouse] ${name} liberado (${reason})`);
        if (this.globalMode && name === "Clyde") this.globalMode = false;
        return name;
    }

    resetQueue() {
        this.queue = ["Pinky", "Inky", "Clyde"];
        this.personalCounts = { Pinky: 0, Inky: 0, Clyde: 0 };
        this.globalMode = false;
        this.globalCount = 0;
        this.idleTime = 0;
        this.lastDotTime = 0;
    }
}
