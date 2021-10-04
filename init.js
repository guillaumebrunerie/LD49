new Phaser.Game({
	title: "Ludum Dare #49",
	url: "",
	type: Phaser.AUTO,
	transparent: true,
	pixelArt: true,
	zoom: conf.tileScaleFactor,
	scale: {
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: conf.viewportWidth * conf.tileSize,
		height: conf.viewportHeight * conf.tileSize,
	},
	scene: [StartScene, MainScene, InventoryScene, DialogScene],
});
