import * as Phaser from "phaser"
import * as Conf from "./configuration"

export default class extends Phaser.Scene {
	inventorySprites: Phaser.GameObjects.Sprite[]

	constructor() {
		super("InventoryScene");
		this.inventorySprites = [];
	}

	updateInventory(capacity, level) {
		this.inventorySprites.forEach(s => s.destroy());
		this.inventorySprites = [];

		let x = Conf.inventory.x;
		const y = Conf.inventory.y;
		for (let i = 0; i < capacity; i++) {
			this.add.image(x, y, "Water_Inventory");
			if (level > i)
				this.add.image(x, y, "Water_Bullet");
			x += Conf.inventory.dx;
		}
	}
}
