import * as Phaser from "phaser"
import * as Conf from "./configuration"

export default class extends Phaser.Scene {
	lifeBarBg: Phaser.GameObjects.Sprite;
	lifeBar: Phaser.GameObjects.Sprite;

	constructor() {
		super("LifeBarScene");
		this.lifeBarBg = this.add.sprite(100, 100, "LifeBarBg");
		this.lifeBar = this.add.sprite(100, 100, "LifeBar");
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
