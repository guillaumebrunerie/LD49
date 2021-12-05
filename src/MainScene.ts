import * as Phaser from "phaser";

import * as Conf from "./configuration";
import Crack, {healAt} from "./Crack";
import Droplet from "./Droplet";
import dialogs from "./dialogs";
import InventoryScene from "./InventoryScene";
import LifeBarScene from "./LifeBarScene";
import NPC from "./NPC";
import Player from "./Player";
import {MaybeRandomNumber, pick, random, Position} from "./utils";
import Demon from "./Demon";
import {Mask, generateWorldMask} from "./Masks";

export type Target = {x: number, y: number, distance: number, sort: "crack" | "tree" | "demon"};

const liveTreeTile = [0, 13, 26, 39, 52, 65, 78, 4, 17, 30];
const deadTreeTile = liveTreeTile.map(x => x + 3);

export default class MainScene extends Phaser.Scene {
	worldMask: Mask = [];
	grassMask: Mask = [];
	groundTilemap!: Phaser.Tilemaps.Tilemap;
	grassTilemap!: Phaser.Tilemaps.Tilemap;
	stuffTilemap!: Phaser.Tilemaps.Tilemap;

	player!: Player;
	cracks: Crack[] = [];
	introGuide!: NPC;

	waterLevel!: number;

	droplets: Droplet[] = [];
	demons: Demon[] = [];
	trees: Phaser.GameObjects.Sprite[] = [];
	treePositions: {i: number, j: number, status: "live" | "dead" | "burning", treeId: number, size: "small" | "big"}[] = [];

	targetSprite!: Phaser.GameObjects.Sprite;
	pointTargeted?: Target;

	levelNum!: number;
	level!: Conf.LevelConfiguration;
	isLevelStarted = false;

	isLevelOver = false;

	constructor() {
		super("MainScene");
	}

	getValidPosition(flag: true | Crack | undefined): Position | null {
		for (let tries = 0; tries < 100; tries++) {
			const x = Math.random() * this.level.worldSize * Conf.tileSize;
			const y = Math.random() * this.level.worldSize * Conf.tileSize;
			if (this.isValidPosition({x, y}, flag))
				return {x, y}
		}
		return null;
	}

	init(data: {level: number}) {
		this.levelNum = data.level;
		this.level = Conf.levels[this.levelNum];
		this.isLevelOver = false;
		this.isLevelStarted = false;
	}

	createStarryBackground() {
		const backgroundLayerData: number[][] = [];
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
			width: this.level.worldSize,
			height: this.level.worldSize,
		});
		const backgroundTileset = backgroundTilemap.addTilesetImage("tileset", "SpaceTiles");
		const backgroundLayer = backgroundTilemap.createLayer(0, backgroundTileset);

		backgroundLayer.x = 1000;
		backgroundLayer.y = 1000;

		this.cameras.add(0, 0, undefined, undefined, false, "Background").setScroll(1000, 1000);
		this.cameras.cameras.reverse();
	}

	create() {
		const groundLayerData: number[][] = [];
		const mask = this.worldMask = generateWorldMask(this.level.worldSize);
		for (let y = 0; y < this.level.worldSize; y++) {
			groundLayerData[y] = [];
			for (let x = 0; x < this.level.worldSize; x++) {
				let maskNW = mask[y][x];
				let maskNE = mask[y][x + 1];
				let maskSE = mask[y + 1][x + 1];
				let maskSW = mask[y + 1][x];
				let value = `${maskNW}${maskNE}${maskSE}${maskSW}`;
				const tiles: {[key: string]: number} = {
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
					"1111": 0,
					"1010": 0,
					"0101": 0,
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
			width: this.level.worldSize,
			height: this.level.worldSize,
		});
		this.groundTilemap = groundTilemap;
		const groundTileset = groundTilemap.addTilesetImage("tileset", "Tiles");
		groundTilemap.createLayer(0, groundTileset);

		const grassLayerData: number[][] = [];
		for (let y = 0; y < this.level.worldSize; y++) {
			grassLayerData[y] = [];
			for (let x = 0; x < this.level.worldSize; x++) {
				grassLayerData[y][x] = 70;
			}
		}
		this.grassMask = [];
		for (let y = 0; y < this.level.worldSize + 2; y++) {
			this.grassMask[y] = [];
			for (let x = 0; x < this.level.worldSize + 2; x++) {
				this.grassMask[y][x] = 0;
			}
		}
		const grassTilemap = this.make.tilemap({
			data: grassLayerData,
			tileWidth: Conf.tileSize,
			tileHeight: Conf.tileSize,
			width: this.level.worldSize,
			height: this.level.worldSize,
		});
		this.grassTilemap = grassTilemap;
		const grassTileset = grassTilemap.addTilesetImage("tileset", "Tiles");
		grassTilemap.createLayer(0, grassTileset);



		const otherStuff = [9, 10, 11, 12, 22, 23, 24, 25, 31, 32, 44, 45];
		const nothing = new Array(100).fill(40);
		const stuffToPickFrom = [...otherStuff, ...nothing];
		const stuffLayerData: number[][] = [];
		for (let i = 0; i < this.level.worldSize; i++) {
			stuffLayerData[i] = [];
			for (let j = 0; j < this.level.worldSize; j++) {
				const noTreeAt = (i: number, j: number) => !this.level.treePositions.find(tree => tree.i == i && tree.j == j);
				if (mask[i][j] && mask[i + 1][j] && mask[i + 1][j + 1] && mask[i][j + 1] && noTreeAt(i, j) && noTreeAt(i, j + 1)) {
					const stuff = pick(stuffToPickFrom);
					stuffLayerData[i][j] = stuff;
				} else {
					stuffLayerData[i][j] = 40;
				}
			}
		}
		this.stuffTilemap = this.make.tilemap({
			data: stuffLayerData,
			tileWidth: Conf.tileSize,
			tileHeight: Conf.tileSize,
			width: this.level.worldSize,
			height: this.level.worldSize,
		});
		const stuffTileset = this.stuffTilemap.addTilesetImage("tileset", "Tiles");
		this.stuffTilemap.createLayer(0, stuffTileset).setDepth(Conf.zIndex.tree);

		this.treePositions = [];

		this.level.treePositions.forEach(({i, j, size}) => {
			const possibleTrees = {
				"big": [0, 1, 2, 3, 4],
				"small": [5, 6, 7, 8, 9],
			}[size];
			const treeId: number = pick(possibleTrees);
			const tree = this.add.sprite(j * Conf.tileSize, (i + 0.5) * Conf.tileSize, "Trees", deadTreeTile[treeId]);
			this.treePositions.push({i, j, treeId, status: "dead", size});
			this.trees.push(tree);
		});

		this.input.keyboard.on('keydown-SPACE', () => this.interaction());
		this.input.keyboard.on('keyup-SPACE', () => this.fireEnd());

		this.player = new Player(this, this.level.worldSize * Conf.tileSize / 2, this.level.worldSize * Conf.tileSize / 2);
		this.introGuide = new NPC(this, this.level.worldSize * Conf.tileSize / 2, (this.level.worldSize - 4) * Conf.tileSize / 2, "Characters", this.levelNum);

		this.cameras.main.startFollow(this.player);

		this.createStarryBackground();

		this.targetSprite = this.add.sprite(0, 0, "CrackPoints", 0).setVisible(false).setDepth(Conf.zIndex.target);


		for (let i = 0; i < this.level.initialNumberOfCracks; i++) {
			const position = this.getValidPosition(true);
			if (position)
				this.cracks.push(new Crack({scene: this, ...position}));
		}

		this.waterLevel = this.level.waterCapacity;
		this.updateInventory();
		this.updateLifeBar();

		this.cameras.main.shake(500, 0.008);

		const setRandomInterval = (interval: MaybeRandomNumber, callback: () => void) => {
			const fun = () => {
				callback();
				this.time.delayedCall(random(interval) * 1000, fun)
			};
			this.time.delayedCall(random(interval) * 1000, fun);
		}

		setRandomInterval(this.level.extendDelay, () => {
			this.extendGrass();
		});

		setRandomInterval(this.level.crackDelay, () => {
			const crack = pick(this.level.allowNewCracks ? [null, ...this.cracks] : this.cracks);
			let shouldShake = false;
			if (crack) {
				if (crack.crackPoints.length < (this.level.crackMaxLength || Infinity)) {
					shouldShake = crack.extend();
					this.updateTrees();
				}
			} else if (this.level.allowNewCracks) {
				const position = this.getValidPosition(true);
				if (position)
					this.cracks.push(new Crack({ scene: this, x: position.x, y: position.y }));
			}
			if (shouldShake) {
				this.cameras.main.shake(200, 0.008);
				this.sound.play("CrackAppears");
			}

			this.fixPlayerPosition();
		});

		setRandomInterval(this.level.dropsDelay, () => {
			if (this.droplets.length < this.level.waterCapacity * 2) {
				const position = this.getValidPosition(undefined);
				const superDroplet = Math.random() < 0.2;
				if (position) {
					this.droplets.push(new Droplet(this, position.x, position.y + Conf.tileSize, superDroplet));
				}
			}
		});

		setRandomInterval(this.level.demonDelay, () => {
			this.createNewDemon();
		});
	}

	createNewDemon() {
		const spawnPoints = this.cracks.map(crack => (
			crack.crackPoints.filter(crackPoint => crackPoint.size == 3)
		)).flat();
		if (spawnPoints.length > 0 && this.demons.length < 1) {
			const spawnPoint = pick(spawnPoints);
			this.demons.push(new Demon(this, spawnPoint.x, spawnPoint.y));
		}
	}

	requestNewDestination(demon: Demon) {
		// let position = null;
		// let distance = Infinity;
		// for (let i = 0; i < this.level.worldSize + 1; i++) {
		// 	const y = i * Conf.tileSize;
		// 	for (let j = 0; j < this.level.worldSize + 1; j++) {
		// 		const x = j * Conf.tileSize;
		// 		const newDistance = Math.pow(x - demon.x, 2) + Math.pow(y - demon.y, 2);
		// 		if (newDistance < distance && this.grassMask[i][j] && this.worldMask[i][j]) {
		// 			distance = newDistance;
		// 			position = {x, y};
		// 		}
		// 	}
		// }
		// if (position) {
		// 	demon.setDestination(position);
		// }
		let trees = this.getTrees({alive: true});
		if (trees.length == 0) {
			trees = this.getTrees({dead: true});
		}
		if (trees.length > 0) {
			const tree = pick(trees);
			demon.setDestination({x: tree.x, y: tree.y});
		}
	}

	burnTreeAt(i: number, j: number) {
		// const j = Math.floor(demon.x / Conf.tileSize);
		// const i = Math.floor(demon.y / Conf.tileSize);
		// this.grassMask[i][j] = 0;

		// for (let k = 0; k < 2; k++)
		// 	this.grassMask[i][j + k] = 0;
		// for (let k = -1; k < 3; k++)
		// 	this.grassMask[i + 1][j + k] = 0;
		// for (let k = 0; k < 2; k++)
		// 	this.grassMask[i + 2][j + k] = 0;

		// for (let k = 0; k < 2; k++)
		// 	this.grassMask[i - 1][j + k] = 0;
		// for (let k = -1; k < 3; k++)
		// 	this.grassMask[i][j + k] = 0;
		// for (let k = -2; k < 4; k++)
		// 	this.grassMask[i + 1][j + k] = 0;
		// for (let k = -1; k < 3; k++)
		// 	this.grassMask[i + 2][j + k] = 0;
		// for (let k = 0; k < 2; k++)
		// 	this.grassMask[i + 3][j + k] = 0;

		const tree = this.trees.find(tree => tree.x == j * Conf.tileSize && tree.y == (i + 0.5) * Conf.tileSize);
		const treePos = this.treePositions.find(tp => tp.i == i && tp.j == j);
		const treeId = treePos?.treeId || 0;
		tree?.play("BurningTree" + treeId);
		if (treePos)
			treePos.status = "burning";
		this.setGrassAround(i, j, treePos?.size || "small", 0);

		this.updateLifeBar();
		this.updateForGrass();
		if (this.treePositions.every(tp => tp.status == "burning"))
			this.loseGame();
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

	makeStuffTileDead(tile: number) {
		const liveTrees = [2, 3, 4, 5, 6, 7, 8, 33, 34, 59];
		if (liveTrees.includes(tile))
			return (tile + 13);
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
		for (let y = 0; y < this.level.worldSize; y++) {
			for (let x = 0; x < this.level.worldSize; x++) {
				let maskNW = this.grassMask[y][x]         * this.worldMask[y][x];
				let maskNE = this.grassMask[y][x + 1]     * this.worldMask[y][x + 1];
				let maskSE = this.grassMask[y + 1][x + 1] * this.worldMask[y + 1][x + 1];
				let maskSW = this.grassMask[y + 1][x]     * this.worldMask[y + 1][x];
				let value = `${maskNW}${maskNE}${maskSE}${maskSW}`;
				const tiles: {[key: string]: number} = {
					"1101": 65,
					"1110": 66,
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

				const stuff = this.stuffTilemap.getTileAt(x, y).index;
				if (maskSE && maskSW) {
					this.stuffTilemap.putTileAt(this.makeStuffTileAlive(stuff), x, y);
				} else {
					this.stuffTilemap.putTileAt(this.makeStuffTileDead(stuff), x, y);
				}
			}
		}

		if (!this.isLevelOver) {
			this.isLevelOver = this.treePositions.every(tree => tree.status == "live") && this.demons.length == 0 && this.cracks.length == 0;
			if (this.isLevelOver) {
				this.add.image(this.player.x, this.player.y, "LevelOver").setDepth(Conf.zIndex.levelComplete);
				this.input.keyboard.on('keydown-SPACE', () => this.nextLevel());
			}
		}
	}

	nextLevel() {
		this.scene.stop();
		this.scene.wake("LevelSelect", {type: "complete", payload: this.levelNum});
	}

	extendGrass() {
		const m: number[][] = this.grassMask;
		for (let y = 1; y < m.length - 1; y++) {
			for (let x = 1; x < m[0].length - 1; x++) {
				if (m[y][x] == 0 && (m[y][x + 1] == 1 || m[y][x - 1] == 1 || m[y - 1][x] == 1 || m[y + 1][x] == 1)) {
					if (Math.random() < this.level.extendProbability)
						m[y][x] = 2;
				}
			}
		}

		const distanceSquared = (
			({x: x1, y: y1}: Position, {x: x2, y: y2}: Position) =>
				(x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)
		);

		const hasCrack = (x: number, y: number) => (
			this.cracks.some(crack => (
				crack.crackPoints.some(crackPoint => (
					distanceSquared(crackPoint, {x: x * Conf.tileSize, y: y * Conf.tileSize}) < Conf.tileSize * Conf.tileSize * 4
				))
			))
		);

		for (let y = 0; y < this.level.worldSize; y++) {
			for (let x = 0; x < this.level.worldSize; x++) {
				if (m[y][x] == 2)
					m[y][x] = hasCrack(x, y) ? 0 : 1;
			}
		}

		this.updateForGrass();
	}

	updateTrees() {
		for (const treePos of this.treePositions) {
			if (this.isTooCloseToCrack(treePos.i, treePos.j) && treePos.status == "dead") {
				this.burnTreeAt(treePos.i, treePos.j);
			}
		}
	}

	updateLifeBar() {
		if (!this.scene.isActive("LifeBarScene"))
			this.scene.run("LifeBarScene");
		const numberOfTrees = this.treePositions.length;
		const numberOfNonBurningTrees = this.treePositions.filter(tree => tree.status !== "burning").length;
		const factor = numberOfNonBurningTrees / numberOfTrees;
		(this.scene.get("LifeBarScene") as LifeBarScene).updateLifeBar(factor);
	}

	updateInventory() {
		if (!this.scene.isActive("InventoryScene"))
			this.scene.run("InventoryScene");
		(this.scene.get("InventoryScene") as InventoryScene).updateInventory(this.level.waterCapacity, this.waterLevel);
	}

	getTrees({dead = false, alive = false, burning = false}) {
		const result: Position[] = [];
		this.treePositions.forEach(({i, j, status}) => {
			const x = j * Conf.tileSize;
			const y = (i + 0.5) * Conf.tileSize;
			if (dead && status == "dead")
				result.push({x, y});
			if (alive && status == "live")
				result.push({x, y});
			if (burning && status == "burning")
				result.push({x, y});
		});
		return result;
	}

	test(): number {
		return [][0];
	}

	getTarget() : Target | undefined {
		const possibleTargets: Target[] = [];

		if (this.waterLevel == 0)
			return;

		for (const demon of this.demons) {
			const dx = Math.abs(demon.x - this.player.x);
			const dy = Math.abs(demon.y - this.player.y);
			const distance = dx + dy;
			if (distance < 1.5 * Conf.tileSize)
				return ({x: demon.x, y: demon.y, distance, sort: "demon"});
		}

		this.cracks.forEach(crack => {
			crack.crackPoints.forEach(crackPoint => {
				const x = crackPoint.x;
				const y = crackPoint.y;
				const distance = crack.distanceToPlayer({x, y});
				if (distance < 1.5 * Conf.tileSize)
					possibleTargets.push({x, y, distance, sort: "crack"});
			});
		});

		this.getTrees({dead: true, burning: true}).forEach(({x, y}) => {
			const dx = Math.abs(x - this.player.x);
			const dy = Math.abs(y - this.player.y);
			const distance = dx + dy;
			if (distance < 1.5 * Conf.tileSize && !this.isTooCloseToCrack(Math.round(y / Conf.tileSize - 0.5), Math.round(x / Conf.tileSize)))
				possibleTargets.push({x, y, distance, sort: "tree"});
		});
		return possibleTargets.sort((a, b) => a.distance - b.distance)[0];
	}

	interaction() {
		if (this.introGuide.isAtInteractionDistance(this.player)) {
			this.talkToIntroGuide();
			return;
		}

		if (this.waterLevel == 0)
			return; // No water

		const target = this.getTarget();
		if (target && !this.player.isFiring) {
			this.pointTargeted = target;
			this.player.fireStart(target);
			this.targetSprite.setVisible(true);
			this.targetSprite.x = target.x;
			this.targetSprite.y = target.y;
			this.targetSprite.play({
				"tree": "TargetTree",
				"crack": "TargetCrack",
				"demon": "TargetDemon",
			}[target.sort]);
			if (target.sort == "demon") {
				const demon = this.demons.find(demon => demon.x == target.x && demon.y == target.y);
				demon?.stop();
			}
		}
	}

	isTooCloseToCrack(i: number, j: number) {
		const distanceSquared = (
			({x: x1, y: y1}: Position, {x: x2, y: y2}: Position) =>
				(x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)
		);

		const hasCrack = (i: number, j: number) => (
			this.cracks.some(crack => (
				crack.crackPoints.some(crackPoint => (
					distanceSquared(crackPoint, {x: j * Conf.tileSize, y: i * Conf.tileSize}) < Conf.tileSize * Conf.tileSize * 4
				))
			))
		);

		return hasCrack(i, j);
	}

	setGrassAround(i: number, j: number, treeSize: "small" | "big", grassValue: 0 | 1) {
		const size = {
			"small": 2.5,
			"big": 3.5,
		}[treeSize];

		for (let i2 = 0; i2 < this.level.worldSize + 1; i2++) {
			for (let j2 = 0; j2 < this.level.worldSize + 1; j2++) {
				const di = Math.abs(i2 - (i + 1));
				const dj = Math.abs(j2 - j);
				if (Math.pow(di, 2) + Math.pow(dj, 2) < size * size)
					this.grassMask[i2][j2] = this.isTooCloseToCrack(i2, j2) ? 0 : grassValue;
			}
		}
	}

	heal() {
		if (!this.pointTargeted)
			return;

		const {sort, x, y} = this.pointTargeted;
		const i = Math.floor(y / Conf.tileSize);
		const j = Math.floor(x / Conf.tileSize);
		this.waterLevel--;
		switch (sort) {
			case "tree":
				const tree = this.trees.find(tree => tree.x == x && tree.y == y);
				const treePos = this.treePositions.find(tp => tp.i == i && tp.j == j);
				const treeId = treePos?.treeId || 0;
				if (treePos) {
					if (treePos.status == "dead") {
						tree?.setFrame(liveTreeTile[treeId]);
						treePos.status = "live";
						this.setGrassAround(i, j, treePos.size, 1);
					}
					if (treePos.status == "burning") {
						treePos.status = "dead";
						tree?.stop();
						tree?.setFrame(deadTreeTile[treeId]);
					}
				}
				this.updateLifeBar();
				this.updateForGrass();
				this.sound.play("TreeHealed");
				break;
			case "crack":
				const crack = this.cracks.find(c => c.crackPoints.some(cp => cp.x == x && cp.y == y));
				if (!crack)
					break;
				const crackPoint = crack.crackPoints.find(cp => cp.x == x && cp.y == y);
				if (!crackPoint)
					break;
				const newCracks = healAt(this, crack, crackPoint);
				crack.destroy();
				this.cracks = this.cracks.filter(c => c !== crack);
				this.cracks.push(...newCracks);
				this.sound.play("CrackHealed");
				break;
			case "demon":
				const demon = this.demons.find(demon => demon.x == x && demon.y == y);
				demon?.die();
				this.demons = this.demons.filter(d => d !== demon);
				break;
		}
		this.updateInventory();
		this.pointTargeted = undefined;
	}

	fireEnd() {
		this.player.fireEnd();
		this.pointTargeted = undefined;
		this.targetSprite.stop();
		this.targetSprite.setVisible(false);
	}

	talkToIntroGuide() {
		if (this.scene.isActive("DialogScene"))
			return;

		const levelDialogs = dialogs[this.levelNum];
		const dialog = this.isLevelStarted ? levelDialogs.loop : levelDialogs.start;

		this.introGuide.setDialog(dialog);
		this.introGuide.interact();

		this.isLevelStarted = true;
	}

	isValidPosition(position: Position, crackToIgnore?: true | Crack) {
		const {x, y} = position;

		let j = Math.floor(x / Conf.tileSize);
		let i = Math.floor(y / Conf.tileSize);
		if (!this.worldMask[i]?.[j]
			|| !this.worldMask[i + 1]?.[j]
			|| !this.worldMask[i]?.[j + 1]
			|| !this.worldMask[i + 1]?.[j + 1]) {
			return false;
		}

		const isGrassForbidden = !!crackToIgnore;
		if (isGrassForbidden && (
			this.grassMask[i]?.[j]
				|| this.grassMask[i + 1]?.[j]
				|| this.grassMask[i]?.[j + 1]
				|| this.grassMask[i + 1]?.[j + 1])) {
			return false;
		}

		for (let i = 0; i < this.cracks.length; i++) {
			if (this.cracks[i] === crackToIgnore)
				continue;
			const crackPoints = this.cracks[i].crackPoints;
			const circle = new Phaser.Geom.Circle(x, y, Conf.crackHitboxSize);
			for (let j = 0; j < crackPoints.length - 1; j++) {
				const line = new Phaser.Geom.Line(
					crackPoints[j].x,
					crackPoints[j].y,
					crackPoints[j + 1].x,
					crackPoints[j + 1].y,
				);
				if (Phaser.Geom.Intersects.LineToCircle(line, circle))
					return false;
			}
			if (crackPoints.length == 1 && Phaser.Geom.Circle.Contains(circle, crackPoints[0].x, crackPoints[0].y))
				return false;
		}

		if (this.introGuide.isAtBlockingDistance({x, y}))
			return false;

		return true;
	}

	fixDelta(pos: Position, {dx, dy} : {dx: number, dy: number}) {
		if (Math.abs(dx) >= Conf.tileSize || Math.abs(dy) >= Conf.tileSize) {
			console.error("Too big delta");
			dx = Math.max(-Conf.tileSize, Math.min(Conf.tileSize, dx));
			dy = Math.max(-Conf.tileSize, Math.min(Conf.tileSize, dy));
		}

		
	}

	fixPlayerPosition() {
		if (this.isValidPosition(this.player))
			return;

		let tries = 0;
		do {
			this.player.x += (Math.random() - 0.5) * Conf.tileSize;
			this.player.y += (Math.random() - 0.5) * Conf.tileSize;
			tries++;
		} while (!this.isValidPosition(this.player) && tries < 100)
		console.log(`Fixed player position after ${tries} tries`);
		if (tries == 100)
			this.player.x = this.player.y = this.level.worldSize * Conf.tileSize / 2;
		this.fireEnd();
	}

	update(time: number, delta: number) {
		if (this.isLevelOver)
			return;

		const target = this.getTarget();
		if (target && !this.player.isFiring) {
			this.targetSprite.x = target.x;
			this.targetSprite.y = target.y;
			this.targetSprite.setVisible(true);
			this.targetSprite.setFrame({
				"crack": 0,
				"tree": 26,
				"demon": 52,
			}[target.sort]);
		} else if (!target) {
			this.targetSprite.setVisible(false);
		}

		this.demons.forEach(demon => demon.update(time, delta));

		this.introGuide.update();

		if (!this.scene.isActive("DialogScene"))
			this.player.update(time, delta);

		this.cracks.forEach(c => c.update(time, delta));

		this.droplets.forEach(droplet => {
			if (this.waterLevel < this.level.waterCapacity) {
				if (droplet.isCloseTo(this.player)) {
					this.droplets = this.droplets.filter(d => d !== droplet);
					droplet.destroy();
					if (droplet.superDroplet)
						this.waterLevel = this.level.waterCapacity;
					else
						this.waterLevel++;
					this.updateInventory();
					this.sound.play((droplet.superDroplet ? "Super" : "") + "DropletCollected");
				}
			}

			if (time > droplet.appearingTime + Conf.dropletTimeout * 1000) {
				droplet.destroy();
				this.droplets = this.droplets.filter(d => d !== droplet);
			}
		});

		// if (this.demonTimeLeft < 0) {
		// 	this.demonTimeLeft = random(4) * 1000;
		//     let x: number, y: number;
		// 	do {
		// 		x = Math.floor((Math.random() - 0.5) * Conf.worldSize * Conf.tileSize);
		// 		y = Math.floor((Math.random() - 0.5) * Conf.worldSize * Conf.tileSize);
		// 	} while (!this.isValidPosition({x: x / Conf.tileSize, y: -y / Conf.tileSize}))
		//     this.demons[0].setDestination({x, y});
		// }
	}
}
