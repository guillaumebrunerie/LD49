/*
 * Configuration variables
 */

let conf = {};

// Size (in pixels) of one tile
conf.tileSize = 24;

// How many times should the tiles be scaled up
conf.tileScaleFactor = 3;

// Total size (in tiles) of the world
conf.worldSize = 35;
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

// Speed of the robot, in tiles/second
conf.speed = 4;

// Time between two earthquakes, in seconds
conf.crackDelay = {min: 2, max: 4};

// Time it takes to heal a crack, in seconds
conf.crackResistance = 2;

// Probability that a crack will widen instead of extending (if possible)
conf.widenProbability = 0.8;

conf.level2 = {
	numberOfCracks: 3,
};
