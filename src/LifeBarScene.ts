import * as Phaser from "phaser"
//import * as Conf from "./configuration"

const lifeBarWidth = 276;
const lifeBarX = 235;
const lifeBarY = 10;

export default class extends Phaser.Scene {
	lifeBarBg!: Phaser.GameObjects.Sprite;
	lifeBar!: Phaser.GameObjects.Sprite;

	constructor() {
		super("LifeBarScene");
	}

	updateLifeBar(factor: number) {
		this.lifeBarBg = this.add.sprite(lifeBarX, lifeBarY, "LifeBarBg");
		this.lifeBar = this.add.sprite(lifeBarX, lifeBarY, "LifeBar");

		const rectangle = new Phaser.GameObjects.Graphics(this);
		rectangle.fillStyle(0xFFFFFF, 1);
		rectangle.fillRect(lifeBarX - lifeBarWidth / 2, 0, lifeBarWidth * factor, 100);
		const mask = new Phaser.Display.Masks.GeometryMask(this, rectangle);
		this.lifeBar.setMask(mask);
		// this.add.existing(rectangle);
	}

	// updateInventory(capacity: number, level: number) {
	// 	this.inventorySprites.forEach(s => s.destroy());
	// 	this.inventorySprites = [];

	// 	let x = Conf.inventory.x;
	// 	const y = Conf.inventory.y;
	// 	for (let i = 0; i < capacity; i++) {
	// 		this.add.image(x, y, "Water_Inventory");
	// 		if (level > i)
	// 			this.add.image(x, y, "Water_Bullet");
	// 		x += Conf.inventory.dx;
	// 	}
	// }
}
