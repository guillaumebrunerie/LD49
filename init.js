new Phaser.Game({
	title: "Ludum Dare #49",
	url: "",
	type: Phaser.AUTO,
	transparent: true,
	scale: {
		autoCenter: Phaser.Scale.CENTER_BOTH,
		mode: Phaser.Scale.FIT,
		width: 1920,
		height: 1080,
	},
	scene: [StartScene, MainScene],
});
