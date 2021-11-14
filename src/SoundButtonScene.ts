import * as Phaser from "phaser";

import * as Conf from "./configuration";

export default class extends Phaser.Scene {
	suffix: string;
	button?: Phaser.GameObjects.Image;

	constructor() {
		super({key: "SoundButtonScene", active: true});
		this.suffix = "";
	}

	gameStarted() {
		if (!this.button) return;

		this.suffix = "_Small";
		this.button.setTexture(this.button.texture.key + this.suffix);
		this.button.x = Conf.smallSoundButton.x;
		this.button.y = Conf.smallSoundButton.y;
	}

	preload() {
		this.load.setPath("assets/UI");
		this.load.image("Btn_Sound_ON");
		this.load.image("Btn_Sound_OFF");
		this.load.image("Btn_Sound_ON_Small");
		this.load.image("Btn_Sound_OFF_Small");
	}

	create() {
		this.sound.mute = false;

		const button = this.button = this.add.image(Conf.soundButton.x, Conf.soundButton.y, "Btn_Sound_ON");

		button.setInteractive();
		button.on("pointerdown", () => {
			this.sound.mute = !this.sound.mute;
			button.setTexture("Btn_Sound_" + (this.sound.mute ? "ON" : "OFF") + this.suffix);
		});
	}
}
