import * as Phaser from "phaser"

export default class extends Phaser.Scene {
	constructor() {
		super("GameLost");
	}

	create() {
		this.sound.play("GameLost");

		const screen = this.add.sprite(0, 0, "GameLost", 0).setOrigin(0, 0).play("GameLost");
		screen.setInteractive({
			cursor: "pointer",
		});

		const doStart = () => {
			this.sound.play("Music", { loop: true });
			this.scene.stop();
			this.scene.wake("LevelSelect", {type: ""});
		}

		screen.on("pointerup", () => doStart());
		this.input.keyboard.on('keyup-SPACE', () => doStart());
		this.input.keyboard.on('keyup-ENTER', () => doStart());
	}
}
