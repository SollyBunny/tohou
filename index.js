const can = document.getElementById("can");
const ctx = can.getContext("2d");

function resize() {
    can.width = can.clientWidth;
    can.height = can.clientHeight;
}
resize();
window.onresize = resize;


class Vector {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    iaddmul(other, mul) {
        this.x += other.x * mul;
        this.y += other.y * mul;
    }
}
class Physics {
    constructor(pos, vel) {
        this.pos = pos || new Vector();
        this.vel = vel || new Vector();
    }
    update(dt) {
        this.pos.iaddmul(this.vel, dt);
    }
}
class Collision extends Physics{
    constructor(pos, vel, r) {
        super(pos, vel);
        this.r = r;
    }
    update(dt) {
        super().update(dt);
    }
}

const objs = new Set();

const player = new Collision(
    new Vector(can.width / 2, can.w),
    undefined,
    5
)

let timeOld = performance.now();
let timeDelta = 0;
function frame() {
    const timeNow = performance.now();
    timeDelta = timeNow - timeDelta;
    

}