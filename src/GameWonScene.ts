import * as Phaser from "phaser"

export default class extends Phaser.Scene {
	constructor() {
		super("GameWon");
	}

	create() {
		// this.cameras.main.fadeFrom(200, 255, 255, 255);

		this.sound.play("GameWon");
		this.add.sprite(0, 0, "GameWon", 0).setOrigin(0, 0).play("GameWon");
	}
}
