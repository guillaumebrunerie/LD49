import * as Phaser from "phaser";

import * as Conf from "./configuration";
import {Dialog} from "./dialogs";
import newTextLine from "./TextLine";
import MainScene from "./MainScene";

export default class extends Phaser.Scene {
	lines: {destroy: () => void}[];
	dialog: Dialog;
	currentIndex: number;
	avatar: Phaser.GameObjects.Sprite;

	constructor() {
		super("DialogScene");
		this.lines = [];
	}

	init(dialog: Dialog) {
		this.dialog = dialog;
		this.currentIndex = 0;
	}

	create() {
		this.add.image(Conf.dialogBg.x, Conf.dialogBg.y, "DialogBackground");
		this.avatar = this.add.sprite(Conf.avatar.x, Conf.avatar.y, "").setScale(Conf.avatar.scale);

		this.refresh();

		this.input.keyboard.on('keydown-SPACE', () => this.nextDialog());
	}

	nextDialog() {
		this.currentIndex++;
		if (this.currentIndex == this.dialog.length) {
			this.scene.stop();
		} else {
			this.refresh();
		}
	}

	refresh() {
		this.lines.forEach(line => line.destroy());
		const cfg = Conf.dialogText;

		const currentDialog = this.dialog[this.currentIndex];
		switch (currentDialog.type) {
			case "you":
			case "them":
				this.avatar.setTexture(currentDialog.type == "you" ? "Player" : "Characters");
				this.lines = currentDialog.text.map((text, i) => (
					newTextLine(this, cfg.x, cfg.y + cfg.dy * i, text)
				));
				break;
			case "callback":
				const mainScene = this.scene.get("MainScene") as MainScene;
				currentDialog.callback(mainScene);
				break;
		}
	}
}
