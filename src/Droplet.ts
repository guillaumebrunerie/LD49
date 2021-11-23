import * as Phaser from "phaser";
import * as Conf from "./configuration";

export default class {
	sprite: Phaser.GameObjects.Sprite
	appearingTime: number

	constructor(scene: Phaser.Scene, x: number, y: number) {
		this.sprite = scene.add.sprite(x, y - Conf.tileSize, "Droplet").setDepth(Conf.zIndex.droplet);
		this.sprite.play("Droplet");
		this.appearingTime = scene.time.now;
	}

	destroy() {
		this.sprite.destroy();
	}

	isCloseTo(position: Phaser.Types.Math.Vector2Like): boolean {
		return (Phaser.Math.Distance.BetweenPoints(position, this.sprite) < Conf.dropletHitboxSize);
	}
}
