export class OfficeInput {
    constructor() {
        this.keys = {
            ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
            w: false, s: false, a: false, d: false
        };
        this.player = null;
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    attach(player) {
        this.player = player;
        window.addEventListener("keydown", this.handleKeyDown);
        window.addEventListener("keyup", this.handleKeyUp);
    }

    detach() {
        window.removeEventListener("keydown", this.handleKeyDown);
        window.removeEventListener("keyup", this.handleKeyUp);
        this.player = null;
    }

    handleKeyDown(e) {
        if (this.keys.hasOwnProperty(e.key)) {
            this.keys[e.key] = true;
        }
    }

    handleKeyUp(e) {
        if (this.keys.hasOwnProperty(e.key)) {
            this.keys[e.key] = false;
        }
    }

    getMovement() {
        let x = 0;
        let y = 0;
        if (this.keys.ArrowUp || this.keys.w) y -= 1;
        if (this.keys.ArrowDown || this.keys.s) y += 1;
        if (this.keys.ArrowLeft || this.keys.a) x -= 1;
        if (this.keys.ArrowRight || this.keys.d) x += 1;

        // Normalize vector
        const length = Math.sqrt(x * x + y * y);
        if (length > 0) {
            x /= length;
            y /= length;
        }
        return { x, y };
    }
}
