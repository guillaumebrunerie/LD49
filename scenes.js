const playerWalkAnimations = [
	["W", [13, 14, 15]],
	["E", [26, 27, 28]],
	["N", [65, 66, 67]],
	["S", [0, 1, 2]],
	["NW", [52, 53, 54]],
	["NE", [56, 57, 58]],
	["SW", [39, 40, 41]],
	["SE", [43, 44, 45]],
];

const idleFrame = Object.fromEntries(playerWalkAnimations.map(([d, [x, ...rest]]) => [d, x]));
const firingFrame = Object.fromEntries(playerWalkAnimations.map(([d, [x, ...rest]]) => [d, x + 3]));
firingFrame.E++;
firingFrame.W++;

class StartScene extends Phaser.Scene {
	constructor() {
		super("StartScene");
	}

	preload() {
		const tileConf = {frameWidth: conf.tileSize, frameHeight: conf.tileSize};

		this.load.setPath("assets/Audio");
		this.load.audio("music", "Music/Exploration_Dark (loop).mp3");

		this.load.audio("Beep1", "Fx/sci-fi_beep_computer_ui_01.mp3");
		this.load.audio("Beep2", "Fx/sci-fi_beep_computer_ui_02.mp3");
		this.load.audio("Beep3", "Fx/sci-fi_beep_computer_ui_03.mp3");
		this.load.audio("Beep4", "Fx/sci-fi_beep_computer_ui_04.mp3");
		this.load.audio("Beep5", "Fx/sci-fi_beep_computer_ui_05.mp3");

		this.load.audio("Water", "Fx/GunShot.mp3");

		this.load.audio("Crack", "Fx/Crack.mp3");

		this.load.audio("Droplet", "Fx/PickUpDroplet.mp3");

		this.load.audio("Tree", "Fx/PickUpDroplet2.mp3");

		this.load.setPath("assets/UI");
		this.load.image("Start_Screen");
		this.load.image("Btn_Start");
		this.load.image("Btn_Start_Active");

		this.load.setPath("assets");
		this.load.image("DialogBackground");

		this.load.image("Water_Bullet", "UI/Water_Bullet.png");
		this.load.image("Water_Inventory", "UI/Water_Inventory.png");
		this.load.image("WaterDroplet", "Collectables/Droplet.png");

		this.load.spritesheet("Tiles", "SpriteSheets/BgElements.png", tileConf);
		this.load.spritesheet("SpaceTiles", "SpriteSheets/BgSpace.png", tileConf);

		this.load.spritesheet("CracksTiles", "SpriteSheets/Cracks.png", {frameWidth: conf.crackTileSize, frameHeight: conf.crackTileSize});
		this.load.spritesheet("CrackPoints", "SpriteSheets/CrackPoints.png", tileConf);

		this.load.spritesheet("Player", "SpriteSheets/Hero.png", tileConf);
		this.load.spritesheet("Characters", "SpriteSheets/Characters.png", tileConf);
		this.load.spritesheet("Bubble", "SpriteSheets/SpeechBubble.png", tileConf);
		this.load.spritesheet("Laser", "SpriteSheets/Laser.png", tileConf);

		this.load.spritesheet("Font", "Font.png", {frameWidth: 8, frameHeight: 8});

		this.load.spritesheet("GameWon", "SpriteSheets/WinScreen.png", {frameWidth: 480, frameHeight: 240});
		this.load.spritesheet("GameLost", "LoadingScreen.png", {frameWidth: 480, frameHeight: 240});
	}

	create() {
		this.add.image(0, 0, "Start_Screen").setOrigin(0, 0);

		this.anims.create({
			key: "GameWon",
			frameRate: 5,
			frames: this.anims.generateFrameNames("GameWon", {start: 0, end: 8}),
		});

		this.anims.create({
			key: "CrackPoint",
			frameRate: 14 / conf.crackResistance,
			frames: this.anims.generateFrameNames("CrackPoints", {start: 1, end: 15}),
		});

		this.anims.create({
			key: "CrackPointTree",
			frameRate: (42 - 27) / conf.crackResistance,
			frames: this.anims.generateFrameNames("CrackPoints", {start: 27, end: 42}),
		});

		this.anims.create({
			key: "BubbleStart",
			frameRate: 15,
			frames: this.anims.generateFrameNames("Bubble", {frames: [0, 1, 2]}),
		});

		this.anims.create({
			key: "BubbleLoop",
			frameRate: 3,
			frames: this.anims.generateFrameNames("Bubble", {frames: [2, 3, 4, 5]}),
			repeat: -1,
		});

		this.anims.create({
			key: "BubbleEnd",
			frameRate: 15,
			frames: this.anims.generateFrameNames("Bubble", {frames: [2, 1, 0, 6]}),
		});

		const laserAnimations = [
			["W", 0],
			["E", 3],
			["N", 6],
			["S", 9],
			["NW", 13],
			["NE", 16],
			["SW", 19],
			["SE", 22],
			["Particles", 26],
		];

		laserAnimations.forEach(([suffix, frame]) => {
			this.anims.create({
				key: "Laser" + suffix,
				frameRate: 5,
				frames: this.anims.generateFrameNames("Laser", {start: frame, end: frame + 2}),
				repeat: -1
			});
		});

		playerWalkAnimations.forEach(([suffix, frames]) => {
			this.anims.create({
				key: "PlayerWalk" + suffix,
				frameRate: 10,
				frames: this.anims.generateFrameNames("Player", {frames}),
				repeat: -1
			});
		});

		const startButton = this.add.image(conf.startButton.x, conf.startButton.y, "Btn_Start");
		window.sb = startButton;
		startButton.setInteractive();
		startButton.on("pointerdown", () => {
			startButton.isDown = true;
			startButton.setTexture("Btn_Start_Active");
		});
		startButton.on("pointerout", () => {
			startButton.isDown = false;
			startButton.setTexture("Btn_Start");
		});
		startButton.on("pointerup", () => {
			if (startButton.isDown) {
				this.scene.start("MainScene");
				this.scene.get("HUD").gameStarted();
			}
		});
	}
}

// Returns a 2D mask of size [size × size] that represents a circle
const generateWorldMask = (size) => {
	const radius = size / 2 - 1;
	const center = (size - 1) / 2;
	const result = [];
	for (let i = 0; i < size + 1; i++) {
		result[i] = [];
		for (let j = 0; j < size + 1; j++) {
			const distance = (j - center) * (j - center) + (i - center) * (i - center);
			result[i][j] = distance < radius * radius ? 1 : 0;
		}
	}
	return result;
};

class MainScene extends Phaser.Scene {
	constructor() {
		super("MainScene");
	}

	create() {
		this.sound.play("music", {loop: true});

		const groundLayerData = [];
		const mask = this.worldMask = generateWorldMask(conf.worldSize);
		for (let y = 0; y < conf.worldHeight; y++) {
			groundLayerData[y] = [];
			for (let x = 0; x < conf.worldWidth; x++) {
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
					tile = pick([0, 1, 13, 14]);
				}
				groundLayerData[y][x] = tile;
			}
		}
		const groundTilemap = this.make.tilemap({
			data: groundLayerData,
			tileWidth: conf.tileSize,
			tileHeight: conf.tileSize,
			width: conf.worldWidth,
			height: conf.worldHeight,
		});
		this.groundTilemap = groundTilemap;
		const groundTileset = groundTilemap.addTilesetImage("tileset", "Tiles");
		const groundLayer = groundTilemap.createLayer(0, groundTileset);

		groundLayer.x = -groundLayer.width / 2;
		groundLayer.y = -groundLayer.height / 2;




		const grassLayerData = [];
		for (let y = 0; y < conf.worldHeight; y++) {
			grassLayerData[y] = [];
			for (let x = 0; x < conf.worldWidth; x++) {
				grassLayerData[y][x] = 70;
			}
		}
		this.grassMask = [];
		for (let y = 0; y < conf.worldHeight + 1; y++) {
			this.grassMask[y] = [];
			for (let x = 0; x < conf.worldWidth + 1; x++) {
				this.grassMask[y][x] = 0;
			}
		}
		const grassTilemap = this.make.tilemap({
			data: grassLayerData,
			tileWidth: conf.tileSize,
			tileHeight: conf.tileSize,
			width: conf.worldWidth,
			height: conf.worldHeight,
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
		for (let y = 0; y < conf.worldHeight; y++) {
			stuffLayerData[y] = [];
			for (let x = 0; x < conf.worldWidth; x++) {
				if (mask[y][x] && mask[y + 1][x] && mask[y + 1][x + 1] && mask[y][x + 1]) {
					const stuff = pick(stuffToPickFrom);
					stuffLayerData[y][x] = stuff;
					if (deadTrees.includes(stuff))
						this.treePositions.push({x, y});
				} else {
					stuffLayerData[y][x] = 40;
				}
			}
		}
		const stuffTilemap = this.make.tilemap({
			data: stuffLayerData,
			tileWidth: conf.tileSize,
			tileHeight: conf.tileSize,
			width: conf.worldWidth,
			height: conf.worldHeight,
		});
		this.stuffTilemap = stuffTilemap;
		const stuffTileset = stuffTilemap.addTilesetImage("tileset", "Tiles");
		const stuffLayer = stuffTilemap.createLayer(0, stuffTileset);

		stuffLayer.x = -stuffLayer.width / 2;
		stuffLayer.y = -stuffLayer.height / 2;

		this.cracks = [];

		this.lastEarthquake = 0;

		this.introGuide = this.add.sprite(0, -4 * conf.tileSize, "Characters", 0);

		this.input.keyboard.on('keydown-SPACE', (event) => this.interaction(event));
		this.input.keyboard.on('keyup-SPACE', (event) => this.fireEnd(event));

		this.player = new Player(this);

		this.introGuideBubble = this.add.sprite(this.introGuide.x + conf.bubbleOffset.dx, this.introGuide.y + conf.bubbleOffset.dy);
		this.introGuideBubble.isBubbling = false;

		this.cameras.main.centerOn(0, 0);
		this.cameras.main.startFollow(this.player.sprite);

		this.waterLevel = 50;
		this.waterCapacity = 5;

		this.level = 0;

		this.droplets = [];

		this.crackPointIndicator = this.add.sprite(0, 0, "CrackPoints", 0).setVisible(false);

		// Background

		const backgroundLayerData = [];
		for (let y = 0; y < conf.viewportHeight; y++) {
			backgroundLayerData[y] = [];
			for (let x = 0; x < conf.viewportWidth; x++) {
				backgroundLayerData[y][x] = pick([...new Array(15).fill(0), 1, 2, 3, 4, 5, 6, 7, 8]);
			}
		}
		const backgroundTilemap = this.make.tilemap({
			data: backgroundLayerData,
			tileWidth: conf.tileSize,
			tileHeight: conf.tileSize,
			width: conf.worldWidth,
			height: conf.worldHeight,
		});
		const backgroundTileset = backgroundTilemap.addTilesetImage("tileset", "SpaceTiles");
		const backgroundLayer = backgroundTilemap.createLayer(0, backgroundTileset);

		backgroundLayer.x = 1000;
		backgroundLayer.y = 1000;

		this.cameras.add(0, 0, undefined, undefined, false, "Background").setScroll(1000, 1000);
		this.cameras.cameras.reverse();
	}

	winGame() {
		this.scene.stop("DialogScene");
		this.scene.start("GameWon");
	}

	loseGame() {
		this.scene.stop("DialogScene");
		this.scene.start("GameLost");
	}

	makeStuffTileAlive(tile) {
		const liveTrees = [2, 3, 4, 5, 6, 7, 8, 33, 34, 59];
		const deadTrees = liveTrees.map(x => x + 13);
		if (deadTrees.includes(tile))
			return (tile - 13);
		else
			return tile;
	}

	turnGroundToGrass(tile) {
		const row = Math.floor(tile / 13);
		const col = tile - row * 13;
		if (row <= 1)
			return tile + 67;
		if (col <= 2)
			return tile + 36;
		return tile + 44;
	}

	updateForGrass() {
		const m = this.grassMask;
		for (let y = 0; y < conf.worldHeight; y++) {
			for (let x = 0; x < conf.worldWidth; x++) {
				let maskNW = this.grassMask[y][x] * this.worldMask[y][x];
				let maskNE = this.grassMask[y][x + 1] * this.worldMask[y][x + 1];
				let maskSE = this.grassMask[y + 1][x + 1] * this.worldMask[y + 1][x + 1];
				let maskSW = this.grassMask[y + 1][x] * this.worldMask[y + 1][x];
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
		const m = this.grassMask;
		for (let y = 1; y < conf.worldHeight - 1; y++) {
			for (let x = 1; x < conf.worldWidth - 1; x++) {
				if (m[y][x] == 0 && (m[y][x + 1] == 1 || m[y][x - 1] == 1 || m[y - 1][x] == 1 || m[y + 1][x] == 1)) {
					if (Math.random() < this.extendProbability)
						m[y][x] = 2;
				}
			}
		}

		const distanceSquared = ({x: x1, y: y1}, {x: x2, y: y2}) => (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);

		const hasCrack = (x, y) => (
			this.cracks.some(crack => (
				crack.crackPoints.some(crackPoint => (
					distanceSquared(crackPoint, {x: x - conf.worldWidth / 2, y: conf.worldHeight / 2 - y}) < 3
				))
			))
		);

		for (let y = 0; y < conf.worldHeight; y++) {
			for (let x = 0; x < conf.worldWidth; x++) {
				if (m[y][x] == 2)
					m[y][x] = hasCrack(x, y) ? 0 : 1;
			}
		}

		this.updateForGrass();
	}

	updateInventory() {
		if (!this.scene.isActive("InventoryScene"))
			this.scene.run("InventoryScene");
		this.scene.get("InventoryScene").updateInventory(this.waterCapacity, this.waterLevel);
	}

	getCloseCrackPoint() {
		const healPoints = [];
		this.cracks.forEach(crack => {
			crack.crackPoints.forEach(crackPoint => {
				const distance = crack.distanceToPlayer({x: crackPoint.x * conf.tileSize, y: -crackPoint.y * conf.tileSize});
				if (distance < 2 * conf.tileSize)
					healPoints.push({crack, crackPoint, distance});
			});
		});
		if (this.treesEnabled) {
			this.treePositions.forEach(tree => {
				const {x, y} = tree;
				const newX = (x + 0.5 - conf.worldWidth / 2);
				const newY = (y + 0.5 - conf.worldWidth / 2);
				const dx = Math.abs(newX * conf.tileSize - this.player.x);
				const dy = Math.abs(newY * conf.tileSize - this.player.y);
				const distance = dx + dy;
				if (distance < 2 * conf.tileSize && (this.grassMask[y + 1][x] == 0 || this.grassMask[y + 1][x + 1] == 0))
					healPoints.push({tree, crackPoint: {x: newX, y: -newY}, distance});
			});
		}
		return healPoints.sort((a, b) => a.distance - b.distance)[0];
	}

	interaction() {
		if (Phaser.Math.Distance.BetweenPoints(this.player.sprite, this.introGuide) < conf.tileSize) {
			this.talkToIntroGuide();
			return;
		}

		if (this.waterLevel == 0)
			return; // No water

		const healPoint = this.getCloseCrackPoint();
		if (healPoint) {
			this.pointBeingHealed = healPoint;
			this.player.fireStart(this.pointBeingHealed.crackPoint);
			const x = this.pointBeingHealed.crackPoint.x * conf.tileSize;
			const y = -this.pointBeingHealed.crackPoint.y * conf.tileSize;
			this.crackPointSprite = this.add.sprite(x, y, "CrackPoints", 18).setDepth(43);
			this.crackPointSprite.play(healPoint.tree ? "CrackPointTree" : "CrackPoint");
		}
	}

	heal() {
		this.waterLevel--;
		if (this.pointBeingHealed.tree) {
			const {x, y} = this.pointBeingHealed.tree;
			this.grassMask[y + 1][x] = 1;
			this.grassMask[y + 1][x + 1] = 1;
			this.updateForGrass();
		} else {
			const {crack, crackPoint} = this.pointBeingHealed;
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

	initLevel(level) {
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
		} = conf.levels[level];

		for (let i = 0; i < numberOfCracks; i++) {
			let x, y, tries = 0;
			do {
				x = Math.floor((Math.random() - 0.5) * conf.viewportWidth);
				y = Math.floor((Math.random() - 0.5) * conf.viewportHeight);
				tries++;
			} while (!this.isValidPosition(x, -y, true) && tries < 100)
			this.cracks.push(new Crack({scene: this, x, y}));
		}

		this.crackDelay = crackDelay;
		this.timeLeft = random(crackDelay) * 1000;

		this.crackMaxLength = crackMaxLength;

		this.dropsDelay = dropsDelay;
		this.dropTimeLeft = random(dropsDelay) * 1000;

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
			line.every((point, x) => (
				this.grassMask[y][x] >= this.worldMask[y][x]
			))
		));
		const isLevelOver = onlyGreen || (this.cracks.length == 0 && !this.allowNewCracks);
		if (isLevelOver)
			this.level++;
		const levelDialogs = dialogs.levels[this.level];
		const dialog = isLevelOver ? levelDialogs.start : levelDialogs.loop;

		this.scene.run("DialogScene", dialog);
	}

	isValidPosition(x, y, crackToIgnore) {
		{
			let maskX = Math.round(x + (conf.worldSize - 1) / 2);
			let maskY = Math.round(y + (conf.worldSize - 1) / 2);
			if (!this.worldMask[maskX]?.[maskY] || !this.worldMask[maskX + 1]?.[maskY] || !this.worldMask[maskX]?.[maskY + 1] || !this.worldMask[maskX + 1]?.[maskY + 1])
				return false;
		}

		for (let i = 0; i < this.cracks.length; i++) {
			if (this.cracks[i] === crackToIgnore)
				continue;
			const crackPoints = this.cracks[i].crackPoints;
			const circle = new Phaser.Geom.Circle(x * conf.tileSize, y * conf.tileSize, conf.crackHitboxSize);
			for (let j = 0; j < crackPoints.length - 1; j++) {
				const line = new Phaser.Geom.Line(
					crackPoints[j].x * conf.tileSize,
					crackPoints[j].y * -conf.tileSize,
					crackPoints[j + 1].x * conf.tileSize,
					crackPoints[j + 1].y * -conf.tileSize,
				);
				if (Phaser.Geom.Intersects.LineToCircle(line, circle))
					return false;
			}
			if (crackPoints.length == 1 && Phaser.Geom.Circle.Contains(circle, crackPoints[0].x * conf.tileSize, crackPoints[0].y * -conf.tileSize))
				return false;
		}

		if (Phaser.Math.Distance.Between(x * conf.tileSize, y * conf.tileSize, this.introGuide.x, this.introGuide.y) <= conf.introGuideHitboxSize)
			return false;

		const isGrassForbidden = !!crackToIgnore;
		if (isGrassForbidden) {
			let maskX = Math.round(x + (conf.worldSize - 1) / 2);
			let maskY = Math.round(y + 0.5 + (conf.worldSize - 1) / 2);
			if (this.grassMask[maskY]?.[maskX])
				return false;
		}

		return true;
	}

	fixPlayerPosition(iterations = 0) {
		if (iterations === 100)
			this.player.sprite.x = this.player.sprite.y = 0;

		if (!this.isValidPosition(this.player.x / conf.tileSize, this.player.y / conf.tileSize)) {
			this.player.sprite.x += Math.random() * conf.tileSize;
			this.player.sprite.y += Math.random() * conf.tileSize;
			this.fireEnd();
			this.fixPlayerPosition(iterations + 1);
		}
	}

	update(time, delta) {
		if (Phaser.Math.Distance.BetweenPoints(this.player.sprite, this.introGuide) < conf.tileSize) {
			if (!this.introGuideBubble.isBubbling) {
				this.introGuideBubble.isBubbling = true;
				this.introGuideBubble.play("BubbleStart");
				this.introGuideBubble.playAfterDelay("BubbleLoop");
			}
		} else {
			if (this.introGuideBubble.isBubbling) {
				this.introGuideBubble.play("BubbleEnd");
				this.introGuideBubble.isBubbling = false;
			}
		}

		const healPoint = this.getCloseCrackPoint();
		if (healPoint && !this.player.isFiring) {
			this.crackPointIndicator.x = healPoint.crackPoint.x * conf.tileSize;
			this.crackPointIndicator.y = -healPoint.crackPoint.y * conf.tileSize;
			this.crackPointIndicator.setVisible(true);
			this.crackPointIndicator.setFrame(healPoint.tree ? 26 : 0);
		} else {
			this.crackPointIndicator.setVisible(false);
		}

		if (!this.scene.isActive("DialogScene"))
			this.player.update(time, delta);

		this.cracks.forEach(c => c.update(time, delta));

		if (this.waterLevel < this.waterCapacity) {
			this.droplets.forEach(droplet => {
				if (Phaser.Math.Distance.BetweenPoints(this.player.sprite, droplet) < conf.dropletHitboxSize) {
					this.droplets = this.droplets.filter(d => d !== droplet);
					droplet.destroy();
					this.waterLevel++;
					this.updateInventory();
					this.sound.play("Droplet");
				}
			});
		}

		this.timeLeft -= delta;
		this.dropTimeLeft -= delta;
		this.extendTimeLeft -= delta;

		if (this.timeLeft < 0) {
			this.timeLeft = random(this.crackDelay) * 1000;
			const crack = pick(this.allowNewCracks ? [null, ...this.cracks] : this.cracks);
			let shouldShake;
			if (crack) {
				if (crack.crackPoints.length < this.crackMaxLength) {
					shouldShake = crack.extend();
				}
			} else if (this.allowNewCracks) {
				let x, y, tries = 0;
				do {
					x = Math.floor((Math.random() - 0.5) * conf.viewportWidth);
					y = Math.floor((Math.random() - 0.5) * conf.viewportHeight);
					tries++;
				} while (!this.isValidPosition(x, -y, true) && tries < 100)
				if (tries < 100)
					this.cracks.push(new Crack({scene: this, x, y}));
			}
			if (shouldShake) {
				this.cameras.main.shake(200, 0.008);
				this.sound.play("Crack");
			}

			this.fixPlayerPosition();
		}

		if (this.dropTimeLeft < 0) {
			this.dropTimeLeft = random(this.dropsDelay) * 1000;

			if (this.droplets.length < this.waterCapacity) {
				let x, y;
				do {
					x = Math.floor((Math.random() - 0.5) * conf.worldSize * conf.tileSize);
					y = Math.floor((Math.random() - 0.5) * conf.worldSize * conf.tileSize);
				} while (!this.isValidPosition(x / conf.tileSize, -y / conf.tileSize))
				const newDrop = this.add.image(x, y - conf.tileSize, "WaterDroplet");
				newDrop.appearingTime = time;
				this.droplets.push(newDrop);
			}
		}

		this.droplets.forEach(droplet => {
			if (time > droplet.appearingTime + conf.dropletTimeout * 1000) {
				droplet.destroy();
				this.droplets = this.droplets.filter(d => d !== droplet);
			}
		});

		if (this.extendTimeLeft < 0) {
			this.extendTimeLeft = random(this.extendDelay) * 1000;
			this.extendGrass();
		}
	}
}

class InventoryScene extends Phaser.Scene {
	constructor() {
		super("InventoryScene");
		this.inventorySprites = [];
	}

	updateInventory(capacity, level) {
		this.inventorySprites.forEach(s => s.destroy());
		this.inventorySprites = [];

		let x = conf.inventory.x;
		const y = conf.inventory.y;
		for (let i = 0; i < capacity; i++) {
			this.add.image(x, y, "Water_Inventory");
			if (level > i)
				this.add.image(x, y, "Water_Bullet");
			x += conf.inventory.dx;
		}
	}
}

class DialogScene extends Phaser.Scene {
	constructor() {
		super("DialogScene");
		this.lines = [];
	}

	init(dialog) {
		this.dialog = dialog;
		this.currentIndex = 0;
	}

	create() {
		this.add.image(conf.dialogBg.x, conf.dialogBg.y, "DialogBackground");
		this.avatar = this.add.sprite(conf.avatar.x, conf.avatar.y, "").setScale(conf.avatar.scale);

		this.refresh();

		this.input.keyboard.on('keydown-SPACE', () => this.nextDialog());
	}

	nextDialog() {
		this.currentIndex++;
		if (this.currentIndex == this.dialog.length) {
			this.scene.stop();
		} else {
			this.refresh();
		}
	}

	refresh() {
		this.lines.forEach(line => line.destroy());
		const cfg = conf.dialogText;

		const currentDialog = this.dialog[this.currentIndex];
		switch (currentDialog.type) {
			case "you":
			case "them":
				this.avatar.setTexture(currentDialog.type == "you" ? "Player" : "Characters");
				this.lines = currentDialog.text.map((text, i) => (
					new TextLine(this, cfg.x, cfg.y + cfg.dy * i, text)
				));
				break;
			case "callback":
				const mainScene = this.scene.get("MainScene");
				currentDialog.callback(mainScene);
				break;
		}
	}
}

class GameWon extends Phaser.Scene {
	constructor() {
		super("GameWon");
	}

	create() {
		// this.cameras.main.fadeFrom(200, 255, 255, 255);

		this.add.sprite(0, 0, "GameWon", 1).setOrigin(0, 0).play("GameWon");
	}
}

class GameLost extends Phaser.Scene {
	constructor() {
		super("GameLost");
	}

	create() {
		// this.cameras.main.fadeFrom(200, 255, 255, 255);

		this.add.sprite(0, 0).setOrigin(0, 0).play("GameLost");
	}
}

const healAt = (scene, crack, crackPoint) => {
	const crackPoints = [...crack.crackPoints];
	const index = crackPoints.indexOf(crackPoint);

	if (crackPoint.size > 1) {
		crackPoint.size--;
		return [new Crack({scene, crackPoints})];
	} else if (crackPoints.length == 1) {
		return [];
	} else if (index == 0) {
		return [new Crack({scene, crackPoints: crackPoints.slice(1)})];
	} else if (index == crackPoints.length - 1) {
		return [new Crack({scene, crackPoints: crackPoints.slice(0, index)})];
	} else {
		return [
			new Crack({scene, crackPoints: crackPoints.slice(0, index)}),
			new Crack({scene, crackPoints: crackPoints.slice(index + 1)}),
		];
	}
};

const charsInFont = "ABCDEFGHIJKLMNOPQRSTUVWXYZ.:,;°×!?' ";
class TextLine {
	constructor(scene, x, y, text) {
		this.scene = scene;
		this.letters = [];
		let currentX = x;
		[...text].forEach(letter => {
			const frame = charsInFont.indexOf(letter.toUpperCase());
			if (frame < 0) {
				// Unknown character
				currentX += 6;
			} else {
				this.letters.push(scene.add.image(currentX, y, "Font", frame));
				currentX += 8;
			}
		});
	}

	destroy() {
		this.letters.forEach(letter => letter.destroy());
	}
}

const laserOffset = {
	"N": {dx: 2, dy: -17},
	"NE": {dx: 12, dy: -14},
	"E": {dx: 24, dy: 1},
	"SE": {dx: 22, dy: 16},
	"S": {dx: -6, dy: 21},
	"SW": {dx: -22, dy: 16},
	"W": {dx: -23, dy: 1},
	"NW": {dx: -16, dy: -18},
};

class Player {
	constructor(scene) {
		this.scene = scene;
		this.laser = scene.add.sprite(0, 0).setDepth(41);
		this.sprite = scene.add.sprite(0, 0, "Player", 0).setDepth(42);

		this.cursorKeys = scene.input.keyboard.createCursorKeys();
		this.direction = "N";
		this.isWalking = false;

		this.firingAmount = 0;
	}

	get x() {return this.sprite.x;}
	get y() {return this.sprite.y;}

	fireStart(pointBeingHealed) {
		// Pick direction
		const dx = pointBeingHealed.x * conf.tileSize - this.x;
		const dy = - pointBeingHealed.y * conf.tileSize - this.y;
		const angle = (Math.atan2(dy, dx) + Math.PI) * 180 / Math.PI;
		const directionIndex = Math.round(angle / 45);

		this.direction = ["W", "NW", "N", "NE", "E", "SE", "S", "SW", "W"][directionIndex];

		this.sprite.setFrame(firingFrame[this.direction]);
		this.laser.play("Laser" + this.direction);
		this.laser.x = this.sprite.x + laserOffset[this.direction].dx;
		this.laser.y = this.sprite.y + laserOffset[this.direction].dy;
		this.isFiring = true;
		this.sprite.stop();
		this.scene.sound.play("Water", {loop: true});
	}

	fireEnd() {
		this.laser.stop();
		this.laser.setFrame(12);
		this.isFiring = false;
		this.sprite.setFrame(idleFrame[this.direction]);
		this.firingAmount = 0;
		this.scene.sound.stopByKey("Water");
	}

	update(time, delta) {
		if (this.isFiring) {
			this.firingAmount += delta;
			if (this.firingAmount > conf.crackResistance * 1000) {
				this.scene.heal();
				this.firingAmount = 0;
				this.fireEnd();
			}
			return;
		}

		const up    = this.cursorKeys.up.isDown;
		const down  = this.cursorKeys.down.isDown;
		const left  = this.cursorKeys.left.isDown;
		const right = this.cursorKeys.right.isDown;
		// let deltaPos = conf.tileSize * conf.speed * delta / 1000;
		// if ((up || down) && (left || right))
		// 	deltaPos /= Math.sqrt(2);
		// deltaPos = Math.ceil(deltaPos);
		let deltaPos = 3;
		if ((up || down) && (left || right))
			deltaPos = 2;

		let direction = "";
		let x = this.sprite.x;
		let y = this.sprite.y;
		if (down) {
			y += deltaPos;
			direction = "S";
		} else if (up) {
			y -= deltaPos;
			direction = "N";
		}

		if (right) {
			x += deltaPos;
			direction += "E";
		} else if (left) {
			x -= deltaPos;
			direction += "W";
		}

		if (this.scene.isValidPosition(x / conf.tileSize, y / conf.tileSize)) {
			this.sprite.x = x;
			this.sprite.y = y;
		} else {
			direction = null;
		}

		if (direction) {
			if (!this.isWalking || direction !== this.direction) {
				this.isWalking = true;
				this.sprite.play("PlayerWalk" + direction);
			}
			this.direction = direction;
		} else {
			this.isWalking = false;
			this.sprite.stop();
		}
	}
}

const rotateDirection = (direction, rotation) => {
	if (![0, 1, 2, 3].includes(rotation))
		throw new Error("invalid rotation");
	if (rotation === 0)
		return direction;
	if (rotation > 1)
		return rotateDirection(rotateDirection(direction, 1), rotation - 1);
	// Rotation == 1
	return {
		"": "",
		"Right": "Down",
		"Down": "Left",
		"Left": "Up",
		"Up": "Right",
	}[direction];
};

const rotateDxDy = ({dx, dy}, rotation) => {
	if (![0, 1, 2, 3].includes(rotation))
		throw new Error("invalid rotation");
	return [
		{dx, dy},
		{dx: dy, dy: -dx},
		{dx: -dx, dy: -dy},
		{dx: -dy, dy: dx},
	][rotation];
};

const flipXDirection = (direction) => {
	return {
		"": "",
		"Right": "Left",
		"Left": "Right",
		"Up": "Up",
		"Down": "Down",
	}[direction];
};

const reverseDirection = (direction) => {
	return {
		"": "",
		"Right": "Left",
		"Left": "Right",
		"Up": "Down",
		"Down": "Up",
	}[direction];
};

const initialCrackTilesData = [
	{tile: 0, dx: 0, dy: 0, from: "", to: "Right", toSize: 1, pivotX: -1, pivotY: 0.5},
	{tile: 1, dx: 2, dy: 1, from: "Right", fromSize: 1, to: "Right", toSize: 1, pivotX: 1, pivotY: 0.5},
	{tile: 2, dx: 2, dy: -1, from: "Right", fromSize: 1, to: "Right", toSize: 2, pivotX: 1, pivotY: -0.5},
	{tile: 3, dx: 2, dy: 1, from: "Right", fromSize: 2, to: "Right", toSize: 2, pivotX: 1, pivotY: 0.5},
	{tile: 4, dx: 2, dy: -1, from: "Right", fromSize: 2, to: "Right", toSize: 3, pivotX: 1, pivotY: -0.5},
	{tile: 5, dx: 2, dy: 1, from: "Right", fromSize: 3, to: "Right", toSize: 3, pivotX: 1, pivotY: 0.5},

	{tile: 6,  dx: 0, dy: 0, from: "", to: "Right", toSize: 1, pivotX: -1, pivotY: 0.5},
	{tile: 7,  dx: 2, dy: -1, from: "Right", fromSize: 1, to: "Right", toSize: 1, pivotX: 1, pivotY: -0.5},
	{tile: 8,  dx: 2, dy: 1, from: "Right", fromSize: 1, to: "Right", toSize: 2, pivotX: 1, pivotY: 0.5},
	{tile: 9,  dx: 2, dy: -1, from: "Right", fromSize: 2, to: "Right", toSize: 2, pivotX: 1, pivotY: -0.5},
	{tile: 10, dx: 2, dy: 1, from: "Right", fromSize: 2, to: "Right", toSize: 3, pivotX: 1, pivotY: 0.5},
	{tile: 11, dx: 2, dy: -1, from: "Right", fromSize: 3, to: "Right", toSize: 3, pivotX: 1, pivotY: -0.5},

	{tile: 12, dx: 0, dy: 0, from: "", to: "Right", toSize: 2, pivotX: -1, pivotY: 0.5},
	{tile: 13, dx: 0, dy: 0, from: "", to: "Right", toSize: 3, pivotX: -1, pivotY: 0.5},
	{tile: 14, dx: 2, dy: 1, from: "Right", fromSize: 1, to: "Right", toSize: 3, pivotX: 1, pivotY: 0.5},

	{tile: 15, dx: 0, dy: 0, from: "", to: "Right", toSize: 2, pivotX: -1, pivotY: -0.5},
	{tile: 16, dx: 0, dy: 0, from: "", to: "Right", toSize: 3, pivotX: -1, pivotY: -0.5},
	{tile: 17, dx: 2, dy: -1, from: "Right", fromSize: 1, to: "Right", toSize: 3, pivotX: 1, pivotY: -0.5},
];

// Flip horizontally and reverse the direction
const intermediateCrackTilesData = [];
initialCrackTilesData.forEach(({tile, dx, dy, from, fromSize, to, toSize, pivotX, pivotY}) => {
	intermediateCrackTilesData.push({tile, dx, dy, from, fromSize, to, toSize, pivotX, pivotY});
	intermediateCrackTilesData.push({
		tile,
		dx, dy: -dy,
		from: reverseDirection(flipXDirection(to)), fromSize: toSize,
		to: reverseDirection(flipXDirection(from)), toSize: fromSize,
		pivotX: dx - pivotX,
		pivotY: pivotY - dy,
		flipX: true
	});
});

// Rotate
const finalCrackTilesData = [];
intermediateCrackTilesData.forEach(({tile, dx, dy, from, fromSize, to, toSize, pivotX, pivotY, flipX}) => {
	[0, 3].forEach(rotation => {
		const {dx: newDx, dy: newDy} = rotateDxDy({dx, dy}, rotation);
		const {dx: newPivotX, dy: newPivotY} = rotateDxDy({dx: pivotX, dy: pivotY}, rotation);
		finalCrackTilesData.push({
			tile,
			dx: newDx, dy: newDy,
			from: rotateDirection(from, rotation), fromSize,
			to: rotateDirection(to, rotation), toSize,
			pivotX: newPivotX, pivotY: newPivotY,
			flipX,
			rotation,
		});
	});
});

const pick = (array) => (
	array[Math.floor(Math.random() * array.length)]
);

// const pickWeighted = (array) => {
// 	const cumulative
// 	return array[Math.floor(Math.random() * array.length)];
// };

const random = (value) => {
	if (typeof value == "number")
		return value;
	else
		return (value.min + Math.random() * (value.max - value.min));
}

class Crack {
	constructor({scene, crackPoints, x, y}) {
		this.scene = scene;
		this.crackPoints = crackPoints || this.generateRandomCrack(1, {x, y});
		this.crackSegments = [];
		this.regenerateAll();
	}

	destroy() {
		this.crackSegments.forEach(s => s.destroy());
	}

	regenerateAll() {
		this.crackSegmentData = this.generateCrackSegmentData(this.crackPoints);

		this.crackSegments.forEach(s => s.destroy());
		this.crackSegments = this.generateCrackSegments(this.crackSegmentData);
	}

	extend() {
		const canBeWidened = (crackPoint, i, array) => (
			i > 0 && i < array.length - 1 && crackPoint.size <= array[i - 1].size && crackPoint.size <= array[i + 1].size && crackPoint.size <= 2
		);

		const pointsToWiden = this.crackPoints.filter(canBeWidened);
		if (pointsToWiden.length > 0 && Math.random() < conf.widenProbability) {
			const pointToWiden = pick(pointsToWiden);
			if (pointToWiden == this.scene.pointBeingHealed?.crackPoint)
				return false;
			pointToWiden.size++;
		} else if (Math.random() < 0.5) {
			const lastPoint = this.crackPoints[this.crackPoints.length - 1];
			if (lastPoint == this.pointBeingHealed)
				return false;
			const tile = pick(finalCrackTilesData.filter(data => data.from == lastPoint.direction && data.toSize == 1));
			const x = lastPoint.x + tile.dx;
			const y = lastPoint.y + tile.dy;
			if ([0.25, 0.5, 0.75, 1].every(k => this.scene.isValidPosition(lastPoint.x + tile.dx * k, -(lastPoint.y + tile.dy * k), this))) {
				this.crackPoints.push({
					x,
					y,
					direction: tile.to,
					size: 1,
				});
			} else return false;
		} else {
			const firstPoint = this.crackPoints[0];
			if (firstPoint == this.pointBeingHealed)
				return false;
			const tile = pick(finalCrackTilesData.filter(data => data.fromSize == 1 && data.to == firstPoint.direction));
			const x = firstPoint.x - tile.dx;
			const y = firstPoint.y - tile.dy;
			if ([0.25, 0.5, 0.75, 1].every(k => this.scene.isValidPosition(firstPoint.x - tile.dx * k, -(firstPoint.y - tile.dy * k), this)))  {
				this.crackPoints.unshift({
					x,
					y,
					direction: tile.from,
					size: 1,
				});
			} else return false;
		}
		this.regenerateAll();
		return true;
	}

	generateRandomCrack(length, {x: initialX, y: initialY}) {
		const result = [];
		let direction = "";
		let x = initialX;
		let y = initialY;

		for (let i = 0; i < length; i++) {
			const tile = pick(finalCrackTilesData.filter(data => data.from == direction && data.to !== ""));
			x += tile.dx;
			y += tile.dy;
			direction = tile.to;
			result.push({x, y, direction, size: 1});
		}

		return result;
	}

	generateCrackSegmentData(crackPoints) {
		const result = [];

		const pick = array => array[0];

		const firstTile = pick(finalCrackTilesData.filter(data => data.from == "" && data.to == crackPoints[0].direction && data.toSize == crackPoints[0].size));
		result.push({
			x: crackPoints[0].x + firstTile.pivotX,
			y: crackPoints[0].y + firstTile.pivotY,
			tile: firstTile.tile,
			flipX: firstTile.flipX,
			rotation: firstTile.rotation,
		});

		crackPoints.forEach((crackPoint, index) => {
			if (index == 0) return;

			const previousCrackPoint = crackPoints[index - 1];
			const dx = crackPoint.x - previousCrackPoint.x;
			const dy = crackPoint.y - previousCrackPoint.y;
			const from = previousCrackPoint.direction;
			const fromSize = previousCrackPoint.size;
			const to = crackPoint.direction;
			const toSize = crackPoint.size;
			const tileData = pick(finalCrackTilesData.filter(data => (
				Math.abs(data.dx - dx) < 0.1 && Math.abs(data.dy - dy) < 0.1
					&& data.from == from && data.fromSize == fromSize
					&& data.to == to && data.toSize == toSize
			)));
			result.push({
				x: previousCrackPoint.x + tileData.pivotX,
				y: previousCrackPoint.y + tileData.pivotY,
				tile: tileData.tile,
				flipX: tileData.flipX,
				rotation: tileData.rotation,
			});
		});

		const lastPoint = crackPoints[crackPoints.length - 1];
		const lastTile = pick(finalCrackTilesData.filter(data => data.from == lastPoint.direction && data.fromSize == lastPoint.size && data.to == ""));
		result.push({
			x: lastPoint.x + lastTile.pivotX,
			y: lastPoint.y + lastTile.pivotY,
			tile: lastTile.tile,
			flipX: lastTile.flipX,
			rotation: lastTile.rotation,
		});

		return result;
	}

	generateCrackSegments(crackSegmentData) {
		const result = [];
		crackSegmentData.forEach(({x, y, tile, flipX = false, flipY = false, rotation = 0}) => {
			const segment = this.scene.add.sprite(
				x * conf.tileSize,
				-y * conf.tileSize,
				"CracksTiles",
				tile,
			).setFlipX(flipX).setAngle(rotation * 90);
			result.push(segment);
		});
		return result;
	}

	distanceToPlayer({x, y}) {
		const dx = Math.abs(x - this.scene.player.x);
		const dy = Math.abs(y - this.scene.player.y);
		return (dx + dy);
	}

	isCloseToPlayer({x, y}) {
		const dx = Math.abs(x - this.scene.player.x);
		const dy = Math.abs(y - this.scene.player.y);
		return (dx + dy < 2 * conf.tileSize);
	}

	update(time, delta) {
		this.crackSegments.forEach(cs => cs.update(time, delta));
	}
}

class HUD extends Phaser.Scene {
	constructor() {
		super({key: "HUD", active: true});
		this.suffix = "";
	}

	gameStarted() {
		this.suffix = "_Small";
		this.button.setTexture(this.button.texture.key + this.suffix);
		this.button.x = conf.smallSoundButton.x;
		this.button.y = conf.smallSoundButton.y;
	}

	preload() {
		this.load.setPath("assets/UI");
		this.load.image(["Btn_Sound_ON", "Btn_Sound_OFF"]);
		this.load.image(["Btn_Sound_ON_Small", "Btn_Sound_OFF_Small"]);
	}

	create() {
		this.sound.mute = false;

		const button = this.button = this.add.image(conf.soundButton.x, conf.soundButton.y, "Btn_Sound_ON");
		window.btn = button;

		button.setInteractive();
		button.on("pointerdown", () => {
			this.sound.mute = !this.sound.mute;
			button.setTexture("Btn_Sound_" + (this.sound.mute ? "ON" : "OFF") + this.suffix);
		});
	}
}
