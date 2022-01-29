import * as Phaser from "phaser"
//import * as Conf from "./configuration"

const lifeBarWidth = 276;
const lifeBarX = 235;
const lifeBarY = 10;

export default class extends Phaser.Scene {
	lifeBarBg!: Phaser.GameObjects.Sprite;
	lifeBarGreen!: Phaser.GameObjects.Sprite;
	lifeBarRed!: Phaser.GameObjects.Sprite;

	constructor() {
		super("LifeBarScene");
	}

	updateLifeBar(greenFactor: number, redFactor: number) {
		this.lifeBarBg?.destroy();
		this.lifeBarGreen?.destroy();
		this.lifeBarRed?.destroy();

		this.lifeBarBg = this.add.sprite(lifeBarX, lifeBarY, "LifeBarBg");
		this.lifeBarGreen = this.add.sprite(lifeBarX, lifeBarY, "LifeBar");
		this.lifeBarRed = this.add.sprite(lifeBarX, lifeBarY, "LifeBar").setTint(0xFF0000);

		const greenRectangle = new Phaser.GameObjects.Graphics(this);
		greenRectangle.fillStyle(0xFFFFFF, 1);
		greenRectangle.fillRect(lifeBarX - lifeBarWidth / 2, 0, lifeBarWidth * greenFactor, 100);
		const greenMask = new Phaser.Display.Masks.GeometryMask(this, greenRectangle);
		this.lifeBarGreen.setMask(greenMask);

		const redRectangle = new Phaser.GameObjects.Graphics(this);
		redRectangle.fillStyle(0xFFFFFF, 1);
		redRectangle.fillRect(lifeBarX + lifeBarWidth * (1 / 2 - redFactor), 0, lifeBarWidth * redFactor, 100);
		const redMask = new Phaser.Display.Masks.GeometryMask(this, redRectangle);
		this.lifeBarRed.setMask(redMask);
	}
}
