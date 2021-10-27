import * as Phaser from "phaser";

import * as Conf from "./configuration";
import { Direction8, milliseconds } from "./utils";
import {idleFrame, firingFrame} from "./tiles";
import MainScene from "./MainScene";

const laserOffset = {
	"N": { dx: 2, dy: -17 },
	"NE": { dx: 12, dy: -14 },
	"E": { dx: 24, dy: 1 },
	"SE": { dx: 22, dy: 16 },
	"S": { dx: -6, dy: 21 },
	"SW": { dx: -22, dy: 16 },
	"W": { dx: -23, dy: 1 },
	"NW": { dx: -16, dy: -18 },
};

export default class {
	cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
	scene: MainScene;
	laser: Phaser.GameObjects.Sprite;
	sprite: Phaser.GameObjects.Sprite;
	direction: Direction8;
	isWalking: boolean;
	isFiring: boolean;
	firingAmount: milliseconds;

	constructor(scene: MainScene) {
		this.scene = scene;
		this.laser = scene.add.sprite(0, 0, "Laser", 12).setDepth(41);
		this.sprite = scene.add.sprite(0, 0, "Player", 0).setDepth(42);

		this.cursorKeys = scene.input.keyboard.createCursorKeys();
		this.direction = "N";
		this.isWalking = false;

		this.firingAmount = 0;
	}

	get x() {return this.sprite.x;}
	get y() {return this.sprite.y;}

	fireStart(pointBeingHealed: {x: number, y: number}) {
		// Pick direction
		const dx = pointBeingHealed.x * Conf.tileSize - this.x;
		const dy = - pointBeingHealed.y * Conf.tileSize - this.y;
		const angle = (Math.atan2(dy, dx) + Math.PI) * 180 / Math.PI;
		const directionIndex = Math.round(angle / 45);

		const table: Direction8[] = ["W", "NW", "N", "NE", "E", "SE", "S", "SW", "W"];
		this.direction = table[directionIndex];

		this.sprite.setFrame(firingFrame[this.direction]);
		this.laser.play("Laser" + this.direction);
		this.laser.x = this.sprite.x + laserOffset[this.direction].dx;
		this.laser.y = this.sprite.y + laserOffset[this.direction].dy;
		this.isFiring = true;
		this.sprite.stop();
		this.scene.sound.play("Water", {loop: true});
	}

	fireEnd() {
		this.laser.stop();
		this.laser.setFrame(12);
		this.isFiring = false;
		this.sprite.setFrame(idleFrame[this.direction]);
		this.firingAmount = 0;
		this.scene.sound.stopByKey("Water");
	}

	update(_: milliseconds, delta: milliseconds) {
		if (this.isFiring) {
			this.firingAmount += delta;
			if (this.firingAmount > Conf.crackResistance * 1000) {
				this.scene.heal();
				this.firingAmount = 0;
				this.fireEnd();
			}
			return;
		}

		const up    = this.cursorKeys.up.isDown;
		const down  = this.cursorKeys.down.isDown;
		const left  = this.cursorKeys.left.isDown;
		const right = this.cursorKeys.right.isDown;
		// let deltaPos = Conf.tileSize * Conf.speed * delta / 1000;
		// if ((up || down) && (left || right))
		// 	deltaPos /= Math.sqrt(2);
		// deltaPos = Math.ceil(deltaPos);
		let deltaPos = 3;
		if ((up || down) && (left || right))
			deltaPos = 2;

		let direction = "";
		let x = this.sprite.x;
		let y = this.sprite.y;
		if (down) {
			y += deltaPos;
			direction = "S";
		} else if (up) {
			y -= deltaPos;
			direction = "N";
		}

		if (right) {
			x += deltaPos;
			direction += "E";
		} else if (left) {
			x -= deltaPos;
			direction += "W";
		}

		if (this.scene.isValidPosition({x: x / Conf.tileSize, y: y / Conf.tileSize})) {
			this.sprite.x = x;
			this.sprite.y = y;
		} else {
			direction = null;
		}

		if (direction) {
			if (!this.isWalking || direction !== this.direction) {
				this.isWalking = true;
				this.sprite.play("PlayerWalk" + direction);
			}
			this.direction = direction as Direction8;
		} else {
			this.isWalking = false;
			this.sprite.stop();
		}
	}
}
