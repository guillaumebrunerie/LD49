import * as Phaser from "phaser";

import * as Conf from "./configuration";
import StartScene from "./StartScene";
import MainScene from "./MainScene";
import InventoryScene from "./InventoryScene";
import DialogScene from "./DialogScene";
import GameWonScene from "./GameWonScene";
import GameLostScene from "./GameLostScene";
import SoundButtonScene from "./SoundButtonScene";

const gameConfig: Phaser.Types.Core.GameConfig = ({
	title: "Space Cracks!",
	url: "https://latcarf.itch.io/space-cracks",
	type: Phaser.AUTO,
	transparent: true,
	pixelArt: true,
	zoom: Conf.tileScaleFactor,
	scale: {
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: Conf.viewportWidth * Conf.tileSize,
		height: Conf.viewportHeight * Conf.tileSize,
	},
	scene: [
		StartScene,
		MainScene,
		InventoryScene,
		DialogScene,
		GameWonScene,
		GameLostScene,
		SoundButtonScene
	],
});

export const game = new Phaser.Game(gameConfig);
