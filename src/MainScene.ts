import * as Phaser from "phaser";

import * as Conf from "./configuration";
import Crack, { CrackPoint } from "./Crack";
import Droplet from "./Droplet";
import dialogs from "./dialogs";
import InventoryScene from "./InventoryScene";
import NPC from "./NPC";
import Player from "./Player";
import { milliseconds, pick, random } from "./utils";
import Demon from "./Demon";


type Mask = (0 | 1)[][];

// Returns a 2D mask of size [size × size] that represents a circle
const generateWorldMask = (size: number): Mask => {
	const radius = size / 2 - 1;
	const center = (size - 1) / 2;
	const result: Mask = [];
	for (let i = 0; i < size + 1; i++) {
		result[i] = [];
		for (let j = 0; j < size + 1; j++) {
			const distance = (j - center) * (j - center) + (i - center) * (i - center);
			result[i][j] = distance < radius * radius ? 1 : 0;
		}
	}
	return result;
};

const healAt = (scene: Phaser.Scene, crack: Crack, crackPoint: CrackPoint) => {
	const crackPoints = [...crack.crackPoints];
	const index = crackPoints.indexOf(crackPoint);

	if (crackPoint.size > 1) {
		crackPoint.size--;
		return [new Crack({ scene, crackPoints })];
	} else if (crackPoints.length == 1) {
		return [];
	} else if (index == 0) {
		return [new Crack({ scene, crackPoints: crackPoints.slice(1) })];
	} else if (index == crackPoints.length - 1) {
		return [new Crack({ scene, crackPoints: crackPoints.slice(0, index) })];
	} else {
		return [
			new Crack({ scene, crackPoints: crackPoints.slice(0, index) }),
			new Crack({ scene, crackPoints: crackPoints.slice(index + 1) }),
		];
	}
};

export default class extends Phaser.Scene {
	worldMask: Mask;
	grassMask: Mask;
	groundTilemap: Phaser.Tilemaps.Tilemap;
	grassTilemap: Phaser.Tilemaps.Tilemap;
	stuffTilemap: Phaser.Tilemaps.Tilemap;
	treePositions: { x: number, y: number }[];

	player: Player;
	cracks: Crack[];
	lastEarthquake: number;
	introGuide: NPC;

	waterLevel: number;
	waterCapacity: number;

	level: number;
	droplets: Droplet[] = [];
	crackPointIndicator: Phaser.GameObjects.Sprite;
	demons: Demon[] = [];

	extendProbability: number;
	treesEnabled: boolean;
	crackDelay: Conf.MaybeRandomNumber;
	crackMaxLength: number;
	dropsDelay: Conf.MaybeRandomNumber;
	extendDelay: number;
	allowNewCracks: boolean;

	crackPointSprite: Phaser.GameObjects.Sprite;

	pointBeingHealed: { crack: Crack, crackPoint: CrackPoint, tree: { x: number, y: number } };

	timeLeft: number;
	dropTimeLeft: number;
	demonTimeLeft: number = 1000;
	extendTimeLeft: number;

	constructor() {
		super("MainScene");
	}

	create() {
		this.sound.play("music", { loop: true });

		const groundLayerData = [];
		const mask = this.worldMask = generateWorldMask(Conf.worldSize);
		for (let y = 0; y < Conf.worldHeight; y++) {
			groundLayerData[y] = [];
			for (let x = 0; x < Conf.worldWidth; x++) {
				let maskNW = mask[y][x];
				let maskNE = mask[y][x + 1];
				let maskSE = mask[y + 1][x + 1];
				let maskSW = mask[y + 1][x];
				let value = `${maskNW}${maskNE}${maskSE}${maskSW}`;
				const tiles = {
					"0010": 26,
					"0011": 27,
					"0001": 28,
					"1101": 29,
					"1110": 30,
					"0110": 39,
					"0000": 40,
					"1001": 41,
					"1011": 42,
					"0111": 43,
					"0100": 52,
					"1100": 53,
					"1000": 54,
					"1111": null,
					"1010": null,
					"0101": null,
				};
				let tile = tiles[value];
				if (value == "1111") {
					tile = pick([0, 1, 13, 14, 0, 1, 13, 14, 0, 1, 13, 14, 0, 1, 13, 14, 0, 1, 13, 14, 0, 1, 13, 14,
						0, 1, 13, 14, 35, 36, 35 + 13, 36 + 13]);
				}
				groundLayerData[y][x] = tile;
			}
		}
		const groundTilemap = this.make.tilemap({
			data: groundLayerData,
			tileWidth: Conf.tileSize,
			tileHeight: Conf.tileSize,
			width: Conf.worldWidth,
			height: Conf.worldHeight,
		});
		this.groundTilemap = groundTilemap;
		const groundTileset = groundTilemap.addTilesetImage("tileset", "Tiles");
		const groundLayer = groundTilemap.createLayer(0, groundTileset);

		groundLayer.x = -groundLayer.width / 2;
		groundLayer.y = -groundLayer.height / 2;




		const grassLayerData = [];
		for (let y = 0; y < Conf.worldHeight; y++) {
			grassLayerData[y] = [];
			for (let x = 0; x < Conf.worldWidth; x++) {
				grassLayerData[y][x] = 70;
			}
		}
		this.grassMask = [];
		for (let y = 0; y < Conf.worldHeight + 1; y++) {
			this.grassMask[y] = [];
			for (let x = 0; x < Conf.worldWidth + 1; x++) {
				this.grassMask[y][x] = 0;
			}
		}
		const grassTilemap = this.make.tilemap({
			data: grassLayerData,
			tileWidth: Conf.tileSize,
			tileHeight: Conf.tileSize,
			width: Conf.worldWidth,
			height: Conf.worldHeight,
		});
		this.grassTilemap = grassTilemap;
		const grassTileset = grassTilemap.addTilesetImage("tileset", "Tiles");
		const grassLayer = grassTilemap.createLayer(0, grassTileset);

		grassLayer.x = -grassLayer.width / 2;
		grassLayer.y = -grassLayer.height / 2;



		this.treePositions = [];

		const liveTrees = [2, 3, 4, 5, 6, 7, 8, 33, 34, 59];
		const deadTrees = liveTrees.map(x => x + 13);
		const otherStuff = [9, 10, 11, 12, 22, 23, 24, 25, 31, 32, 44, 45];
		const nothing = new Array(100).fill(40);
		const stuffToPickFrom = [...deadTrees, ...otherStuff, ...nothing];
		const stuffLayerData = [];
		for (let y = 0; y < Conf.worldHeight; y++) {
			stuffLayerData[y] = [];
			for (let x = 0; x < Conf.worldWidth; x++) {
				if (mask[y][x] && mask[y + 1][x] && mask[y + 1][x + 1] && mask[y][x + 1]) {
					const stuff = pick(stuffToPickFrom);
					stuffLayerData[y][x] = stuff;
					if (deadTrees.includes(stuff))
						this.treePositions.push({ x, y });
				} else {
					stuffLayerData[y][x] = 40;
				}
			}
		}
		this.stuffTilemap = this.make.tilemap({
			data: stuffLayerData,
			tileWidth: Conf.tileSize,
			tileHeight: Conf.tileSize,
			width: Conf.worldWidth,
			height: Conf.worldHeight,
		});
		const stuffTileset = this.stuffTilemap.addTilesetImage("tileset", "Tiles");
		const stuffLayer = this.stuffTilemap.createLayer(0, stuffTileset);

		stuffLayer.x = -stuffLayer.width / 2;
		stuffLayer.y = -stuffLayer.height / 2;

		this.cracks = [];

		this.lastEarthquake = 0;

		this.introGuide = new NPC(this, 0, -4 * Conf.tileSize, "Characters", 0);

		this.input.keyboard.on('keydown-SPACE', () => this.interaction());
		this.input.keyboard.on('keyup-SPACE', () => this.fireEnd());

		this.player = new Player(this);

		this.cameras.main.centerOn(0, 0);
		this.cameras.main.startFollow(this.player.sprite);

		this.waterLevel = 50;
		this.waterCapacity = 5;

		this.level = -1;

		this.crackPointIndicator = this.add.sprite(0, 0, "CrackPoints", 0).setVisible(false);

		// Background

		const backgroundLayerData = [];
		for (let y = 0; y < Conf.viewportHeight; y++) {
			backgroundLayerData[y] = [];
			for (let x = 0; x < Conf.viewportWidth; x++) {
				backgroundLayerData[y][x] = pick([...new Array(15).fill(0), 1, 2, 3, 4, 5, 6, 7, 8]);
			}
		}
		const backgroundTilemap = this.make.tilemap({
			data: backgroundLayerData,
			tileWidth: Conf.tileSize,
			tileHeight: Conf.tileSize,
			width: Conf.worldWidth,
			height: Conf.worldHeight,
		});
		const backgroundTileset = backgroundTilemap.addTilesetImage("tileset", "SpaceTiles");
		const backgroundLayer = backgroundTilemap.createLayer(0, backgroundTileset);

		backgroundLayer.x = 1000;
		backgroundLayer.y = 1000;

		this.cameras.add(0, 0, undefined, undefined, false, "Background").setScroll(1000, 1000);
		this.cameras.cameras.reverse();

		this.demons.push(new Demon(this, 0, 0));
		this.demons[0].setDestination({x: 3 * 24, y: -2 * 24});
	}

	requestNewDestination(demon: Demon) {
		demon.setDestination({x: (Math.random() * 10 - 5) * 24, y: (Math.random() * 10 - 5) * 24});
	}

	winGame() {
		this.scene.stop("DialogScene");
		this.scene.start("GameWon");
	}

	loseGame() {
		this.scene.stop("DialogScene");
		this.scene.start("GameLost");
	}

	makeStuffTileAlive(tile: number) {
		const liveTrees = [2, 3, 4, 5, 6, 7, 8, 33, 34, 59];
		const deadTrees = liveTrees.map(x => x + 13);
		if (deadTrees.includes(tile))
			return (tile - 13);
		else
			return tile;
	}

	turnGroundToGrass(tile: number) {
		const row = Math.floor(tile / 13);
		const col = tile - row * 13;
		if (row <= 1)
			return tile + 67;
		if (col <= 2)
			return tile + 36;
		if (col <= 4)
			return tile + 44;
		return tile + 2;
	}

	updateForGrass() {
		for (let y = 0; y < Conf.worldHeight; y++) {
			for (let x = 0; x < Conf.worldWidth; x++) {
				let maskNW = this.grassMask[y][x]         * this.worldMask[y][x];
				let maskNE = this.grassMask[y][x + 1]     * this.worldMask[y][x + 1];
				let maskSE = this.grassMask[y + 1][x + 1] * this.worldMask[y + 1][x + 1];
				let maskSW = this.grassMask[y + 1][x]     * this.worldMask[y + 1][x];
				let value = `${maskNW}${maskNE}${maskSE}${maskSW}`;
				const tiles = {
					"1101": 65,
					"1110": 66,
					"1111": null,
					"0110": 69,
					"1001": 71,
					"1010": 55,
					"0010": 56,
					"0011": 57,
					"0001": 58,
					"1011": 78,
					"0111": 79,
					"0100": 82,
					"1100": 83,
					"1000": 84,
					"0101": 85,
					"0000": 70,
				};
				let tile = tiles[value];
				let wMaskNW = this.worldMask[y][x];
				let wMaskNE = this.worldMask[y][x + 1];
				let wMaskSE = this.worldMask[y + 1][x + 1];
				let wMaskSW = this.worldMask[y + 1][x];
				if (wMaskNW <= maskNW && wMaskNE <= maskNE && wMaskSE <= maskSE && wMaskSW <= maskSW) {
					tile = this.turnGroundToGrass(this.groundTilemap.getTileAt(x, y).index);
				}
				this.grassTilemap.putTileAt(tile, x, y);

				if (maskSE && maskSW) {
					const stuff = this.stuffTilemap.getTileAt(x, y).index;
					this.stuffTilemap.putTileAt(this.makeStuffTileAlive(stuff), x, y);
				}
			}
		}
	}

	extendGrass() {
		const m: number[][] = this.grassMask;
		for (let y = 1; y < Conf.worldHeight - 1; y++) {
			for (let x = 1; x < Conf.worldWidth - 1; x++) {
				if (m[y][x] == 0 && (m[y][x + 1] == 1 || m[y][x - 1] == 1 || m[y - 1][x] == 1 || m[y + 1][x] == 1)) {
					if (Math.random() < this.extendProbability)
						m[y][x] = 2;
				}
			}
		}

		const distanceSquared = ({ x: x1, y: y1 }, { x: x2, y: y2 }) => (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);

		const hasCrack = (x: number, y: number) => (
			this.cracks.some(crack => (
				crack.crackPoints.some(crackPoint => (
					distanceSquared(crackPoint, { x: x - Conf.worldWidth / 2, y: Conf.worldHeight / 2 - y }) < 3
				))
			))
		);

		for (let y = 0; y < Conf.worldHeight; y++) {
			for (let x = 0; x < Conf.worldWidth; x++) {
				if (m[y][x] == 2)
					m[y][x] = hasCrack(x, y) ? 0 : 1;
			}
		}

		this.updateForGrass();
	}

	updateInventory() {
		if (!this.scene.isActive("InventoryScene"))
			this.scene.run("InventoryScene");
		(this.scene.get("InventoryScene") as InventoryScene).updateInventory(this.waterCapacity, this.waterLevel);
	}

	getCloseCrackPoint() {
		const healPoints = [];
		this.cracks.forEach(crack => {
			crack.crackPoints.forEach(crackPoint => {
				const distance = crack.distanceToPlayer({ x: crackPoint.x * Conf.tileSize, y: -crackPoint.y * Conf.tileSize });
				if (distance < 2 * Conf.tileSize)
					healPoints.push({ crack, crackPoint, distance });
			});
		});
		if (this.treesEnabled) {
			this.treePositions.forEach(tree => {
				const { x, y } = tree;
				const newX = (x + 0.5 - Conf.worldWidth / 2);
				const newY = (y + 0.5 - Conf.worldWidth / 2);
				const dx = Math.abs(newX * Conf.tileSize - this.player.x);
				const dy = Math.abs(newY * Conf.tileSize - this.player.y);
				const distance = dx + dy;
				if (distance < 2 * Conf.tileSize && (this.grassMask[y + 1][x] == 0 || this.grassMask[y + 1][x + 1] == 0))
					healPoints.push({ tree, crackPoint: { x: newX, y: -newY }, distance });
			});
		}
		return healPoints.sort((a, b) => a.distance - b.distance)[0];
	}

	interaction() {
		if (this.introGuide.isAtInteractionDistance(this.player)) {
			this.talkToIntroGuide();
			return;
		}

		if (this.waterLevel == 0)
			return; // No water

		const healPoint = this.getCloseCrackPoint();
		if (healPoint) {
			this.pointBeingHealed = healPoint;
			this.player.fireStart(this.pointBeingHealed.crackPoint);
			const x = this.pointBeingHealed.crackPoint.x * Conf.tileSize;
			const y = -this.pointBeingHealed.crackPoint.y * Conf.tileSize;
			this.crackPointSprite = this.add.sprite(x, y, "CrackPoints", 18).setDepth(43);
			this.crackPointSprite.play(healPoint.tree ? "CrackPointTree" : "CrackPoint");
		}
	}

	heal() {
		this.waterLevel--;
		if (this.pointBeingHealed.tree) {
			const { x, y } = this.pointBeingHealed.tree;
			this.grassMask[y + 1][x] = 1;
			this.grassMask[y + 1][x + 1] = 1;
			this.updateForGrass();
		} else {
			const { crack, crackPoint } = this.pointBeingHealed;
			const newCracks = healAt(this, crack, crackPoint);
			crack.destroy();
			this.cracks = this.cracks.filter(c => c !== crack);
			this.cracks.push(...newCracks);
		}
		this.updateInventory();
		this.pointBeingHealed = null;
		this.sound.play("Tree");
	}

	fireEnd() {
		this.player.fireEnd();
		this.pointBeingHealed = null;
		this.crackPointSprite?.stop();
		this.crackPointSprite?.destroy();
		this.crackPointSprite = null;
	}

	initLevel(level: number) {
		const {
			numberOfCracks,
			crackDelay = Infinity,
			crackMaxLength = Infinity,
			dropsDelay = Infinity,
			extendDelay = Infinity,
			allowNewCracks = false,
			extendProbability = 0.5,
			treesEnabled = false,
			waterCapacity,
		} = Conf.levels[level];

		for (let i = 0; i < numberOfCracks; i++) {
			let x: number, y: number, tries = 0;
			if (level == 1) {
				x = 3;
				y = 0;
			} else {
				do {
					x = Math.floor((Math.random() - 0.5) * Conf.viewportWidth);
					y = Math.floor((Math.random() - 0.5) * Conf.viewportHeight);
					tries++;
				} while (!this.isValidPosition({x, y: -y}, true) && tries < 100)
			}
			this.cracks.push(new Crack({ scene: this, x, y }));
		}

		this.crackDelay = crackDelay;
		this.timeLeft = random(crackDelay) * 1000;

		this.crackMaxLength = crackMaxLength;

		this.dropsDelay = dropsDelay;
		this.dropTimeLeft = random(dropsDelay) * 1000;

		this.demonTimeLeft = random(1) * 1000;

		this.extendDelay = extendDelay;
		this.extendTimeLeft = random(extendDelay) * 1000;

		this.allowNewCracks = allowNewCracks;

		this.extendProbability = extendProbability;

		this.treesEnabled = treesEnabled;

		this.waterCapacity = this.waterLevel = waterCapacity;
		this.updateInventory();

		this.cameras.main.shake(500, 0.008);
		this.sound.play("Crack");
	}

	talkToIntroGuide() {
		if (this.scene.isActive("DialogScene"))
			return;

		const onlyGreen = this.worldMask.every((line, y) => (
			line.every((_, x) => (
				this.grassMask[y][x] >= this.worldMask[y][x]
			))
		));
		const isLevelOver = onlyGreen || (this.cracks.length == 0 && !this.allowNewCracks);
		if (isLevelOver)
			this.level++;
		const levelDialogs = dialogs[this.level];
		const dialog = isLevelOver ? levelDialogs.start : levelDialogs.loop;

		this.introGuide.setDialog(dialog);
		this.introGuide.interact();
	}

	isValidPosition(position: {x: number, y: number}, crackToIgnore = null) {
		const {x, y} = position;
		{
			let maskX = Math.round(x + (Conf.worldSize - 1) / 2);
			let maskY = Math.round(y + (Conf.worldSize - 1) / 2);
			if (!this.worldMask[maskX]?.[maskY] || !this.worldMask[maskX + 1]?.[maskY] || !this.worldMask[maskX]?.[maskY + 1] || !this.worldMask[maskX + 1]?.[maskY + 1])
				return false;
		}

		for (let i = 0; i < this.cracks.length; i++) {
			if (this.cracks[i] === crackToIgnore)
				continue;
			const crackPoints = this.cracks[i].crackPoints;
			const circle = new Phaser.Geom.Circle(x * Conf.tileSize, y * Conf.tileSize, Conf.crackHitboxSize);
			for (let j = 0; j < crackPoints.length - 1; j++) {
				const line = new Phaser.Geom.Line(
					crackPoints[j].x * Conf.tileSize,
					crackPoints[j].y * -Conf.tileSize,
					crackPoints[j + 1].x * Conf.tileSize,
					crackPoints[j + 1].y * -Conf.tileSize,
				);
				if (Phaser.Geom.Intersects.LineToCircle(line, circle))
					return false;
			}
			if (crackPoints.length == 1 && Phaser.Geom.Circle.Contains(circle, crackPoints[0].x * Conf.tileSize, crackPoints[0].y * -Conf.tileSize))
				return false;
		}

		if (this.introGuide.isAtBlockingDistance({x: position.x * Conf.tileSize, y: position.y * Conf.tileSize}))
			return false;

		const isGrassForbidden = !!crackToIgnore;
		if (isGrassForbidden) {
			let maskX = Math.round(x + (Conf.worldSize - 1) / 2);
			let maskY = Math.round(y + 0.5 + (Conf.worldSize - 1) / 2);
			if (this.grassMask[maskY]?.[maskX])
				return false;
		}

		return true;
	}

	fixPlayerPosition(iterations = 0) {
		if (iterations === 100)
			this.player.sprite.x = this.player.sprite.y = 0;

		if (!this.isValidPosition({x: this.player.x / Conf.tileSize, y: this.player.y / Conf.tileSize})) {
			this.player.sprite.x += Math.random() * Conf.tileSize;
			this.player.sprite.y += Math.random() * Conf.tileSize;
			this.fireEnd();
			this.fixPlayerPosition(iterations + 1);
		}
	}

	update(time: milliseconds, delta: milliseconds) {
		const healPoint = this.getCloseCrackPoint();
		if (healPoint && !this.player.isFiring) {
			this.crackPointIndicator.x = healPoint.crackPoint.x * Conf.tileSize;
			this.crackPointIndicator.y = -healPoint.crackPoint.y * Conf.tileSize;
			this.crackPointIndicator.setVisible(true);
			this.crackPointIndicator.setFrame(healPoint.tree ? 26 : 0);
		} else {
			this.crackPointIndicator.setVisible(false);
		}


        this.demons.forEach(demon => demon.update(time, delta));


		this.introGuide.update(this.player);

		if (!this.scene.isActive("DialogScene"))
			this.player.update(time, delta);

		this.cracks.forEach(c => c.update(time, delta));

		this.droplets.forEach(droplet => {
			if (this.waterLevel < this.waterCapacity) {
				if (droplet.isCloseTo(this.player)) {
					this.droplets = this.droplets.filter(d => d !== droplet);
					droplet.destroy();
					this.waterLevel++;
					this.updateInventory();
					this.sound.play("Droplet");
				}
			}
		});

		this.timeLeft -= delta;
		this.dropTimeLeft -= delta;
		this.demonTimeLeft -= delta;
		this.extendTimeLeft -= delta;

		if (this.timeLeft < 0) {
			this.timeLeft = random(this.crackDelay) * 1000;
			const crack = pick(this.allowNewCracks ? [null, ...this.cracks] : this.cracks);
			let shouldShake: boolean;
			if (crack) {
				if (crack.crackPoints.length < this.crackMaxLength) {
					shouldShake = crack.extend();
				}
			} else if (this.allowNewCracks) {
				let x: number, y: number, tries = 0;
				do {
					x = Math.floor((Math.random() - 0.5) * Conf.viewportWidth);
					y = Math.floor((Math.random() - 0.5) * Conf.viewportHeight);
					tries++;
				} while (!this.isValidPosition({x, y: -y}, true) && tries < 5)
				if (tries < 5)
					this.cracks.push(new Crack({ scene: this, x, y }));
			}
			if (shouldShake) {
				this.cameras.main.shake(200, 0.008);
				this.sound.play("Crack");
			}

			this.fixPlayerPosition();
		}

		// if (this.demonTimeLeft < 0) {
		// 	this.demonTimeLeft = random(4) * 1000;
        //     let x: number, y: number;
		// 	do {
		// 		x = Math.floor((Math.random() - 0.5) * Conf.worldSize * Conf.tileSize);
		// 		y = Math.floor((Math.random() - 0.5) * Conf.worldSize * Conf.tileSize);
		// 	} while (!this.isValidPosition({x: x / Conf.tileSize, y: -y / Conf.tileSize}))
        //     this.demons[0].setDestination({x, y});
        // }

		if (this.dropTimeLeft < 0) {
			this.dropTimeLeft = random(this.dropsDelay) * 1000;

			if (this.level > 1 && this.droplets.length < this.waterCapacity * 2) {
				let x: number, y: number;
				do {
					x = Math.floor((Math.random() - 0.5) * Conf.worldSize * Conf.tileSize);
					y = Math.floor((Math.random() - 0.5) * Conf.worldSize * Conf.tileSize);
				} while (!this.isValidPosition({x: x / Conf.tileSize, y: -y / Conf.tileSize}))
				this.droplets.push(new Droplet(this, x, y, time));
			}
		}

		this.droplets.forEach(droplet => {
			if (time > droplet.appearingTime + Conf.dropletTimeout * 1000) {
				droplet.image.destroy();
				this.droplets = this.droplets.filter(d => d !== droplet);
			}
		});

		if (this.extendTimeLeft < 0) {
			this.extendTimeLeft = random(this.extendDelay) * 1000;
			this.extendGrass();
		}
	}
}
