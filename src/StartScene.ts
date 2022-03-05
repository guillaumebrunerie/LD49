import * as Phaser from "phaser";

import * as Conf from "./configuration";
import SoundButtonScene from "./SoundButtonScene";
import Demon from "./Demon";
import Player from "./Player";

const SOUNDS = [
	"Beep1", "Beep2", "Beep3", "Beep4", "Beep5",
	"CrackAppears", "CrackHealed", "DropletCollected", "SuperDropletCollected",
	"WaterInventoryEmpty.wav",
	"TreeHealed", "Water",
	"GameLost", "GameWon", "Music",
	"LevelComplete",
	"DemonAppear", "DemonAttack", "DemonDeath", "DemonHappy", "DemonMove",
	"PlayerMove", "Locker", "Prize"
];

export default class extends Phaser.Scene {
	constructor() {
		super("StartScene");
	}

	preload() {
		const tileConf = { frameWidth: Conf.tileSize, frameHeight: Conf.tileSize };

		this.load.setPath("assets/Audio");
		for (const sound of SOUNDS) {
			this.load.audio(sound, sound.endsWith(".wav") ? sound : sound + ".mp3");
		}

		this.load.setPath("assets/UI");
		this.load.image("Start_Screen");
		this.load.image("Btn_Start");
		this.load.image("Btn_Start_Active");

		this.load.image("LifeBar");
		this.load.image("LifeBarBg");
		this.load.image("LifeBarRed");

		this.load.image("PlayBtn_Default");
		this.load.image("PlayBtn_On");

		this.load.setPath("assets");
		this.load.image("DialogBackground");

		this.load.image("Water_Bullet", "UI/Water_Bullet.png");
		this.load.image("Water_Inventory", "UI/Water_Inventory.png");

		this.load.spritesheet("PrizeFx", "SpriteSheets/PrizeFx.png", tileConf);

		this.load.spritesheet("Droplet", "SpriteSheets/Droplet.png", tileConf);

		this.load.spritesheet("Tiles", "SpriteSheets/BgElements.png", tileConf);
		this.load.spritesheet("Trees", "SpriteSheets/BgElements2.png", tileConf);
		this.load.spritesheet("SpaceTiles", "SpriteSheets/BgSpace.png", tileConf);

		this.load.spritesheet("CracksTiles", "SpriteSheets/Cracks.png", { frameWidth: Conf.crackTileSize, frameHeight: Conf.crackTileSize });
		this.load.spritesheet("CrackPoints", "SpriteSheets/CrackPoints.png", tileConf);

		this.load.spritesheet("CracksSingleEnd", "SpriteSheets/CracksSingleEnd.png", {frameWidth: Conf.crackTileSize, frameHeight: Conf.crackTileSize});
		this.load.spritesheet("CracksSmokeEndHorizontal", "SpriteSheets/CracksSmokeEndHorizontal.png", {frameWidth: Conf.crackTileSize * 2, frameHeight: Conf.crackTileSize});
		this.load.spritesheet("CracksSmokeEndVertical", "SpriteSheets/CracksSmokeEndVertical.png", {frameWidth: Conf.crackTileSize * 2, frameHeight: Conf.crackTileSize});

		this.load.spritesheet("Player1", "SpriteSheets/Hero.png", tileConf);
		this.load.spritesheet("Player2", "SpriteSheets/HeroUpgrade1.png", tileConf);
		this.load.spritesheet("Player3", "SpriteSheets/HeroUpgrade2.png", tileConf);
		this.load.spritesheet("Characters", "SpriteSheets/Characters.png", tileConf);
		this.load.spritesheet("Bubble", "SpriteSheets/SpeechBubble.png", tileConf);
		this.load.spritesheet("Laser1", "SpriteSheets/Laser.png", tileConf);
		this.load.spritesheet("Laser2", "SpriteSheets/LaserUpgrade1.png", tileConf);
		this.load.spritesheet("Laser3", "SpriteSheets/LaserUpgrade2.png", tileConf);

		this.load.spritesheet("Font", "Font.png", { frameWidth: 8, frameHeight: 8 });

		this.load.spritesheet("GameWon", "SpriteSheets/WinScreen.png", { frameWidth: 480, frameHeight: 240 });
		this.load.spritesheet("GameLost", "SpriteSheets/LostScreen.png", { frameWidth: 480, frameHeight: 240 });

		this.load.spritesheet("Demon", "SpriteSheets/Demon.png", tileConf);

		this.load.spritesheet("WaterBullet", "SpriteSheets/WaterBullet.png", tileConf);

		this.load.spritesheet("LevelLock", "SpriteSheets/LevelLock.png", {frameWidth: 48, frameHeight: 48});
		this.load.image("SelectWorldTxt", "UI/SelectWorldTxt.png");
		this.load.image("WorldLines", "UI/World_Lines.png");
		this.load.image("LevelOver", "UI/Level_Complete_Txt.png");
		this.load.atlas("Levels", "SpriteSheets/Levels.png", "SpriteSheets/Levels.json");
	}

	create() {
		this.anims.create({
			key: "Droplet",
			frameRate: 5,
			frames: this.anims.generateFrameNames("Droplet", {
				start: 0, end: 12
			}),
			repeat: -1,
		});
		this.anims.create({
			key: "SuperDroplet",
			frameRate: 5,
			frames: this.anims.generateFrameNames("Droplet", {
				start: 13, end: 25
			}),
			repeat: -1,
		});

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

		[1, 2, 3].forEach(skin => this.anims.create({
			key: `Target${skin}Crack`,
			frameRate: 14 / Conf.crackResistance[skin - 1],
			frames: this.anims.generateFrameNames("CrackPoints", { start: 1, end: 15 }),
		}));

		[1, 2, 3].forEach(skin => this.anims.create({
			key: `Target${skin}Tree`,
			frameRate: 15 / Conf.treeResistance[skin - 1],
			frames: this.anims.generateFrameNames("CrackPoints", { start: 27, end: 42 }),
		}));

		[1, 2, 3].forEach(skin => this.anims.create({
			key: `Target${skin}Demon`,
			frameRate: 15 / Conf.demonResistance[skin - 1],
			frames: this.anims.generateFrameNames("CrackPoints", { start: 53, end: 68 }),
		}));

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

		this.anims.create({
			key: "PrizeFx1",
			frameRate: 10,
			frames: this.anims.generateFrameNames("PrizeFx", { frames: [0, 1, 2, 3, 4] }),
		});

		this.anims.create({
			key: "PrizeFx2",
			frameRate: 10,
			frames: this.anims.generateFrameNames("PrizeFx", { frames: [13, 14, 15, 16, 17] }),
		});

		this.anims.create({
			key: "PrizeFx3",
			frameRate: 10,
			frames: this.anims.generateFrameNames("PrizeFx", { frames: [26, 27, 28, 29, 30, 31] }),
		});

		this.anims.create({
			key: "InventoryUpgrade",
			frameRate: 10,
			frames: this.anims.generateFrameNames("WaterBullet", { frames: [26, 27, 28, 29, 30, 31, 32, 31] }),
		});

		this.anims.create({
			key: "InventoryRefill",
			frameRate: 15,
			frames: this.anims.generateFrameNames("WaterBullet", { frames: [0, 1, 2, 3, 4, 5] }),
		});

		this.anims.create({
			key: "InventoryEmpty",
			frameRate: 5,
			frames: this.anims.generateFrameNames("WaterBullet", { frames: [13,  14] }),
			repeat: -1,
		});

		this.anims.create({
			key: "CracksSingleEndLeft1",
			frameRate: 25,
			frames: this.anims.generateFrameNames("CracksSingleEnd", {frames: [0, 2, 4]}),
		});

		this.anims.create({
			key: "CracksSingleEndRight1",
			frameRate: 25,
			frames: this.anims.generateFrameNames("CracksSingleEnd", {frames: [1, 3, 5]}),
		});

		this.anims.create({
			key: "CracksSingleEndLeft2",
			frameRate: 25,
			frames: this.anims.generateFrameNames("CracksSingleEnd", {frames: [6, 8, 10]}),
		});

		this.anims.create({
			key: "CracksSingleEndRight2",
			frameRate: 25,
			frames: this.anims.generateFrameNames("CracksSingleEnd", {frames: [7, 9, 11]}),
		});

		this.anims.create({
			key: "CracksSingleEndLeft3",
			frameRate: 25,
			frames: this.anims.generateFrameNames("CracksSingleEnd", {frames: [12, 14, 16]}),
		});

		this.anims.create({
			key: "CracksSingleEndRight3",
			frameRate: 25,
			frames: this.anims.generateFrameNames("CracksSingleEnd", {frames: [13, 15, 17]}),
		});

		this.anims.create({
			key: "CracksSmokeEndHorizontal",
			frameRate: 15,
			frames: this.anims.generateFrameNames("CracksSmokeEndHorizontal", {frames: [0, 1, 2, 3, 4, 5]}),
		});

		this.anims.create({
			key: "CracksSmokeEndVertical",
			frameRate: 15,
			frames: this.anims.generateFrameNames("CracksSmokeEndVertical", {frames: [0, 1, 2, 3, 4, 5]}),
		});

		this.anims.create({
			key: "LevelLock",
			frameRate: 10,
			frames: this.anims.generateFrameNames("LevelLock", {frames: [0, 1, 2, 3, 4, 5, 6]}),
		});

		for (let i = 0; i < 6; i++) {
			this.anims.create({
				key: "NPCIdle" + i,
				frameRate: 3,
				frames: this.anims.generateFrameNames("Characters", {
					frames: [13 * i, 13 * i + 1, 13 * i, 13 * i + 2]
				}),
				repeat: -1,
			});
		}

		const makeBurningTree = (index: number, firstFrame: number) => {
			this.anims.create({
				key: "BurningTree" + index,
				frameRate: 3,
				frames: this.anims.generateFrameNames("Trees", { frames: [firstFrame, firstFrame + 1] }),
				repeat: -1,
			});
		};
		makeBurningTree(0, 1);
		makeBurningTree(1, 14);
		makeBurningTree(2, 27);
		makeBurningTree(3, 40);
		makeBurningTree(4, 53);
		makeBurningTree(5, 66);
		makeBurningTree(6, 79);
		makeBurningTree(7, 5);
		makeBurningTree(8, 18);
		makeBurningTree(9, 31);

		Demon.createAnimations(this.anims);
		Player.createAnimations(this.anims);

		this.add.image(0, 0, "Start_Screen").setOrigin(0, 0);



		// this.scene.start("LevelSelect");



		const startButton = this.add.image(Conf.startButton.x, Conf.startButton.y, "Btn_Start");
		let isStartButtonDown = false;
		startButton.setInteractive({
			cursor: "pointer",
		});
		startButton.on("pointerdown", () => {
			isStartButtonDown = true;
			startButton.setTexture("Btn_Start_Active");
		});
		startButton.on("pointerout", () => {
			isStartButtonDown = false;
			startButton.setTexture("Btn_Start");
			startButton.y += 1;
		});
		startButton.on("pointerover", () => {
			startButton.y -= 1;
		});

		const doStart = () => {
			this.scene.start("LevelSelect");
			(this.scene.get("SoundButtonScene") as SoundButtonScene).gameStarted();
		}

		startButton.on("pointerup", () => {
			if (isStartButtonDown) {
				doStart();
			}
		});
		this.input.keyboard.on('keyup-SPACE', () => doStart());
		this.input.keyboard.on('keyup-ENTER', () => doStart());
	}
}
