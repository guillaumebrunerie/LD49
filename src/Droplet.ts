import * as Phaser from "phaser";
import * as Conf from "./configuration";

export default class {
	image: Phaser.GameObjects.Image
	appearingTime: number

	get x() { return this.image.x };
	get y() { return this.image.y };

	constructor(scene: Phaser.Scene, x: number, y: number, time: number) {
		this.image = scene.add.image(x, y - Conf.tileSize, "WaterDroplet");
		this.appearingTime = time;
	}

	destroy() {
		this.image.destroy();
	}

	isCloseTo(position: Phaser.Types.Math.Vector2Like): boolean {
		return (Phaser.Math.Distance.BetweenPoints(position, this) < Conf.dropletHitboxSize);
	}
}