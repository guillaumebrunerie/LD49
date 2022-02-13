import * as Phaser from "phaser";

import * as Conf from "./configuration";
import {Direction8, dPosToDirection8, AnimationEntries} from "./utils";
import MainScene, {Target} from "./MainScene";

import {projectOutside} from "./movement";

const laserOffset = {
	"N":  {dx:   2, dy: -17},
	"NE": {dx:  12, dy: -14},
	"E":  {dx:  24, dy: 1},
	"SE": {dx:  22, dy: 16},
	"S":  {dx:  -6, dy: 21},
	"SW": {dx: -22, dy: 16},
	"W":  {dx: -23, dy: 1},
	"NW": {dx: -16, dy: -18},
};

const playerWalkAnimations: AnimationEntries = {
	key: "Walk",
	repeat: -1,
	entries: [
		{key: "W", anim: {frames: [13, 14, 15]}},
		{key: "E", anim: {frames: [26, 27, 28]}},
		{key: "N", anim: {frames: [65, 66, 67]}},
		{key: "S", anim: {frames: [0, 1, 2]}},
		{key: "NW", anim: {frames: [52, 53, 54]}},
		{key: "NE", anim: {frames: [56, 57, 58]}},
		{key: "SW", anim: {frames: [39, 40, 41]}},
		{key: "SE", anim: {frames: [43, 44, 45]}},
	]
};

const laserAnimations: AnimationEntries = {
	key: "Laser",
	repeat: -1,
	entries: [
		{key: "W", anim: {start: 0, end: 2}},
		{key: "E", anim: {start: 3, end: 5}},
		{key: "N", anim: {start: 6, end: 8}},
		{key: "S", anim: {start: 9, end: 11}},
		{key: "NW", anim: {start: 13, end: 15}},
		{key: "NE", anim: {start: 16, end: 18}},
		{key: "SW", anim: {start: 19, end: 21}},
		{key: "SE", anim: {start: 22, end: 24}},
		{key: "Particles", anim: {start: 26, end: 29}},
	]
};

const firingFrame = {
	"W": 17,
	"E": 30,
	"N": 68,
	"S": 3,
	"NW": 55,
	"NE": 59,
	"SW": 42,
	"SE": 46,
};

export default class extends Phaser.GameObjects.Container {
	scene: MainScene;
	cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
	laser: Phaser.GameObjects.Sprite;
	sprite: Phaser.GameObjects.Sprite;
	direction: Direction8 = "N";
	isWalking = false;
	isFiring = false;
	firingAmount = 0;
	currentX: number;
	currentY: number;
	target: Target | null = null;

	static createAnimations(anims: Phaser.Animations.AnimationManager) {
		[playerWalkAnimations].forEach(({key, entries, repeat}) => {
			entries.forEach(({key: key2, anim}) => {
				anims.create({
					key: `Player${key}${key2}`,
					frameRate: 5,
					frames: anims.generateFrameNames("Player", anim),
					repeat,
				});
			});
		});

		[laserAnimations].forEach(({key, entries, repeat}) => {
			entries.forEach(({key: key2, anim}) => {
				anims.create({
					key: `${key}${key2}`,
					frameRate: 5,
					frames: anims.generateFrameNames("Laser", anim),
					repeat,
				});
			});
		});

		// Idle animations
		[playerWalkAnimations].forEach(({entries, repeat}) => {
			entries.forEach(({key: key2, anim}) => {
				anims.create({
					key: `PlayerIdle${key2}`,
					frameRate: 2,
					frames: anims.generateFrameNames("Player", anim),
					repeat,
				});
			});
		});
	}

	constructor(scene: MainScene, x: number, y: number) {
		super(scene, x, y);
		this.currentX = x;
		this.currentY = y;
		this.scene = scene;
		this.laser = scene.add.sprite(0, 0, "Laser", 12).setDepth(Conf.zIndex.laser);
		this.add(this.laser);
		this.sprite = scene.add.sprite(0, 0, "Player", 0).setDepth(Conf.zIndex.player);
		this.add(this.sprite);
		scene.add.existing(this).setDepth(Conf.zIndex.player);

		this.sprite.play("PlayerIdle" + this.direction);
		this.cursorKeys = scene.input.keyboard.createCursorKeys();
	}

	fireStart(target: Target) {
		// Pick direction
		const dx = target.x - this.x;
		const dy = target.y - this.y;
		this.direction = dPosToDirection8(dy, dx);

		this.sprite.setFrame(firingFrame[this.direction]);
		this.laser.play("Laser" + this.direction);
		this.laser.x = laserOffset[this.direction].dx;
		this.laser.y = laserOffset[this.direction].dy;
		this.isFiring = true;
		this.sprite.stop();
		this.scene.sound.play("Water", {loop: true});
		this.target = target;
	}

	fireEnd() {
		this.laser.stop();
		this.laser.setFrame(12);
		this.isFiring = false;
		this.sprite.play("PlayerIdle" + this.direction);
		this.firingAmount = 0;
		this.scene.sound.stopByKey("Water");
		this.target = null;
	}

	update(_time: number, delta: number) {
		if (this.isFiring) {
			this.firingAmount += delta;
			if (!this.target)
				throw new Error("No target");
			const resistance = {
				"crack": Conf.crackResistance,
				"tree": Conf.treeResistance,
				"demon": Conf.demonResistance,
			}[this.target?.sort];
			if (this.firingAmount > resistance * 1000) {
				this.fireEnd();
				this.scene.heal();
			}
			return;
		}

		const up    = this.cursorKeys.up.isDown;
		const down  = this.cursorKeys.down.isDown;
		const left  = this.cursorKeys.left.isDown;
		const right = this.cursorKeys.right.isDown;

		let direction: Direction8 | "" = "";
		if (down) {
			direction = "S";
		} else if (up) {
			direction = "N";
		}

		if (right) {
			direction += "E";
		} else if (left) {
			direction += "W";
		}

		const angles: {[key: string]: number} = {
			"E": 0,
			"SE": Math.PI / 4,
			"S": Math.PI / 2,
			"SW": 3 * Math.PI / 4,
			"W": Math.PI,
			"NW": 5 * Math.PI / 4,
			"N": 3 * Math.PI / 2,
			"NE": 7 * Math.PI / 4,
		};

		const angle = angles[direction] || 0;
		const deltaPos = direction == "" ? 0 : Conf.playerSpeed * delta / 1000;

		const result = projectOutside(
			{
				x: this.currentX / Conf.tileSize + deltaPos * Math.cos(angle),
				y: this.currentY / Conf.tileSize + deltaPos * Math.sin(angle),
			},
			this.scene.walls
		);

		this.currentX = result.x * Conf.tileSize;
		this.currentY = result.y * Conf.tileSize;
		this.x = Math.round(this.currentX);
		this.y = Math.round(this.currentY);

		if (direction) {
			if (!this.isWalking || direction !== this.direction) {
				this.sprite.play("PlayerWalk" + direction);
				this.scene.sound.play("PlayerMove", {loop: true});
			}
			this.direction = direction as Direction8;
		} else {
			if (this.isWalking) {
				this.sprite.play("PlayerIdle" + this.direction);
			}
			this.scene.sound.stopByKey("PlayerMove");
		}
		this.isWalking = !!direction;
	}
}
