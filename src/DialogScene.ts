import * as Phaser from "phaser";

import * as Conf from "./configuration";
import {Dialog} from "./dialogs";
import newTextLine from "./TextLine";
import MainScene from "./MainScene";

export default class extends Phaser.Scene {
	lines: {destroy: () => void}[];
	dialog!: Dialog;
	currentIndex = 0;
	avatar!: Phaser.GameObjects.Sprite;
	levelNum = 0;
	callback: () => void = () => {};
	playerSkin: number = 0;

	constructor() {
		super("DialogScene");
		this.lines = [];
	}

	init({dialog, levelNum, skin, callback} :{dialog: Dialog, levelNum: number, skin: number, callback: () => void}) {
		this.dialog = dialog;
		this.levelNum = levelNum;
		this.currentIndex = 0;
		this.callback = callback;
		this.playerSkin = skin;
	}

	create() {
		this.add.image(Conf.dialogBg.x, Conf.dialogBg.y, "DialogBackground");
		this.avatar = this.add.sprite(Conf.avatar.x, Conf.avatar.y, "").setScale(Conf.avatar.scale);

		this.currentIndex = 0;
		this.refresh();

		let isSpaceDown = true;
		this.input.keyboard.on('keydown-SPACE', () => {
			if (!isSpaceDown) {
				this.nextDialog();
				isSpaceDown = true;
			}
		});
		this.input.keyboard.on('keyup-SPACE', () => {
			isSpaceDown = false;
		});

		let isEnterDown = true;
		this.input.keyboard.on('keydown-ENTER', () => {
			if (!isEnterDown) {
				this.nextDialog();
				isEnterDown = true;
			}
		});
		this.input.keyboard.on('keyup-ENTER', () => {
			isEnterDown = false;
		});

		this.input.on("pointerdown", () => this.nextDialog());
	}

	nextDialog() {
		this.currentIndex++;
		if (this.currentIndex >= this.dialog.length) {
			this.callback();
			this.currentIndex = 0;
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
				if (currentDialog.type == "you")
					this.avatar.setTexture(`Player${this.playerSkin}`);
				else
					this.avatar.setTexture("Characters", this.levelNum * 13);
				this.lines = currentDialog.text.map((text, i) => (
					newTextLine(this, cfg.x, cfg.y + cfg.dy * i, i == 0 ? 0 : currentDialog.text[0].length, text)
				));
				break;
			case "callback":
				const mainScene = this.scene.get("MainScene") as MainScene;
				currentDialog.callback(mainScene);
				break;
		}
	}
}
