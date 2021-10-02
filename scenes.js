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


		this.load.spritesheet("Tiles", "Tiles.png", {frameWidth: conf.tileSize, frameHeight: conf.tileSize});
		this.load.image("Tree_Dead_01");
		this.load.image("Tree_Dead_02");
		this.load.image("Tree_Green_01");
		this.load.image("Tree_Green_02");
		this.load.image("Trees_Dead_01");
		this.load.image("Trees_Green_01");

		this.load.spritesheet("CracksTiles", "CracksTiles.png", {frameWidth: conf.crackTileSize, frameHeight: conf.crackTileSize});
		this.load.image("CrackPoint");
		this.load.image("CrackPointActive");

		this.load.image("Player");
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

		this.cracks = [new Crack(this)];

		this.add.sprite(conf.tileSize * 3, 0, "Tree_Dead_01");
		this.add.sprite(conf.tileSize * 5, conf.tileSize * 2, "Tree_Dead_02");

		this.player = new Player(this);
		this.cameras.main.centerOn(0, 0);
		this.cameras.main.startFollow(this.player.sprite);

		this.lastEarthquake = 0;

		this.input.keyboard.on('keydown-SPACE', (event) => this.fireStart(event));
		this.input.keyboard.on('keyup-SPACE', (event) => this.fireEnd(event));
	}

	fireStart() {
		const healPoints = [];
		this.cracks.forEach(crack => {
			crack.crackPoints.forEach(crackPoint => {
				if (crack.isCloseToPlayer({x: crackPoint.x * conf.tileSize, y: -crackPoint.y * conf.tileSize}))
					healPoints.push({crack, crackPoint});
			});
		});
		if (healPoints.length !== 0) {
			const {crack, crackPoint} = pick(healPoints);
			const newCracks = healAt(this, crack, crackPoint);
			crack.destroy();
			this.cracks = this.cracks.filter(c => c !== crack);
			this.cracks.push(...newCracks);
		}
	}

	fireEnd() {
		console.log("fireend");
	}

	update(time, delta) {
		this.lastEarthquake += delta;

		if (this.lastEarthquake > conf.crackDelay * 1000) {
			this.lastEarthquake -= conf.crackDelay * 1000;
			const crack = pick([...this.cracks]);
			if (crack)
				crack.extend();
			else
				this.cracks.push(new Crack(this));
		}

		this.player.update(time, delta);
		this.cracks.forEach(c => c.update(time, delta));
	}
}

const healAt = (scene, crack, crackPoint) => {
	const crackPoints = [...crack.crackPoints];
	const index = crackPoints.indexOf(crackPoint);

	const canBeHealed = (crackPoint, i, array) => (
		true
			&& (i == 0 || array[i - 1].size <= crackPoint.size)
			&& (i == array.length - 1 || array[i + 1].size <= crackPoint.size)
	);

	if (!canBeHealed(crackPoint, index, crackPoints))
		return [new Crack(scene, crackPoints)];

	if (crackPoint.size > 1) {
		crackPoint.size--;
		return [new Crack(scene, crackPoints)];
	} else if (crackPoints.length == 1) {
		return [];
	} else if (index == 0) {
		return [new Crack(scene, crackPoints.slice(1))];
	} else if (index == crackPoints.length - 1) {
		return [new Crack(scene, crackPoints.slice(0, index))];
	} else {
		return [
			new Crack(scene, crackPoints.slice(0, index)),
			new Crack(scene, crackPoints.slice(index + 1)),
		];
	}
};

class Player {
	constructor(scene) {
		this.scene = scene;
		this.sprite = scene.add.sprite(0, 0, "Player");

		this.cursorKeys = scene.input.keyboard.createCursorKeys();
	}

	get x() {return this.sprite.x;}
	get y() {return this.sprite.y;}

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
	{tile: 2, dx: 0.5, dy: -1.5, from: "Right", fromSize: 1, to: "Down", toSize: 1, pivotX: 1, pivotY: -0.5},

	// 3
	{tile: 4, dx: 2, dy: 1, from: "Right", fromSize: 1, to: "Right", toSize: 2, pivotX: 1, pivotY: 0.5},
	{tile: 5, dx: 0.5, dy: -1.5, from: "Right", fromSize: 2, to: "Down", toSize: 1, pivotX: 1, pivotY: -0.5},

	{tile: 6, dx: 1.5, dy: 0.5, from: "Up", fromSize: 1, to: "Right", toSize: 2, pivotX: 0.5, pivotY: 1},
	{tile: 7, dx: 2, dy: 1, from: "Right", fromSize: 2, to: "Right", toSize: 2, pivotX: 1, pivotY: 0.5},
	{tile: 8, dx: 0.5, dy: -1.5, from: "Right", fromSize: 2, to: "Down", toSize: 2, pivotX: 1, pivotY: -0.5},

	{tile: 9, dx: 2, dy: -1, from: "Right", fromSize: 3, to: "Right", toSize: 3, pivotX: 1, pivotY: -0.5},
	{tile: 10, dx: 2, dy: 1, from: "Right", fromSize: 3, to: "Right", toSize: 2, pivotX: 1, pivotY: 0.5},
	{tile: 11, dx: 0.5, dy: -1.5, from: "Right", fromSize: 2, to: "Down", toSize: 3, pivotX: 1, pivotY: -0.5},

	// 12
	{tile: 13, dx: 0.5, dy: -1.5, from: "Down", fromSize: 2, to: "Right", toSize: 3, pivotX: -0.5, pivotY: -1},
	{tile: 14, dx: 0.5, dy: 1.5, from: "Right", fromSize: 3, to: "Up", toSize: 3, pivotX: 1, pivotY: 0.5},
];

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

const pick = (array) => {
	return array[Math.floor(Math.random() * array.length)];
};

class Crack {
	constructor(scene, crackPoints) {
		this.scene = scene;
		const x = Math.floor((Math.random() - 0.5) * conf.viewportWidth);
		const y = Math.floor((Math.random() - 0.5) * conf.viewportHeight);
		this.crackPoints = crackPoints || this.generateRandomCrack(1, {x, y});
		this.crackSegments = [];
		this.crackPointsSprites = [];
		this.regenerateAll();
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
