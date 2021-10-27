import * as Phaser from "phaser";

import * as Conf from "./configuration";
import * as Tiles from "./tiles";
import SoundButtonScene from "./SoundButtonScene";
import Demon from "./Demon";

export default class extends Phaser.Scene {
	constructor() {
		super("StartScene");
	}

	preload() {
		const tileConf = { frameWidth: Conf.tileSize, frameHeight: Conf.tileSize };

		this.load.setPath("assets/Audio");
		this.load.audio("music", "Music/Exploration_Dark (loop).mp3");
		this.load.audio("WinScreen", "Music/WinScreen.mp3");

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

		this.load.spritesheet("CracksTiles", "SpriteSheets/Cracks.png", { frameWidth: Conf.crackTileSize, frameHeight: Conf.crackTileSize });
		this.load.spritesheet("CrackPoints", "SpriteSheets/CrackPoints.png", tileConf);

		this.load.spritesheet("Player", "SpriteSheets/Hero.png", tileConf);
		this.load.spritesheet("Characters", "SpriteSheets/Characters.png", tileConf);
		this.load.spritesheet("Bubble", "SpriteSheets/SpeechBubble.png", tileConf);
		this.load.spritesheet("Laser", "SpriteSheets/Laser.png", tileConf);

		this.load.spritesheet("Font", "Font.png", { frameWidth: 8, frameHeight: 8 });

		this.load.spritesheet("GameWon", "SpriteSheets/WinScreen.png", { frameWidth: 480, frameHeight: 240 });
		this.load.spritesheet("GameLost", "SpriteSheets/LostScreen.png", { frameWidth: 480, frameHeight: 240 });

        this.load.spritesheet("Demon", "SpriteSheets/Demon.png", tileConf);
	}

	create() {
		this.add.image(0, 0, "Start_Screen").setOrigin(0, 0);

		this.anims.create({
			key: "GameWon",
			frameRate: 10,
			frames: this.anims.generateFrameNames("GameWon", { start: 0, end: 8 }),
		});

		this.anims.create({
			key: "GameLost",
			frameRate: 10,
			frames: this.anims.generateFrameNames("GameLost", { start: 0, end: 15 }),
		});

		this.anims.create({
			key: "CrackPoint",
			frameRate: 14 / Conf.crackResistance,
			frames: this.anims.generateFrameNames("CrackPoints", { start: 1, end: 15 }),
		});

		this.anims.create({
			key: "CrackPointTree",
			frameRate: (42 - 27) / Conf.crackResistance,
			frames: this.anims.generateFrameNames("CrackPoints", { start: 27, end: 42 }),
		});

		this.anims.create({
			key: "BubbleStart",
			frameRate: 15,
			frames: this.anims.generateFrameNames("Bubble", { frames: [0, 1, 2] }),
		});

		this.anims.create({
			key: "BubbleLoop",
			frameRate: 3,
			frames: this.anims.generateFrameNames("Bubble", { frames: [2, 3, 4, 5] }),
			repeat: -1,
		});

		this.anims.create({
			key: "BubbleEnd",
			frameRate: 15,
			frames: this.anims.generateFrameNames("Bubble", { frames: [2, 1, 0, 6] }),
		});

		Tiles.laserAnimations.forEach(([suffix, anim]) => {
			this.anims.create({
				key: "Laser" + suffix,
				frameRate: 5,
				frames: this.anims.generateFrameNames("Laser", anim),
				repeat: -1
			});
		});

		Tiles.playerWalkAnimations.forEach(([suffix, anim]) => {
			this.anims.create({
				key: "PlayerWalk" + suffix,
				frameRate: 10,
				frames: this.anims.generateFrameNames("Player", anim),
				repeat: -1
			});
		});

        Demon.createAnimations(this.anims);

		const startButton = this.add.image(Conf.startButton.x, Conf.startButton.y, "Btn_Start");
		let isStartButtonDown = false;
		startButton.setInteractive();
		startButton.on("pointerdown", () => {
			isStartButtonDown = true;
			startButton.setTexture("Btn_Start_Active");
		});
		startButton.on("pointerout", () => {
			isStartButtonDown = false;
			startButton.setTexture("Btn_Start");
		});
		startButton.on("pointerup", () => {
			if (isStartButtonDown) {
				this.scene.start("MainScene");
				(this.scene.get("SoundButtonScene") as SoundButtonScene).gameStarted();
			}
		});
	}
}
