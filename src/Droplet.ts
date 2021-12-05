import * as Phaser from "phaser";
import * as Conf from "./configuration";

export default class {
	sprite: Phaser.GameObjects.Sprite
	appearingTime: number
	superDroplet = false;

	constructor(scene: Phaser.Scene, x: number, y: number, superDroplet: boolean) {
		this.sprite = scene.add.sprite(x, y - Conf.tileSize, "Droplet").setDepth(Conf.zIndex.droplet);
		this.superDroplet = superDroplet;
		this.sprite.play(superDroplet ? "SuperDroplet" : "Droplet");
		this.appearingTime = scene.time.now;
	}

	destroy() {
		this.sprite.destroy();
	}

	isCloseTo(position: Phaser.Types.Math.Vector2Like): boolean {
		return (Phaser.Math.Distance.BetweenPoints(position, this.sprite) < Conf.dropletHitboxSize);
	}
}
