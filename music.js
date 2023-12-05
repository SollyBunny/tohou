function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time * 1000));
}

const music = new Audio("./music.m4a");
music.loop = true;

async function musicOn() {
	music.play();
	music.volume = 0;
	for (let i = 0; i < 49; ++i) {
		music.volume += 0.002;
		await sleep(0.002);
	}
	music.volume = 0.1;
}
async function musicOff() {
	if (music.volume === 0) return;
	for (let i = 0; i < 49; ++i) {
		music.volume -= 0.01;
		await sleep(0.01);
	}
	music.volume = 0;
	music.pause();
}

function firstInteract() {
	musicOn();
}

let interacted = false;
if (document.hidden === false) {
	interacted = true;
	firstInteract();
}

document.addEventListener("visibilitychange", () => {
	if (document.hidden === false) {
		if (interacted === false) {
			interacted = true;
			firstInteract();
		}
	}
});
window.addEventListener("onpointerdown", () => {
	if (interacted === false) {
		interacted = true;
		firstInteract();
	}
});

class Effect {
	constructor(src, num) {
		this.audio = [];
		this.volume = 0.1;
		for (let i = 0; i < num; ++i) {
			this.audio.push([
				false,
				new Audio(src)
			]);
		}
		this.duration = this.audio[0].duration;
		this.seperation = this.duration / num;
		this.last = 0;
	}
	play() {
		const now = performance.now();
		if (now - this.last < this.seperation) return;
		this.last = now;
		for (let i = 0; i < this.audio.length; ++i) {
			if (this.audio[i][0] === true) continue;
			this.audio[i][0] = true;
			this.audio[i][1].volume = this.volume;
			this.audio[i][1].play();
			window.setTimeout(() => {
				this.audio[i][0] = false;
			}, this.duration);
			return;
		}
	}
}

const effectClose = new Effect("./close.wav", 10);
const effectShoot = new Effect("./shoot.wav", 50);
const effectDie = new Effect("./die.wav", 2);