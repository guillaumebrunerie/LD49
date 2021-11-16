import * as Phaser from "phaser"

const planetsPositions = [
	{x: 70,  y: 185, dx: 1, dy: 15},
	{x: 116, y: 115, dx: 1, dy: 18},
	{x: 189, y: 163, dx: 1, dy: 21},
	{x: 239, y: 73,  dx: 1, dy: 26},
	{x: 311, y: 158, dx: 3, dy: 27},
	{x: 388, y: 68,  dx: 0, dy: 35},
];

const worldLinesPosition = {x: 221, y: 133};
const selectWorldTxtPosition = {x: 107, y: 27};

type Status = "finished" | "available" | "locked";
const statusToImage = {
	"finished": "Complete",
	"available": "Default",
	"locked": "Inactive",
};

export default class extends Phaser.Scene {
	planetsStatus: Status[] = ["available", "available", "available", "available", "available", "available"];
	planets: Phaser.GameObjects.Sprite[] = [];
	locks: Phaser.GameObjects.Sprite[] = [];
	selection!: Phaser.GameObjects.Sprite;
	selectedIndex = 0;

	constructor() {
		super("LevelSelect");
	}

	preload() {
		this.load.image("Reference", "assets/SpriteSheets/LevelMap_LocksPlacement_prev.jpg");
	}

	updateGraphics() {
		this.selection.setTexture("Levels", "Planet_Select_0" + (this.selectedIndex + 1));
		this.selection.x = planetsPositions[this.selectedIndex].x;
		this.selection.y = planetsPositions[this.selectedIndex].y;

		for (let i = 0; i < 6; i++) {
			const image = `Planet_${statusToImage[this.planetsStatus[i]]}_0${i + 1}`;
			this.planets[i].setFrame(image);
			this.locks[i].setVisible(this.planetsStatus[i] === "locked");
		}
	}

	create() {
		// this.add.image(240, 120, "Reference");

		this.add.rectangle(0, 0, 480, 240, 0x030712).setOrigin(0, 0);

		this.add.image(worldLinesPosition.x, worldLinesPosition.y, "WorldLines");
		this.add.image(selectWorldTxtPosition.x, selectWorldTxtPosition.y, "SelectWorldTxt");

		this.selection = this.add.sprite(0, 0, "Levels", "Planet_Select_01");

		for (let i = 0; i < 6; i++) {
			const {x, y, dx, dy} = planetsPositions[i];
			this.planets[i] = this.add.sprite(x, y, "Levels");
			this.locks[i] = this.add.sprite(x + dx, y + dy, "LevelLock", 0);
		}

		this.updateGraphics();

		this.input.keyboard.on('keydown-RIGHT', () => {
			this.selectedIndex = Math.min(5, this.selectedIndex + 1);
			this.updateGraphics();
		});
		this.input.keyboard.on('keydown-LEFT', () => {
			this.selectedIndex = Math.max(0, this.selectedIndex - 1);
			this.updateGraphics();
		});
		this.input.keyboard.on('keydown-SPACE', () => this.startSelectedLevel());
		this.input.keyboard.on('keydown-ENTER', () => this.startSelectedLevel());
		this.scene.scene.events.on("wake", (_: any, data: {type: string, payload: number}) => {
			if (data.type == "complete") {
				this.planetsStatus[data.payload] = "finished";
				if (this.planetsStatus[data.payload + 1] === "locked")
					this.planetsStatus[data.payload + 1] = "available";
			}
			this.updateGraphics();
		})
	}

	startSelectedLevel() {
		if (this.planetsStatus[this.selectedIndex] !== "locked") {
			this.scene.sleep();
			this.scene.run("MainScene", {level: this.selectedIndex});
		}
	}
}
