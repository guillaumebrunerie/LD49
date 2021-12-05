import * as Phaser from "phaser"
import * as Conf from "./configuration"

export default class extends Phaser.Scene {
	inventorySprites: Phaser.GameObjects.Sprite[] = [];
	fullInventorySprites: Phaser.GameObjects.Sprite[] = [];
	level: number = 0;
	capacity: number = 0;

	constructor() {
		super("InventoryScene");
	}

	updateInventory(capacity: number, level: number) {
		if (this.capacity !== capacity) {
			this.inventorySprites.forEach(s => s.destroy());
			this.fullInventorySprites.forEach(s => s.destroy());
			this.inventorySprites = [];
			this.fullInventorySprites = [];

			let x = Conf.inventory.x;
			const y = Conf.inventory.y;
			for (let i = 0; i < capacity; i++) {
				this.inventorySprites[i] = this.add.sprite(x, y, "WaterBullet", 13);
				this.fullInventorySprites[i] = this.add.sprite(x, y, "WaterBullet", 5).setVisible(level > i);
				x += Conf.inventory.dx;
			}
		} else {
			if (level > this.level) {
				for (let i = this.level; i < level; i++) {
					this.fullInventorySprites[i].setFrame(12);
					this.fullInventorySprites[i].setVisible(true);
					this.fullInventorySprites[i].playAfterDelay("InventoryRefill", (i - this.level) * 100);
				}
			}

			if (level < this.level) {
				for (let i = level; i < this.level; i++) {
					this.fullInventorySprites[i].setVisible(false);
				}
			}

			if (level == 0) {
				this.inventorySprites.forEach(s => s.play("InventoryEmpty"))
				this.sound.play("WaterInventoryEmpty.wav", {loop: true});
			}
			if (level > 0 && this.level == 0) {
				this.inventorySprites.forEach(s => {
					s.stop();
					s.setFrame(13);
				});
				this.sound.stopByKey("WaterInventoryEmpty.wav");
			}
		}

		this.capacity = capacity;
		this.level = level;
	}
}
