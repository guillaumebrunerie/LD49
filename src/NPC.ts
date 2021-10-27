import * as Phaser from "phaser";

import * as Conf from "./configuration";
import {Dialog} from "./dialogs";

export default class {
	scene: Phaser.Scenes.ScenePlugin;
	sprite: Phaser.GameObjects.Sprite;
	bubble: Phaser.GameObjects.Sprite;
	isBubbling: boolean;
	dialog: Dialog;

	get x() { return this.sprite.x };
	get y() { return this.sprite.y };

	constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame: number) {
		this.scene = scene.scene;
		this.sprite = scene.add.sprite(x, y, texture, frame);
		this.bubble = scene.add.sprite(x + Conf.bubbleOffset.dx, y + Conf.bubbleOffset.dy, "Bubble", 6);
		this.isBubbling = false;
	}

	setDialog(dialog: Dialog) {
		this.dialog = dialog;
	}

	interact() {
		if (this.scene.isActive("DialogScene"))
			return;

		this.scene.run("DialogScene", this.dialog);
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

	update(playerPosition: { x: number, y: number }) {
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
