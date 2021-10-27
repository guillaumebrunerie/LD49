import * as Phaser from "phaser"

export default class extends Phaser.Scene {
	constructor() {
		super("GameLost");
	}

	create() {
		// this.cameras.main.fadeFrom(200, 255, 255, 255);

		this.add.sprite(0, 0, "GameLost", 0).setOrigin(0, 0).play("GameLost");
	}
}
