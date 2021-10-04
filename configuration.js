/*
 * Configuration variables
 */

let conf = {};

// Size (in pixels) of one tile
conf.tileSize = 24;

// How many times should the tiles be scaled up
conf.tileScaleFactor = 3;

// Total size (in tiles) of the world
conf.worldSize = 30;
conf.worldWidth = conf.worldSize;
conf.worldHeight = conf.worldSize;

// Size (in tiles) of the viewport
conf.viewportWidth = 20;
conf.viewportHeight = 10;

// Size (in pixels) of one tile for cracks
conf.crackTileSize = 48;

// Position and scale of the avatar
conf.avatar = {x: 40, y: 53, scale: 2};

// Position and scale of the text
conf.dialogText = {x: 80, y: 50, dy: 10};

// Position and scale of the dialog background
conf.dialogBg = {x: 240, y: 53};

// Position of the bubble
conf.bubbleOffset = {dx: 14, dy: -15};

// Buttons
conf.startButton = {x: 239, y: 198};
conf.soundButton = {x: 442, y: 9};
conf.smallSoundButton = {x: 467, y: 14};

conf.inventory = {
	x: 12,
	y: 10,
	dx: 13,
};

// Unused
// // Speed of the robot, in tiles/second
// conf.speed = 4;

// Time after which a droplet will disappear
conf.dropletTimeout = 15;

// Time it takes to heal a crack, in seconds
conf.crackResistance = 1;

// Probability that a crack will widen instead of extending (if possible)
conf.widenProbability = 0.8;

conf.crackHitboxSize = 14;
conf.introGuideHitboxSize = 18;
conf.dropletHitboxSize = 12;

// Level specific configurations

conf.levels = [];

conf.levels[1] = {
	numberOfCracks: 1,
	crackDelay: Infinity,
	waterCapacity: 1,
	// crackDelay: 0.5,
	dropsDelay: 0.5,

	// crackDelay: {min: 1, max: 1}, // Time between two earthquakes, in seconds
	// dropsDelay: {min: 0.5, max: 3}, // Time between the appearance of droplets
	// allowNewCracks: true,
};

conf.levels[2] = {
	numberOfCracks: 3,
	crackDelay: {min: 3, max: 5}, // Time between two earthquakes, in seconds
	crackMaxLength: 5,
	dropsDelay: {min: 1, max: 3}, // Time between the appearance of droplets
	waterCapacity: 5,
};

conf.levels[3] = {
	numberOfCracks: 4,
	crackDelay: {min: 2, max: 5}, // Time between two earthquakes, in seconds
	dropsDelay: {min: 0.5, max: 1.5}, // Time between the appearance of droplets
	waterCapacity: 5,
};

conf.levels[4] = {
	numberOfCracks: 1,
	crackDelay: {min: 1, max: 3}, // Time between two earthquakes, in seconds
	dropsDelay: {min: 0.5, max: 3}, // Time between the appearance of droplets
	allowNewCracks: true,
	waterCapacity: 5,

	treesEnabled: true,
	extendDelay: 4,
	extendProbability: 0.5,
};
