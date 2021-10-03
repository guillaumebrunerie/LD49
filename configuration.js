/*
 * Configuration variables
 */

let conf = {};

// Size (in pixels) of one tile
conf.tileSize = 24;

// How many times should the tiles be scaled up
conf.tileScaleFactor = 3;

// Total size (in tiles) of the world
conf.worldWidth = 27;
conf.worldHeight = 23;

// Size (in tiles) of the viewport
conf.viewportWidth = 20;
conf.viewportHeight = 10;

// Size (in pixels) of one tile for cracks
conf.crackTileSize = 48;

//
conf.bubbleOffset = {dx: 14, dy: -15};

// Speed of the robot, in tiles/second
conf.speed = 4;

// Time between two earthquakes, in seconds
conf.crackDelay = {min: 2, max: 4};

// Time it takes to heal a crack, in seconds
conf.crackResistance = 2;

// Probability that a crack will widen instead of extending (if possible)
conf.widenProbability = 0.8;
