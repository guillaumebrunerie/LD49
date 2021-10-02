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
		this.load.setPath("assets");
		this.load.image("StartScreen", "StartScreen.jpg");
		this.load.image("StartButton", "StartButton.jpg");

		this.load.image("Player");

		this.load.spritesheet("Tiles", "Tiles.png", {frameWidth: conf.tileSize, frameHeight: conf.tileSize});
		this.load.spritesheet("CracksTiles", "CracksTiles.png", {frameWidth: conf.crackTileSize, frameHeight: conf.crackTileSize});
	}

	create() {
		this.add.image(0, 0, "StartScreen").setOrigin(0, 0);

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
		const tilemapData = [];
		for (let y = 0; y < conf.worldHeight; y++) {
			tilemapData[y] = [];
			for (let x = 0; x < conf.worldWidth; x++) {
				tilemapData[y][x] = Math.floor(Math.random() * 2);
			}
		}
		const tilemap = this.make.tilemap({
			data: tilemapData,
			tileWidth: conf.tileSize,
			tileHeight: conf.tileSize,
			width: conf.worldWidth,
			height: conf.worldHeight,
		});
		const tileset = tilemap.addTilesetImage("tileset", "Tiles");
		const layer = tilemap.createLayer(0, tileset);

		layer.x = -layer.width / 2;
		layer.y = -layer.height / 2;

		this.player = new Player(this);
		this.cameras.main.centerOn(0, 0);
		this.cameras.main.startFollow(this.player.sprite);

		this.cracks = [new Crack(this)];
	}

	update(time, delta) {
		this.player.update(time, delta);
		this.cracks.forEach(c => c.update(time, delta));
	}
}

class Player {
	constructor(scene) {
		this.scene = scene;
		this.sprite = scene.add.sprite(0, 0, "Player");

		this.cursorKeys = scene.input.keyboard.createCursorKeys();
	}

	update(time, delta) {
		const up    = this.cursorKeys.up.isDown;
		const down  = this.cursorKeys.down.isDown;
		const left  = this.cursorKeys.left.isDown;
		const right = this.cursorKeys.right.isDown;
		let deltaPos = conf.tileSize * conf.speed * delta / 1000;
		if ((up || down) && (left || right))
			deltaPos /= Math.sqrt(2);

		if (down)
			this.sprite.y += deltaPos;
		if (up)
			this.sprite.y -= deltaPos;
		if (right)
			this.sprite.x += deltaPos;
		if (left)
			this.sprite.x -= deltaPos;
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

const initialCrackTilesData = [
	{tile: 0, dx: 0, dy: 0, from: "", to: "Right", pivotX: -1, pivotY: 0.5},
	{tile: 1, dx: 2, dy: 1, from: "Right", to: "Right", pivotX: 1, pivotY: 0.5},
	{tile: 2, dx: 0.5, dy: -1.5, from: "Right", to: "Down", pivotX: 1, pivotY: -0.5},
	{tile: 0, dx: 0, dy: 0, from: "Left", to: "", pivotX: -1, pivotY: 0.5},
];

const intermediateCrackTilesData = [];
initialCrackTilesData.forEach(({tile, dx, dy, from, to, pivotX, pivotY}) => {
	intermediateCrackTilesData.push({tile, dx, dy, from, to, pivotX, pivotY});
	intermediateCrackTilesData.push({
		tile,
		dx: -dx,
		dy,
		from: flipXDirection(from),
		to: flipXDirection(to),
		pivotX: -pivotX,
		pivotY,
		flipX: true
	});
});

const finalCrackTilesData = [];
intermediateCrackTilesData.forEach(({tile, dx, dy, from, to, pivotX, pivotY, flipX}) => {
	[0, 1, 2, 3].forEach(rotation => {
		const {dx: newDx, dy: newDy} = rotateDxDy({dx, dy}, rotation);
		const {dx: newPivotX, dy: newPivotY} = rotateDxDy({dx: pivotX, dy: pivotY}, rotation);
		finalCrackTilesData.push({
			tile,
			dx: newDx, dy: newDy,
			from: rotateDirection(from, rotation),
			to: rotateDirection(to, rotation),
			pivotX: newPivotX, pivotY: newPivotY,
			flipX,
			rotation,
		});
	});
});

const pick = (array) => {
	return array[Math.floor(Math.random() * array.length)];
}

class Crack {
	constructor(scene) {
		this.scene = scene;
		// const crackPoints = [
		// 	{x: -1, y: -0.5, direction: "Right"},
		// 	{x: 1, y: 0.5, direction: "Right"},
		// 	{x: 1.5, y: -1, direction: "Down"},
		// 	{x: 3, y: -1.5, direction: "Right"},
		// 	{x: 3.5, y: 0, direction: "Up"},
		// ];
		// debugger;
		const crackPoints = this.generateRandomCrack(10, {x: 0, y: 0});
		const crackSegmentData = this.generateCrackSegmentData(crackPoints);
		this.crackSegments = this.generateCrackSegments(crackSegmentData);
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
			result.push({x, y, direction});
		}

		return result;
	}

	generateCrackSegmentData(crackPoints) {
		const result = [];

		const firstTile = finalCrackTilesData.find(data => data.from == "" && data.to == crackPoints[0].direction);
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
			const to = crackPoint.direction;
			const tileData = finalCrackTilesData.find(data => data.dx == dx && data.dy == dy && data.from == from && data.to == to);
			result.push({
				x: previousCrackPoint.x + tileData.pivotX,
				y: previousCrackPoint.y + tileData.pivotY,
				tile: tileData.tile,
				flipX: tileData.flipX,
				rotation: tileData.rotation,
			});
		});

		const lastPoint = crackPoints[crackPoints.length - 1];
		const lastTile = finalCrackTilesData.find(data => data.from == lastPoint.direction && data.to == "");
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

	update(time, delta) {
		this.crackSegments.forEach(cs => cs.update(time, delta));
	}
}
