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
import {TreePosition, generateTreePositions} from "./functions";

import {combineAllPolygons, projectOutside, Segment, Polygon} from "./movement";

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

	borderWalls: Polygon = [];
	walls: Polygon = [];

	constructor() {
		super("MainScene");
	}

	getValidDropPosition(): Position | null {
		let x = 0, y = 0, i = 0, j = 0, tries;

		for (tries = 0; tries < 100; tries++) {
			x = Math.random() * this.level.worldSize * Conf.tileSize;
			y = Math.random() * this.level.worldSize * Conf.tileSize;

			j = Math.floor(x / Conf.tileSize);
			i = Math.floor(y / Conf.tileSize);
			if (this.worldMask[i]?.[j]
					&& this.worldMask[i + 1]?.[j]
					&& this.worldMask[i]?.[j + 1]
					&& this.worldMask[i + 1]?.[j + 1]
					&& projectOutside({x: x / Conf.tileSize, y: y / Conf.tileSize}, this.walls).type == "outside"
			) {
				break;
			}
		}

		if (tries == 100) {
			return null;
		}

		return {x, y};
	}

	getValidNewCrackPosition(): Position | null {
		const walls = combineAllPolygons([
			this.borderWalls,
			...this.cracks
				.map(crack => crack.getWalls())]
		);
		for (let tries = 0; tries < 100; tries++) {
			const x = Math.random() * this.level.worldSize * Conf.tileSize;
			const y = Math.random() * this.level.worldSize * Conf.tileSize;
			if (this.isCrackAllowedAt([
				{x, y},
				{x: x + 7, y},
				{x: x - 7, y},
				{x, y: y + 7},
				{x, y: y - 7},
			], undefined, walls)) {
				return {x, y};
			}
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
		for (let y = 0; y < Conf.viewportHeight * 2; y++) {
			backgroundLayerData[y] = [];
			for (let x = 0; x < Conf.viewportWidth * 2; x++) {
				backgroundLayerData[y][x] = pick([...new Array(15).fill(0), 1, 2, 3, 4, 5, 6, 7, 8]);
			}
		}
		const backgroundTilemap = this.make.tilemap({
			data: backgroundLayerData,
			tileWidth: Conf.tileSize,
			tileHeight: Conf.tileSize,
			width: this.level.worldSize * 2,
			height: this.level.worldSize * 2,
		});
		const backgroundTileset = backgroundTilemap.addTilesetImage("tileset", "SpaceTiles");
		const backgroundLayer = backgroundTilemap.createLayer(0, backgroundTileset);

		backgroundLayer.x = 1000;
		backgroundLayer.y = 1000;

		this.cameras.add(0, 0, undefined, undefined, false, "Background").setScroll(1000 + this.player.x / 3, 1000 + this.player.y / 3);
		this.cameras.cameras.reverse();
	}

	create() {
		let treePositions: TreePosition[];
		do {
			treePositions = generateTreePositions(this.level.worldSize);
		} while (this.level.maxTrees && treePositions.length > this.level.maxTrees);

		const borderWalls = [];
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

				const walls: {[key: string]: Segment} = {
					"1100": {from: {x, y}, to: {x: x + 1, y}},
					"0110": {from: {x: x + 1, y}, to: {x: x + 1, y: y + 1}},
					"0011": {from: {x: x + 1, y: y + 1}, to: {x, y: y + 1}},
					"1001": {from: {x, y: y + 1}, to: {x, y}},

					"0111": {from: {x: x + 1, y}, to: {x, y: y + 1}},
					"1011": {from: {x: x + 1, y: y + 1}, to: {x, y}},
					"1101": {from: {x, y: y + 1}, to: {x: x + 1, y}},
					"1110": {from: {x, y}, to: {x: x + 1, y: y + 1}},
				}
				if (walls[value]) {
					borderWalls.push(walls[value]);
				}
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
		for (let y = 0; y < this.level.worldSize + 1; y++) {
			this.grassMask[y] = [];
			for (let x = 0; x < this.level.worldSize + 1; x++) {
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
				const noTreeAt = (i: number, j: number) => !treePositions.find(tree => tree.i == i && tree.j == j);
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

		this.trees.forEach(tree => tree.destroy());
		this.trees = [];
		treePositions.forEach(({i, j, size}) => {
			const possibleTrees = {
				"big": [0, 1, 2, 3, 4],
				"small": [5, 6, 7, 8, 9],
			}[size];
			const treeId: number = pick(possibleTrees);
			const tree = this.add.sprite(j * Conf.tileSize, (i - 0.5) * Conf.tileSize, "Trees", deadTreeTile[treeId]);
			this.treePositions.push({i, j, treeId, status: "dead", size});
			this.trees.push(tree);
		});

		this.player = new Player(this, this.level.skin, this.level.worldSize * Conf.tileSize / 2, this.level.worldSize * Conf.tileSize / 2);
		this.introGuide = new NPC(this, this.level.worldSize * Conf.tileSize / 2, (this.level.worldSize - 4) * Conf.tileSize / 2, "Characters", this.levelNum);

		this.cameras.main.startFollow(this.player, true);

		this.createStarryBackground();

		this.targetSprite = this.add.sprite(0, 0, "CrackPoints", 0).setVisible(false).setDepth(Conf.zIndex.target);

		const makeRectangle = (x: number, y: number, w: number, h: number): Polygon => {
			const cornerNW = {x: x - w/2, y: y - h/2};
			const cornerNE = {x: x + w/2, y: y - h/2};
			const cornerSW = {x: x - w/2, y: y + h/2};
			const cornerSE = {x: x + w/2, y: y + h/2};
			return [
				{from: cornerNW, to: cornerNE},
				{from: cornerNE, to: cornerSE},
				{from: cornerSE, to: cornerSW},
				{from: cornerSW, to: cornerNW},
			]
		};
		const guidePolygon = makeRectangle(this.level.worldSize / 2, this.level.worldSize / 2 - 2, 1.4, 1.4);
		const treesPolygons = this.treePositions.map(({i, j, size}) => (
			size == "big" ? makeRectangle(j, i - 0.5, 1.4, 1.4) : makeRectangle(j, i - 0.5, 1.4, 0.9)
		));
		this.borderWalls = combineAllPolygons([borderWalls, guidePolygon, ...treesPolygons]);

		this.demons = [];
		this.droplets = [];
		this.cracks = [];

		this.waterLevel = this.level.waterCapacity;
		this.regenerateState();

		this.talkToIntroGuide();
	}

	startLevel() {
		this.isLevelStarted = true;

		this.input.keyboard.on('keydown-SPACE', () => this.interaction());
		this.input.keyboard.on('keydown-ENTER', () => this.interaction());
		this.input.keyboard.on('keyup-SPACE', () => this.fireEnd());
		this.input.keyboard.on('keyup-ENTER', () => this.fireEnd());

		for (let i = 0; i < this.level.initialNumberOfCracks; i++) {
			const position = this.getValidNewCrackPosition();
			if (position)
				this.cracks.push(new Crack({scene: this, ...position}));
		}

		this.regenerateState();

		if (this.level.initialNumberOfCracks > 0) {
			this.cameras.main.shake(200, 0.008);
			this.sound.play("CrackAppears");
		}

		const setRandomInterval = (interval: MaybeRandomNumber, callback: () => void) => {
			const fun = () => {
				callback();
				this.time.delayedCall(random(interval) * 1000, fun)
			};
			this.time.delayedCall(random(interval) * 1000, fun);
		}

		setRandomInterval(this.level.crackDelay, () => {
			const crack = pick(this.level.allowNewCracks ? [null, ...this.cracks] : this.cracks);
			let shouldShake = false;
			if (crack) {
				if (crack.crackPoints.length < (this.level.crackMaxLength || Infinity)) {
					shouldShake = crack.extend();
				}
			} else if (this.level.allowNewCracks) {
				const position = this.getValidNewCrackPosition();
				if (position) {
					this.cracks.push(new Crack({ scene: this, x: position.x, y: position.y }));
					shouldShake = true;
				}
			}
			if (shouldShake) {
				this.cameras.main.shake(200, 0.008);
				this.sound.play("CrackAppears");
			}

			this.regenerateState();
		});

		setRandomInterval(this.level.dropsDelay, () => {
			if (this.droplets.length < 5 * 2) {
				const position = this.getValidDropPosition();
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

	usedSpawnPositions : string[] = [];

	createNewDemon() {
		const spawnPoints = this.cracks.map(crack => (
			crack.crackPoints.filter(crackPoint => crackPoint.size == 3 && !this.usedSpawnPositions.includes(`${crackPoint.x} ${crackPoint.y}`))
		)).flat();
		if (spawnPoints.length > 0 && this.demons.length < this.level.maxDemons) {
			const spawnPoint = pick(spawnPoints);
			this.usedSpawnPositions.push(`${spawnPoint.x} ${spawnPoint.y}`)
			this.demons.push(new Demon(this, spawnPoint.x, spawnPoint.y));
		}
	}

	requestNewDestination(demon: Demon) {
		// Prefer green trees if there are any, otherwise attack dead trees
		let trees = this.getTrees({alive: true});
		if (trees.length == 0) {
			trees = this.getTrees({dead: true});
		}

		// Pick a random tree among the prefered ones
		if (trees.length > 0) {
			const tree = pick(trees);
			demon.setDestination({x: tree.x, y: tree.y});
		}
	}

	burnTreeAt(i: number, j: number) {
		const tree = this.trees.find(tree => tree.x == j * Conf.tileSize && tree.y == (i - 0.5) * Conf.tileSize);
		const treePos = this.treePositions.find(tp => tp.i == i && tp.j == j);
		const treeId = treePos?.treeId || 0;
		if (tree && !tree.anims)
			debugger;
		tree?.play("BurningTree" + treeId);
		if (treePos)
			treePos.status = "burning";
		this.regenerateState();
	}

	loseGame() {
		this.scene.stop("DialogScene");
		this.sound.stopByKey("Music");
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
	}

	nextLevel() {
		this.scene.stop();
		this.scene.wake("LevelSelect", {type: "complete", payload: this.levelNum});
	}

	updateTrees() {
		for (const treePos of this.treePositions) {
			if (this.isTooCloseToCrack(treePos, 2) && treePos.status !== "burning") {
				this.burnTreeAt(treePos.i, treePos.j);
			}
		}
	}

	updateLifeBar() {
		const numberOfTrees = this.treePositions.length;
		const numberOfGreenTrees = this.treePositions.filter(tree => tree.status === "live").length;
		const numberOfBurningTrees = this.treePositions.filter(tree => tree.status === "burning").length;
		const greenFactor = numberOfGreenTrees / numberOfTrees;
		const redFactor = numberOfBurningTrees / numberOfTrees;
		(this.scene.get("LifeBarScene") as LifeBarScene).updateLifeBar(greenFactor, redFactor);
	}

	updateInventory(capacity = this.level.waterCapacity) {
		(this.scene.get("InventoryScene") as InventoryScene).updateInventory(capacity, this.waterLevel, this.isLevelOver);
	}

	regenerateState() {
		this.updateTrees();
		this.updateGrassMask();
		this.updateForGrass();
		this.updateLifeBar();

		this.walls = combineAllPolygons([this.borderWalls, ...this.cracks.map(crack => crack.getWalls())]);

		this.fixPlayerPosition();

		if (this.treePositions.every(tp => tp.status == "burning"))
			this.loseGame();

		if (!this.isLevelOver) {
			this.isLevelOver = this.treePositions.every(tree => tree.status == "live") && this.demons.length == 0 && this.cracks.length == 0;
			if (this.isLevelOver) {
				this.onLevelComplete();
			}
		}

		this.updateInventory();
	}

	onLevelComplete() {
		this.player.direction = "S";
		this.introGuide.setDialog(dialogs[this.levelNum].end);
		this.introGuide.interact(() => {
			if (this.level.nextWaterCapacity !== this.level.waterCapacity) {
				this.updateInventory(this.level.nextWaterCapacity);
			}
			if (this.level.upgradeSkin) {
				this.player.upgradeSkin();
			}
			this.sound.play("Prize");
			this.time.delayedCall(1000, () => {
				this.add.image(this.player.x, this.player.y, "LevelOver").setDepth(Conf.zIndex.levelComplete);
				this.sound.play("LevelComplete");
				this.input.keyboard.on('keydown-SPACE', () => this.nextLevel());
				this.input.keyboard.on('keydown-ENTER', () => this.nextLevel());
				this.input.on("pointerdown", () => this.nextLevel());
			});
		});
	}

	getTrees({dead = false, alive = false, burning = false}) {
		const result: Position[] = [];
		this.treePositions.forEach(({i, j, status}) => {
			const x = j * Conf.tileSize;
			const y = (i - 0.5) * Conf.tileSize;
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
			if (distance < 1.5 * Conf.tileSize && !this.isTooCloseToCrack({i: Math.round(y / Conf.tileSize + 0.5), j: Math.round(x / Conf.tileSize)}, 2))
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
				"tree": `Target${this.level.skin}Tree`,
				"crack": `Target${this.level.skin}Crack`,
				"demon": `Target${this.level.skin}Demon`,
			}[target.sort]);
			if (target.sort == "demon") {
				const demon = this.demons.find(demon => demon.x == target.x && demon.y == target.y);
				demon?.stop();
			}
		}
	}

	isTooCloseToCrack(pos: {i: number, j: number}, radius: number) {
		const distanceLt = (a: {i: number, j: number}, b: {i: number, j: number}, radius: number) => (
			Math.pow(a.i - b.i, 2) + Math.pow(a.j - b.j, 2) < radius * radius
		);

		return this.cracks.some(crack => (
			crack.crackPoints.some(crackPoint => (
				distanceLt(pos, {i: crackPoint.y / Conf.tileSize, j: crackPoint.x / Conf.tileSize}, radius)
			))
		))
	}

	updateGrassMask() {
		const greenSizes = {
			"small": 2.5,
			"big": 3.5,
		};
		const burningSizes = {
			"small": 1.5,
			"big": 2.5,
		};

		const crackSize = 1.5;

		const distanceLt = (a: {i: number, j: number}, b: {i: number, j: number}, radius: number) => (
			Math.pow(a.i - b.i, 2) + Math.pow(a.j - b.j, 2) < radius * radius
		);

		for (let i = 0; i < this.level.worldSize + 1; i++) {
			for (let j = 0; j < this.level.worldSize + 1; j++) {
				if (
					// Outside the planet
					!this.worldMask[i][j]
					// No green tree close by
						|| !this.treePositions.some(tree => tree.status == "live" && distanceLt(tree, {i, j}, greenSizes[tree.size]))
					// Burning tree too close
						|| this.treePositions.some(tree => tree.status == "burning" && distanceLt(tree, {i, j}, burningSizes[tree.size]))
					// Crack too close
						|| this.cracks.some(crack => crack.crackPoints.some(crackPoint => (
							distanceLt({i: crackPoint.y / Conf.tileSize, j: crackPoint.x / Conf.tileSize}, {i, j}, crackSize))
						))) {
					this.grassMask[i][j] = 0;
				} else {
					this.grassMask[i][j] = 1;
				}
			}
		}
	}

	heal() {
		if (!this.pointTargeted)
			return;

		const {sort, x, y} = this.pointTargeted;
		const i = Math.ceil(y / Conf.tileSize);
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
					}
					if (treePos.status == "burning") {
						treePos.status = "dead";
						tree?.stop();
						tree?.setFrame(deadTreeTile[treeId]);
					}
				}
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
		this.regenerateState();
		this.pointTargeted = undefined;
	}

	fireEnd() {
		this.player.fireEnd();
		if (this.pointTargeted) {
			const {sort, x, y} = this.pointTargeted;
			if (sort === "demon") {
				const demon = this.demons.find(demon => demon.x == x && demon.y == y);
				demon?.unStop();
			}
			this.pointTargeted = undefined;
		}
		this.targetSprite.stop();
		this.targetSprite.setVisible(false);
	}

	talkToIntroGuide() {
		if (this.scene.isActive("DialogScene"))
			return;

		const levelDialogs = dialogs[this.levelNum];
		const dialog = this.isLevelStarted ? levelDialogs.loop : levelDialogs.start;

		this.introGuide.setDialog(dialog);
		this.introGuide.interact(this.isLevelStarted ? () => {} : () => {
			this.startLevel();
		});
	}

	isCrackAllowedAt(positions: Position[], crackToIgnore?: Crack, precomputedWalls?: Polygon) {
		const walls = precomputedWalls || combineAllPolygons([
			this.borderWalls,
			...this.cracks
				.filter(crack => crack !== crackToIgnore)
				.map(crack => crack.getWalls())]
		);
		return positions.every(position => {
			const {x, y} = position;
			const i = Math.floor(y / Conf.tileSize);
			const j = Math.floor(x / Conf.tileSize);

			if (this.grassMask[i]?.[j]
				|| this.grassMask[i + 1]?.[j]
				|| this.grassMask[i]?.[j + 1]
				|| this.grassMask[i + 1]?.[j + 1]) {
				return false;
			}

			const {type} = projectOutside({x: x / Conf.tileSize, y: y / Conf.tileSize}, walls);
			return type !== "inside";
		});
	}

	fixDelta(pos: Position, {dx, dy} : {dx: number, dy: number}) {
		if (Math.abs(dx) >= Conf.tileSize || Math.abs(dy) >= Conf.tileSize) {
			console.error("Too big delta");
			dx = Math.max(-Conf.tileSize, Math.min(Conf.tileSize, dx));
			dy = Math.max(-Conf.tileSize, Math.min(Conf.tileSize, dy));
		}
	}

	fixPlayerPosition() {
		const result = projectOutside(
			{
				x: this.player.currentX / Conf.tileSize,
				y: this.player.currentY / Conf.tileSize,
			},
			this.walls
		);

		this.player.currentX = result.x * Conf.tileSize;
		this.player.currentY = result.y * Conf.tileSize;
		this.player.x = Math.round(this.player.currentX);
		this.player.y = Math.round(this.player.currentY);

		if (result.type == "inside") {
			this.fireEnd();
		}
	}

	update(time: number, delta: number) {
		if (this.isLevelOver || !this.isLevelStarted)
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

		const bgCamera = this.cameras.getCamera("Background");
		bgCamera.scrollX = 1000 + this.player.x / 3;
		bgCamera.scrollY = 1000 + this.player.y / 3;

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
					this.regenerateState();
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
