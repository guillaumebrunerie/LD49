class StartScene extends Phaser.Scene {
	constructor() {
		super("StartScene");
	}

	loadPNGSequence(name, duration) {
		for (const i = 0; i < duration; i++) {
			const istr = ("000" + i).substr(-3);
			const key = name + "_" + istr;
			this.load.image(key);
		}
	}

	preload() {
		const tileConf = {frameWidth: conf.tileSize, frameHeight: conf.tileSize};

		this.load.setPath("assets");
		this.load.image("StartScreen", "StartScreen.jpg");
		this.load.image("StartButton", "StartButton.jpg");

		this.load.image("DialogBackground");

		this.load.spritesheet("Tiles", "SpriteSheets/BgElements.png", tileConf);

		this.load.spritesheet("CracksTiles", "SpriteSheets/Cracks.png", {frameWidth: conf.crackTileSize, frameHeight: conf.crackTileSize});
		this.load.image("CrackPoint");
		this.load.image("CrackPointActive");

		this.load.spritesheet("Player", "SpriteSheets/Hero.png", tileConf);
		this.load.spritesheet("Characters", "SpriteSheets/Characters.png", tileConf);
		this.load.spritesheet("Bubble", "SpriteSheets/SpeechBubble.png", tileConf);
		this.load.spritesheet("Laser", "SpriteSheets/Laser.png", tileConf);

		this.load.spritesheet("Font", "Font.png", {frameWidth: 8, frameHeight: 8});
	}

	create() {
		this.add.image(0, 0, "StartScreen").setOrigin(0, 0);

		this.anims.create({
			key: "BubbleStart",
			frameRate: 15,
			frames: this.anims.generateFrameNames("Bubble", {frames: [0, 1, 2]}),
		});

		this.anims.create({
			key: "BubbleLoop",
			frameRate: 2,
			frames: this.anims.generateFrameNames("Bubble", {frames: [3, 4, 5]}),
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

		const playerWalkAnimations = [
			["W", [13, 14, 15]],
			["E", [26, 27, 28]],
			["N", [65]],
			["S", [0, 1, 2]],
			["NW", [52]],
			["NE", [54]],
			["SW", [39]],
			["SE", [41]],
		];

		playerWalkAnimations.forEach(([suffix, frames]) => {
			this.anims.create({
				key: "PlayerWalk" + suffix,
				frameRate: 5,
				frames: this.anims.generateFrameNames("Player", {frames}),
				repeat: -1
			});
		});

		// const startButton = this.add.image(0, 0, "StartButton");
		// startButton.setInteractive();
		// startButton.on("pointerdown", () => {
		// 	this.scene.start("MainScene");
		// });

		this.scene.start("MainScene");
	}
}

class MainScene extends Phaser.Scene {
	constructor() {
		super("MainScene");
	}

	create() {
		const groundLayerData = [];
		for (let y = 0; y < conf.worldHeight; y++) {
			groundLayerData[y] = [];
			for (let x = 0; x < conf.worldWidth; x++) {
				groundLayerData[y][x] = pick([0, 1, 13, 14]);
			}
		}
		const groundTilemap = this.make.tilemap({
			data: groundLayerData,
			tileWidth: conf.tileSize,
			tileHeight: conf.tileSize,
			width: conf.worldWidth,
			height: conf.worldHeight,
		});
		const groundTileset = groundTilemap.addTilesetImage("tileset", "Tiles");
		const groundLayer = groundTilemap.createLayer(0, groundTileset);

		groundLayer.x = -groundLayer.width / 2;
		groundLayer.y = -groundLayer.height / 2;

		const stuffLayerData = [];
		for (let y = 0; y < conf.worldHeight; y++) {
			stuffLayerData[y] = [];
			for (let x = 0; x < conf.worldWidth; x++) {
				const liveTrees = [2, 3, 4];
				const deadTrees = [15, 16, 17];
				const otherStuff = [5, 6, 7, 18, 19, 20];
				const nothing = new Array(30).fill(21);
				const stuff = pick([...deadTrees, ...otherStuff, ...nothing]);
				stuffLayerData[y][x] = stuff;
			}
		}
		const stuffTilemap = this.make.tilemap({
			data: stuffLayerData,
			tileWidth: conf.tileSize,
			tileHeight: conf.tileSize,
			width: conf.worldWidth,
			height: conf.worldHeight,
		});
		const stuffTileset = stuffTilemap.addTilesetImage("tileset", "Tiles");
		const stuffLayer = stuffTilemap.createLayer(0, stuffTileset);

		stuffLayer.x = -stuffLayer.width / 2;
		stuffLayer.y = -stuffLayer.height / 2;

		this.cracks = [];
		this.createCracks(1);

		this.lastEarthquake = 0;

		this.introGuide = this.add.sprite(0, -4 * conf.tileSize, "Characters", 0);
		this.introGuideBubble = this.add.sprite(1 * conf.tileSize, -5 * conf.tileSize);
		this.introGuideBubble.isBubbling = false;

		this.input.keyboard.on('keydown-SPACE', (event) => this.interaction(event));
		this.input.keyboard.on('keyup-SPACE', (event) => this.fireEnd(event));

		this.player = new Player(this);
		this.cameras.main.centerOn(0, 0);
		this.cameras.main.startFollow(this.player.sprite);

		this.batteryLevel = 5;
		this.batteryCapacity = 5;
	}

	upgradeBattery(value) {
		this.batteryLevel = this.batteryCapacity = value;
	}

	interaction() {
		if (Phaser.Math.Distance.BetweenPoints(this.player.sprite, this.introGuide) < conf.tileSize) {
			this.talkToIntroGuide();
		}

		this.player.fireStart();

		if (this.batteryLevel == 0)
			return; // No battery

		const healPoints = [];
		this.cracks.forEach(crack => {
			crack.crackPoints.forEach(crackPoint => {
				if (crack.isCloseToPlayer({x: crackPoint.x * conf.tileSize, y: -crackPoint.y * conf.tileSize}))
					healPoints.push({crack, crackPoint});
			});
		});
		if (healPoints.length !== 0) {
			// else
			// 	this.batteryLevel--;

			const {crack, crackPoint} = pick(healPoints);
			const newCracks = healAt(this, crack, crackPoint);
			crack.destroy();
			this.cracks = this.cracks.filter(c => c !== crack);
			this.cracks.push(...newCracks);
		}
	}

	heal() {
	}

	fireEnd() {
		this.player.fireEnd();
	}

	createCracks(amount) {
		for (let i = 0; i < amount; i++) {
			this.cracks.push(new Crack({scene: this, crackExtendDelay: conf.crackExtendDelay}));
		}
		this.cameras.main.shake(500, 0.008);
	}

	talkToIntroGuide() {
		if (this.scene.isActive("DialogScene"))
			return;

		const dialog = this.hasRunIntroDialog ? (
			this.cracks.length > 0 ? dialogs.intro2 : dialogs.intro3)
			  : dialogs.intro;

		this.scene.run("DialogScene", dialog);
		this.hasRunIntroDialog = true;
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

		this.player.update(time, delta);
		this.cracks.forEach(c => {
			if (c.timeLeft < 0) {
				c.extend();
			}
			c.update(time, delta);
		});

		// this.lastEarthquake += delta;

		// if (this.lastEarthquake > conf.crackDelay * 1000) {
		// 	this.lastEarthquake -= conf.crackDelay * 1000;
		// 	const crack = pick([null, ...this.cracks]);
		// 	if (crack)
		// 		crack.extend();
		// 	else
		// 		this.cracks.push(new Crack(this));
		// }
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
		this.add.image(0, 0, "DialogBackground").setOrigin(0, 0);
		this.avatar = this.add.sprite(40, 35, "").setOrigin(0, 0).setScale(2);

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

		const currentDialog = this.dialog[this.currentIndex];
		switch (currentDialog.type) {
			case "you":
			case "them":
				this.avatar.setTexture(currentDialog.type == "you" ? "Player" : "Characters");
				this.lines = currentDialog.text.map((text, i) => (
					new TextLine(this, 100, 50 + 10 * i, text)
				));
				break;
			case "callback":
				const mainScene = this.scene.get("MainScene");
				currentDialog.callback(mainScene);
				break;
		}
	}
}

const healAt = (scene, crack, crackPoint) => {
	const crackPoints = [...crack.crackPoints];
	const crackExtendDelay = crack.crackExtendDelay;
	const index = crackPoints.indexOf(crackPoint);

	if (crackPoint.size > 1) {
		crackPoint.size--;
		return [new Crack({scene, crackPoints, crackExtendDelay})];
	} else if (crackPoints.length == 1) {
		return [];
	} else if (index == 0) {
		return [new Crack({scene, crackPoints: crackPoints.slice(1), crackExtendDelay})];
	} else if (index == crackPoints.length - 1) {
		return [new Crack({scene, crackPoints: crackPoints.slice(0, index), crackExtendDelay})];
	} else {
		return [
			new Crack({scene, crackPoints: crackPoints.slice(0, index), crackExtendDelay}),
			new Crack({scene, crackPoints: crackPoints.slice(index + 1), crackExtendDelay}),
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

const idleFrame = {
	"N": 65,
	"NE": 54,
	"E": 26,
	"SE": 41,
	"S": 0,
	"SW": 39,
	"W": 13,
	"NW": 52,
};

const firingFrame = {
	"N": 66,
	"NE": 55,
	"E": 30,
	"SE": 42,
	"S": 3,
	"SW": 40,
	"W": 17,
	"NW": 53,
};

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
		this.laser = scene.add.sprite(0, 0);
		this.sprite = scene.add.sprite(0, 0, "Player", 0);

		this.cursorKeys = scene.input.keyboard.createCursorKeys();
		this.direction = "N";
		this.isWalking = false;

		this.firingAmount = 0;
	}

	get x() {return this.sprite.x;}
	get y() {return this.sprite.y;}

	fireStart() {
		this.sprite.setFrame(firingFrame[this.direction]);
		this.laser.play("Laser" + this.direction);
		this.laser.x = this.sprite.x + laserOffset[this.direction].dx;
		this.laser.y = this.sprite.y + laserOffset[this.direction].dy;
		this.isFiring = true;
		this.sprite.stop();
	}

	fireEnd() {
		this.laser.stop();
		this.laser.setFrame(12);
		this.isFiring = false;
		this.sprite.setFrame(idleFrame[this.direction]);
		this.firingAmount = 0;
	}

	update(time, delta) {
		if (this.isFiring) {
			this.firingAmount += delta;
			if (this.firingAmount > conf.crackResistance * 1000)
				this.scene.heal();
			return;
		}

		const up    = this.cursorKeys.up.isDown;
		const down  = this.cursorKeys.down.isDown;
		const left  = this.cursorKeys.left.isDown;
		const right = this.cursorKeys.right.isDown;
		let deltaPos = conf.tileSize * conf.speed * delta / 1000;
		if ((up || down) && (left || right))
			deltaPos /= Math.sqrt(2);

		let direction = "";
		if (down) {
			this.sprite.y += deltaPos;
			direction = "S";
		} else if (up) {
			this.sprite.y -= deltaPos;
			direction = "N";
		}

		if (right) {
			this.sprite.x += deltaPos;
			direction += "E";
		} else if (left) {
			this.sprite.x -= deltaPos;
			direction += "W";
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

	{tile: 6, dx: 0, dy: 0, from: "", to: "Right", toSize: 2, pivotX: -1, pivotY: 0.5},
	{tile: 7, dx: 0, dy: 0, from: "", to: "Right", toSize: 3, pivotX: -1, pivotY: 0.5},
	{tile: 8, dx: 2, dy: 1, from: "Right", fromSize: 1, to: "Right", toSize: 3, pivotX: 1, pivotY: 0.5},
];

// const initialCrackTilesData = [
// 	{tile: 0, dx: 0, dy: 0, from: "", to: "Right", toSize: 1, pivotX: -1, pivotY: 0.5},
// 	{tile: 1, dx: 2, dy: 1, from: "Right", fromSize: 1, to: "Right", toSize: 1, pivotX: 1, pivotY: 0.5},
// 	// {tile: 2, dx: 0.5, dy: -1.5, from: "Right", fromSize: 1, to: "Down", toSize: 1, pivotX: 1, pivotY: -0.5},

// 	// 3
// 	{tile: 4, dx: 2, dy: 1, from: "Right", fromSize: 1, to: "Right", toSize: 2, pivotX: 1, pivotY: 0.5},
// 	// {tile: 5, dx: 0.5, dy: -1.5, from: "Right", fromSize: 2, to: "Down", toSize: 1, pivotX: 1, pivotY: -0.5},

// 	// {tile: 6, dx: 1.5, dy: 0.5, from: "Up", fromSize: 1, to: "Right", toSize: 2, pivotX: 0.5, pivotY: 1},
// 	{tile: 7, dx: 2, dy: 1, from: "Right", fromSize: 2, to: "Right", toSize: 2, pivotX: 1, pivotY: 0.5},
// 	// {tile: 8, dx: 0.5, dy: -1.5, from: "Right", fromSize: 2, to: "Down", toSize: 2, pivotX: 1, pivotY: -0.5},

// 	{tile: 9, dx: 2, dy: -1, from: "Right", fromSize: 3, to: "Right", toSize: 3, pivotX: 1, pivotY: -0.5},
// 	{tile: 10, dx: 2, dy: 1, from: "Right", fromSize: 3, to: "Right", toSize: 2, pivotX: 1, pivotY: 0.5},
// 	// {tile: 11, dx: 0.5, dy: -1.5, from: "Right", fromSize: 2, to: "Down", toSize: 3, pivotX: 1, pivotY: -0.5},

// 	// // 12
// 	// {tile: 13, dx: 0.5, dy: -1.5, from: "Down", fromSize: 2, to: "Right", toSize: 3, pivotX: -0.5, pivotY: -1},
// 	// {tile: 14, dx: 0.5, dy: 1.5, from: "Right", fromSize: 3, to: "Up", toSize: 3, pivotX: 1, pivotY: 0.5},
// ];

// Reverse the direction
const firstIntermediateCrackTilesData = [];
initialCrackTilesData.forEach(({tile, dx, dy, from, fromSize, to, toSize, pivotX, pivotY}) => {
	firstIntermediateCrackTilesData.push({tile, dx, dy, from, fromSize, to, toSize, pivotX, pivotY});
	firstIntermediateCrackTilesData.push({
		tile,
		dx: -dx, dy: -dy,
		from: reverseDirection(to), fromSize: toSize,
		to: reverseDirection(from), toSize: fromSize,
		pivotX: pivotX - dx,
		pivotY: pivotY - dy,
	});
});

// Flip horizontally
const intermediateCrackTilesData = [];
firstIntermediateCrackTilesData.forEach(({tile, dx, dy, from, fromSize, to, toSize, pivotX, pivotY}) => {
	intermediateCrackTilesData.push({tile, dx, dy, from, fromSize, to, toSize, pivotX, pivotY});
	intermediateCrackTilesData.push({
		tile,
		dx: -dx, dy,
		from: flipXDirection(from), fromSize,
		to: flipXDirection(to), toSize,
		pivotX: -pivotX, pivotY,
		flipX: true
	});
});

// // Flip horizontally
// const intermediateCrackTilesData = [];
// initialCrackTilesData.forEach(({tile, dx, dy, from, fromSize, to, toSize, pivotX, pivotY}) => {
// 	intermediateCrackTilesData.push({tile, dx, dy, from, fromSize, to, toSize, pivotX, pivotY});
// 	intermediateCrackTilesData.push({
// 		tile,
// 		dx, dy: -dy,
// 		from: reverseDirection(flipXDirection(to)), fromSize: toSize,
// 		to: reverseDirection(flipXDirection(from)), toSize: fromSize,
// 		pivotX: dx - pivotX,
// 		pivotY: pivotY - dy,
// 		flipX: true
// 	});
// });

// Rotate
const finalCrackTilesData = [];
intermediateCrackTilesData.forEach(({tile, dx, dy, from, fromSize, to, toSize, pivotX, pivotY, flipX}) => {
	[0, 1, 2, 3].forEach(rotation => {
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
	constructor({scene, crackPoints, crackExtendDelay}) {
		this.scene = scene;
		const x = Math.floor((Math.random() - 0.5) * conf.viewportWidth);
		const y = Math.floor((Math.random() - 0.5) * conf.viewportHeight);
		this.crackPoints = crackPoints || this.generateRandomCrack(1, {x, y});
		this.crackSegments = [];
		this.crackPointsSprites = [];
		this.regenerateAll();

		this.crackExtendDelay = crackExtendDelay;
		this.restartTimer();
	}

	restartTimer() {
		this.timeLeft = random(this.crackExtendDelay) * 1000;
	}

	destroy() {
		this.crackSegments.forEach(s => s.destroy());
		this.crackPointsSprites.forEach(s => s.destroy());
	}

	regenerateAll() {
		this.crackSegmentData = this.generateCrackSegmentData(this.crackPoints);

		this.crackSegments.forEach(s => s.destroy());
		this.crackSegments = this.generateCrackSegments(this.crackSegmentData);

		this.crackPointsSprites.forEach(s => s.destroy());
		this.crackPointsSprites = this.crackPoints.map(({x, y}) => (
			this.scene.add.sprite(x * conf.tileSize, -y * conf.tileSize, "CrackPoint")
		));
	}

	extend() {
		const canBeWidened = (crackPoint, i, array) => (
			i > 0 && i < array.length - 1 && crackPoint.size <= array[i - 1].size && crackPoint.size <= array[i + 1].size && crackPoint.size <= 2
		);

		const pointsToWiden = this.crackPoints.filter(canBeWidened);
		if (pointsToWiden.length > 0 && Math.random() < 0.5) {
			const pointToWiden = pick(pointsToWiden);
			pointToWiden.size++;
		} else if (Math.random() < 0.5) {
			const lastPoint = this.crackPoints[this.crackPoints.length - 1];
			const tile = pick(finalCrackTilesData.filter(data => data.from == lastPoint.direction && data.toSize == 1));
			this.crackPoints.push({
				x: lastPoint.x + tile.dx,
				y: lastPoint.y + tile.dy,
				direction: tile.to,
				size: 1,
			});
		} else {
			const firstPoint = this.crackPoints[0];
			const tile = pick(finalCrackTilesData.filter(data => data.fromSize == 1 && data.to == firstPoint.direction));
			this.crackPoints.unshift({
				x: firstPoint.x - tile.dx,
				y: firstPoint.y - tile.dy,
				direction: tile.from,
				size: 1,
			});
		}
		this.regenerateAll();
		this.restartTimer();
		this.scene.cameras.main.shake(200, 0.008);
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

	isCloseToPlayer({x, y}) {
		const dx = Math.abs(x - this.scene.player.x);
		const dy = Math.abs(y - this.scene.player.y);
		return (dx + dy < 2 * conf.tileSize);
	}

	update(time, delta) {
		this.timeLeft -= delta;
		this.crackSegments.forEach(cs => cs.update(time, delta));
		this.crackPointsSprites.forEach(cs => {
			if (this.isCloseToPlayer(cs))
				cs.setTexture("CrackPointActive");
			else
				cs.setTexture("CrackPoint");
			cs.update(time, delta);
		});
	}
}
