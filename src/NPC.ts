import * as Phaser from "phaser";

import * as Conf from "./configuration";
import {Dialog} from "./dialogs";
import MainScene from "./MainScene";

export default class extends Phaser.GameObjects.Container {
	scene: MainScene;
	sprite: Phaser.GameObjects.Sprite;
	bubble: Phaser.GameObjects.Sprite;
	isBubbling: boolean;
	dialog?: Dialog;

	constructor(scene: MainScene, x: number, y: number, texture: string, frame: number) {
		super(scene, x, y);
		scene.add.existing(this).setDepth(Conf.zIndex.npc);
		this.scene = scene;
		this.sprite = scene.add.sprite(0, 0, texture).play("NPCIdle" + frame);
		this.bubble = scene.add.sprite(Conf.bubbleOffset.dx, Conf.bubbleOffset.dy, "Bubble", 6);
		this.add([this.sprite, this.bubble]);
		this.isBubbling = false;
	}

	setDialog(dialog: Dialog) {
		this.dialog = dialog;
	}

	interact() {
		if (this.scene.scene.isActive("DialogScene"))
			return;

		this.scene.scene.run("DialogScene", {levelNum: this.scene.levelNum, dialog: this.dialog});
	}

	isAtBlockingDistance(position: Phaser.Types.Math.Vector2Like): boolean {
		const distance = Phaser.Math.Distance.BetweenPoints(position, this);
		return (distance < Conf.introGuideHitboxSize);
	}

	isAtInteractionDistance(position: Phaser.Types.Math.Vector2Like): boolean {
		const distance = Phaser.Math.Distance.BetweenPoints(position, this);
		return (distance < Conf.tileSize);
	}

	destroy() {
		this.sprite.destroy();
		this.bubble.destroy();
	}

	update() {
		const playerPosition = this.scene.player;
		if (this.isAtInteractionDistance(playerPosition)) {
			if (!this.isBubbling) {
				this.isBubbling = true;
				this.bubble.play("BubbleStart").once("animationcomplete", () => {
					if (this.isAtInteractionDistance(playerPosition)) {
						this.bubble.play("BubbleLoop")
					}
				});
			}
		} else {
			if (this.isBubbling) {
				this.bubble.play("BubbleEnd");
				this.isBubbling = false;
			}
		}
	}
}
