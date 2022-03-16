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

	create() {
		this.inventorySprites.forEach(s => s.destroy());
		this.fullInventorySprites.forEach(s => s.destroy());
		this.inventorySprites = [];
		this.fullInventorySprites = [];

		this.level = 0;
		this.capacity = 0;
		let x = Conf.inventory.x;
		const y = Conf.inventory.y;
		for (let i = 0; i < 7; i++) {
			this.inventorySprites[i] = this.add.sprite(x, y, "WaterBullet", 13).setVisible(false);
			this.fullInventorySprites[i] = this.add.sprite(x, y, "WaterBullet", 5).setVisible(false);
			x += Conf.inventory.dx;
		}
	}

	updateInventory(capacity: number, level: number, isLevelOver: boolean) {
		if (isLevelOver) {
			capacity = Math.max(capacity, this.capacity);
		}
		if (capacity > this.capacity) {
			for (let i = this.capacity; i < capacity; i++) {
				this.inventorySprites[i].setVisible(true);
				if (this.capacity > 0) {
					this.inventorySprites[i].playAfterDelay("InventoryUpgrade", (i - this.capacity) * 100);
					this.add.sprite(this.inventorySprites[i].x, this.inventorySprites[i].y, "").setAlpha(0.8).play("PrizeFx1");
				}
			}
		}

		if (capacity < this.capacity) {
			for (let i = capacity; i < this.capacity; i++) {
				this.inventorySprites[i].setVisible(false);
			}
		}

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

		if (this.level > 0 && level == 0 && !isLevelOver) {
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

		this.capacity = capacity;
		this.level = level;
	}
}
