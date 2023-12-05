function choice(l) {
    return l[Math.floor(Math.random() * l.length)];
}

const e_score = document.getElementById("score");
const e_hiscore = document.getElementById("hiscore");

function formatScore(score) {
    return score.toFixed().padStart(7, 0) + "00";
}

let diff = 2;
if (localStorage["tohou.diff"] !== undefined) {
    diff = parseInt(localStorage["tohou.diff"]);
    if (isNaN(diff)) diff = 2;
    let el = Object.values(document.getElementById("diff").children).find(i => i.value == diff);
    if (el) el.checked = true;
}
function updateDiff(n) {
    localStorage["tohou.diff"] = `${n}`;
    reset();
    if (localStorage[`tohou.hiscore.${n}`]) {
        hiscore = parseInt(localStorage[`tohou.hiscore.${n}`]);
        e_hiscore.textContent = formatScore(hiscore)
    } else {
        e_hiscore.textContent = formatScore(0);
    }
    diff = n;
}

const e_health = document.getElementById("healthnum");
const e_healthbar = document.getElementById("healthbaralive");

function updateHealth() {
    if (player.health < 0) player.health = -1;
    e_healthbar.style.transform = `translateX(-${100 - player.health}%)`;
    e_health.textContent = player.health;
}

let lastScore = formatScore(0);
let score = 0;
let hiscore = 0;
if (localStorage[`tohou.hiscore.${diff}`]) {
    hiscore = parseInt(localStorage[`tohou.hiscore.${diff}`]);
    e_hiscore.textContent = formatScore(hiscore)
}
function updateHiscore() {
    e_hiscore.textContent = lastScore;
    localStorage[`tohou.hiscore.${diff}`] = hiscore = score;
}
updateHiscore();
function updateScore() {
    const newScore = formatScore(score);
    if (newScore === lastScore) return;
    lastScore = newScore;
    if (score > hiscore) updateHiscore();
    e_score.textContent = newScore;
}


const can = document.getElementById("can");
const ctx = can.getContext("2d");

const keys = {};
window.addEventListener("keydown", event => {
    keys[event.key.toLowerCase()] = true;
});
window.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
});

let scale = 1;
const width = 200;
const height = width / 0.7;
function resize() {
    can.width = can.clientWidth;
    can.height = can.width / 0.7;
    scale = can.width / width;
}
resize();
window.onresize = resize;


class Vector {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    static fromPolar(mag, dir) {
        return new Vector(
            Math.sin(dir) * mag,
            Math.cos(dir) * mag
        );
    }
    set(x, y) {
        this.x = x;
        this.y = y;
    }
    clone() {
        return new Vector(this.x, this.y);
    }
    toPrimitive() {
        return this.x * 256 + this.y;
    }
    iaddmul(other, mul) {
        this.x += other.x * mul;
        this.y += other.y * mul;
    }
    floordiv(div) {
        return new Vector(
            Math.floor(this.x / div),
            Math.floor(this.y / div)
        );
    }
    disSquared(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return dx * dx + dy * dy;
    }
    dirWith(other) {
        return Math.atan2(
            this.x - other.x,
            this.y - other.y,
        ) + Math.PI;
    }
    gridPos() {
        return this.floordiv(50);
    }
    gridPosPrimitive() {
        return (
            Math.floor(this.x / 50) * 256 +
            Math.floor(this.y / 50)
        );
    }
    eq(other) {
        return (
            other.x === this.x &&
            other.y === this.y
        )
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
class Collision extends Physics {
    constructor(pos, vel, r) {
        super(pos, vel);
        this.r = r;
        this.dead = false;
        this.updateGrid();
        effectShoot.play();
    }
    updateGrid() {
        const newGridPos = this.pos.gridPosPrimitive();
        if (this.gridPos !== newGridPos) {
            if (this.gridPos) {
                grid.get(this.gridPos).delete(this);
            }
            this.gridPos = newGridPos;
            let set = grid.get(this.gridPos);
            if (!set) {
                set = new Set();
                grid.set(this.gridPos, set);
            }
            set.add(this);
        }
    }
    update(dt) {
        super.update(dt);
        this.updateGrid();
    }
    isColliding(other) {
        const sr = this.r + other.r;
        return this.pos.disSquared(other.pos) < sr * sr;
    }
    kill() {
        grid.get(this.gridPos).delete(this);
        this.dead = true;
    }
}
class Proj extends Collision {
    static colors = ["transparent", "#8f8", "#88f", "#fa8", "#f88", "#f8f"];
    constructor(pos, vel, dmg, bounces, time) {
        super(pos, vel, dmg + 1);
        this.dmg = dmg;
        this.color = Proj.colors[dmg];
        this.bounces = bounces;
        this.time = time;
        effectShoot.play();
    }
    update(dt) {
        super.update(dt);
        
        this.time -= dt;
        if (this.time < 0) {
            this.kill();
        }

        if (this.ghost) return;

        if (
            (this.pos.x - this.r < 0 && this.vel.x < 0) ||
            (this.pos.x + this.r > width && this.vel.x > 0)
        ) {
            if (this.bounces === 0) {
                this.ghost = true;
                this.time = 500;
            } else {
                this.vel.x *= -1;
                this.bounces -= 1;
                if (this.bounces < 0) this.kill();
            }
        }
        if (
            (this.pos.y - this.r < 0 && this.vel.y < 0) ||
            (this.pos.y + this.r > height && this.vel.y > 0)
        ) {
            if (this.bounces === 0) {
                this.ghost = true;
                this.time = 500;
            } else {
                this.vel.y *= -1;
                this.bounces -= 1;
                if (this.bounces < 0) this.kill();
            }
        }
    }
}
class Shot {
    color = "#555"
    r = 2
    constructor(pos, vel) {
        this.pos = pos || new Vector();
        this.vel = vel || new Vector();
    }
    update(dt) {
        this.pos.iaddmul(this.vel, dt);
        if (this.pos.y < -this.r) {
            this.dead = true;
            score += 2;
            updateScore();
        }
    }
}
class Player {
    speed = 0.1;
    r = 2;
    color = "red";
    health = 100;
    healthMax = 100;
    constructor(pos) {
        this.pos = pos || new Vector();
        this.control = new Vector();
    }
    update(dt) {

        const gridPos = this.pos.gridPos();
        gridPos.x -= 1;
        gridPos.y -= 1;
        for (let y = 0; y < 3; ++y) {
            for (let x = 0; x < 3; ++x) {
                let objs = grid.get(gridPos.toPrimitive());
                if (objs) {
                    for (let obj of objs) {
                        // console.log(obj)
                        if (obj.isColliding(player)) {
                            this.health -= obj.dmg;
                            updateHealth();
                            this.color = `hsl(0deg 50% ${this.health / 2}%)`;
                            if (this.health < 0) {
                                this.health = 0;
                                die();
                            }
                        }
                    }
                }
                gridPos.x += 1;
            }
            gridPos.x -= 3;
            gridPos.y += 1;
        }
        let mag = this.speed;
        if (this.control.x !== 0 && this.control.y !== 0) mag = mag / Math.sqrt(2);
        this.pos.iaddmul(this.control, dt * mag);
        if (this.pos.x < this.r) {
            this.pos.x = this.r;
        } else if (this.pos.x > width - this.r) {
            this.pos.x = width - this.r
        }
        if (this.pos.y < this.r) {
            this.pos.y = this.r;
        } else if (this.pos.y > height - this.r) {
            this.pos.y = height - this.r;
        }
    }
}

const objs = new Set();
const grid = new Map();

const player = new Player();

function sleep(time) {
    return new Promise(resolve => {
        window.setTimeout(resolve, time * 1000);
    });
}

let mouse = undefined;
can.addEventListener("pointerdown", event => {
    mouse = new Vector(event.layerX / can.width, event.layerY / can.height);
    event.preventDefault();
    can.setPointerCapture(event.pointerId);
});
can.addEventListener("pointermove", event => {
    event.preventDefault();
    if (mouse === undefined) return;
    mouse.set(event.layerX / can.width, event.layerY / can.height);
});
can.addEventListener("pointerup", event => {
    event.preventDefault();
    mouse = undefined;
});

let timeOld = performance.now();
let timeDelta = 0;
let lastShot = undefined;
let update = false;
let timeSinceUpdate = 0;
let timeSinceLastAttack = 0;
function frame() {

    const timeNow = performance.now();
    timeDelta = timeNow - timeOld;
    timeOld = timeNow;
    
    ctx.clearRect(0, 0, can.width, can.height);
    ctx.resetTransform();
    ctx.scale(scale, scale);

    if (update) {

        if (timeSinceLastAttack > 4000) {
            timeSinceLastAttack = 0;
            
            let nbasic = diff + 2;
            let ntarget = Math.random() > 0.5 ? 1 : 0;
            let nspecial = 0;
            while (Math.random() < 0.3) {
                nspecial += 1
                nbasic -= 1;
            }
            const attacks = new Set();
            for (let _ = 0; _ < nbasic; ++_) attacks.add(choice(basic));
            for (let _ = 0; _ < ntarget; ++_) attacks.add(choice(target));
            for (let _ = 0; _ < nspecial; ++_) attacks.add(choice(special));
            for (const attack of attacks) {
                attack(new Vector(width / 2, height / 4));
            }
        } else {
            timeSinceLastAttack += timeDelta;
        }

        if (mouse) {
            console.log(mouse)
            player.control.x = (mouse.x > 0.3 ? 1 : 0) - (mouse.x < -0.3 ? 1 : 0);
            player.control.y = (mouse.y > 0.3 ? 1 : 0) - (mouse.y < -0.3 ? 1 : 0);
        } else {
            player.control.x = (keys["d"] ? 1 : 0) - (keys["a"] ? 1 : 0);
            player.control.y = (keys["s"] ? 1 : 0) - (keys["w"] ? 1 : 0);
        }
        
        if (
            !lastShot ||
            lastShot.dead ||
            lastShot.pos.disSquared(player.pos) > 500
        ) {
            lastShot = new Shot(
                player.pos.clone(),
                Vector.fromPolar(0.3, Math.PI)
            );
            objs.add(lastShot);
            const num = (
                (keys["q"] || 0) +
                (keys["e"] || 0)
            );
            for (let i = 1; i < num + 1; ++i) {
                objs.add(new Shot(
                    player.pos.clone(),
                    Vector.fromPolar(0.3, Math.PI + 0.3 * i)
                ));
                objs.add(new Shot(
                    player.pos.clone(),
                    Vector.fromPolar(0.3, Math.PI - 0.3 * i)
                ));
            }
            
        }
        timeSinceUpdate = 0;
    } else {
        timeSinceUpdate += timeDelta;
        ctx.translate(0, 0.001 * timeSinceUpdate ** 2);
    }

    for (const obj of objs) {
        if (obj.dead) 
            objs.delete(obj);
        if (update)
            obj.update(timeDelta);
        if (obj instanceof Proj || obj instanceof Player || obj instanceof Shot) {
            ctx.fillStyle = obj.color;
            ctx.beginPath();
            ctx.arc(obj.pos.x, obj.pos.y, obj.r, 0, Math.PI * 2);
            ctx.fill();
        }
        if (obj instanceof Player) {
            ctx.beginPath();
            ctx.arc(obj.pos.x, obj.pos.y, obj.r * 5, 0, Math.PI * 2);
            ctx.strokeStyle = obj.color;
            ctx.stroke();
        }
        
    }

    window.requestAnimationFrame(frame);
}

function reset() {
    objs.clear();
    grid.clear();
    update = true;
    player.pos.set(width / 2, height / 4 * 3);
    player.health = player.healthMax;
    updateHealth()
    player.color = "red";
    objs.add(player);
    lastShot = undefined;
    score = 0;
    updateScore();
}
function die() {
    update = false;
    window.setTimeout(reset, 1000);
}
reset();

window.requestAnimationFrame(frame);


