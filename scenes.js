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
			const crack = pick([null, ...this.cracks]);
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
	if (crackPoints.length == 1) {
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

const initialCrackTilesData = [
	{tile: 0, dx: 0, dy: 0, from: "", to: "Right", pivotX: -1, pivotY: 0.5},
	{tile: 1, dx: 2, dy: 1, from: "Right", to: "Right", pivotX: 1, pivotY: 0.5},
	{tile: 2, dx: 0.5, dy: -1.5, from: "Right", to: "Down", pivotX: 1, pivotY: -0.5},

	{tile: 0, dx: 0, dy: 0, from: "Left", to: "", pivotX: -1, pivotY: 0.5},
	{tile: 1, dx: -2, dy: -1, from: "Left", to: "Left", pivotX: -1, pivotY: -0.5},
	{tile: 2, dx: -0.5, dy: 1.5, from: "Up", to: "Left", pivotX: 0.5, pivotY: 1},
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
};

class Crack {
	constructor(scene, crackPoints) {
		this.scene = scene;
		const x = (Math.random() - 0.5) * conf.viewportWidth;
		const y = (Math.random() - 0.5) * conf.viewportHeight;
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
		if (Math.random() < 0.5) {
			const lastPoint = this.crackPoints[this.crackPoints.length - 1];
			const tile = pick(finalCrackTilesData.filter(data => data.from == lastPoint.direction && data.to !== ""));
			this.crackPoints.push({
				x: lastPoint.x + tile.dx,
				y: lastPoint.y + tile.dy,
				direction: tile.to,
			});
		} else {
			const firstPoint = this.crackPoints[0];
			const tile = pick(finalCrackTilesData.filter(data => data.from !== "" && data.to == firstPoint.direction));
			this.crackPoints.unshift({
				x: firstPoint.x - tile.dx,
				y: firstPoint.y - tile.dy,
				direction: tile.from,
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
			result.push({x, y, direction});
		}

		return result;
	}

	generateCrackSegmentData(crackPoints) {
		const result = [];

		const pick = array => array[0];

		const firstTile = pick(finalCrackTilesData.filter(data => data.from == "" && data.to == crackPoints[0].direction));
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
			const tileData = pick(finalCrackTilesData.filter(data => Math.abs(data.dx - dx) < 0.1 && Math.abs(data.dy - dy) < 0.1 && data.from == from && data.to == to));
			result.push({
				x: previousCrackPoint.x + tileData.pivotX,
				y: previousCrackPoint.y + tileData.pivotY,
				tile: tileData.tile,
				flipX: tileData.flipX,
				rotation: tileData.rotation,
			});
		});

		const lastPoint = crackPoints[crackPoints.length - 1];
		const lastTile = pick(finalCrackTilesData.filter(data => data.from == lastPoint.direction && data.to == ""));
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
