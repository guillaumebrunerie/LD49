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
		this.load.image("MainScreen", "MainScreen.jpg");
	}

	create() {
		this.add.image(0, 0, "StartScreen").setOrigin(0, 0);

		const startButton = this.add.image(this.scale.width / 2, 600, "StartButton");
		startButton.setInteractive();
		startButton.on("pointerdown", () => {
			this.scene.start("MainScene");
		});
	}
}

class MainScene extends Phaser.Scene {
	constructor() {
		super("MainScene");
	}

	create() {
		this.add.image(0, 0, "MainScreen").setOrigin(0, 0);
	}
}
