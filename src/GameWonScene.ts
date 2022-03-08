import * as Phaser from "phaser"

export default class extends Phaser.Scene {
	constructor() {
		super("GameWon");
	}

	create() {
		this.sound.play("GameWon");

		const screen = this.add.sprite(0, 0, "GameWon", 0).setOrigin(0, 0).play("GameWon");
		screen.setInteractive({
			cursor: "pointer",
		});

		const doStart = () => {
			this.sound.play("Music", { loop: true });
			this.sound.stopByKey("GameWon");
			this.scene.stop();
			this.scene.wake("LevelSelect", {type: ""});
		}

		screen.on("pointerup", () => doStart());
		this.input.keyboard.on('keydown-SPACE', () => doStart());
		this.input.keyboard.on('keydown-ENTER', () => doStart());
	}
}
