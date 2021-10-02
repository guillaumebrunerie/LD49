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
	}

	update(time, delta) {
		this.player.update(time, delta);
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
