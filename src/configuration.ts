/*
 * Configuration variables
 */

// Size (in pixels) of one tile
export const tileSize = 24;

// How many times should the tiles be scaled up
export const tileScaleFactor = 3;

// Total size (in tiles) of the world
export const worldSize = 30;
export const worldWidth = worldSize;
export const worldHeight = worldSize;

// Size (in tiles) of the viewport
export const viewportWidth = 20;
export const viewportHeight = 10;

// Size (in pixels) of one tile for cracks
export const crackTileSize = 48;

// Position and scale of the avatar
export const avatar = { x: 40, y: 53, scale: 2 };

// Position and scale of the text
export const dialogText = { x: 80, y: 50, dy: 10 };

// Position and scale of the dialog background
export const dialogBg = { x: 240, y: 53 };

// Position of the bubble
export const bubbleOffset = { dx: 14, dy: -15 };

// Buttons
export const startButton = { x: 239, y: 198 };
export const soundButton = { x: 442, y: 9 };
export const smallSoundButton = { x: 467, y: 14 };

export const inventory = {
	x: 12,
	y: 10,
	dx: 13,
};

// Unused
// // Speed of the robot, in tiles/second
// conf.speed = 4;

// Time after which a droplet will disappear
export const dropletTimeout = 15;

// Time it takes to heal a crack, in seconds
export const crackResistance = 1;

// Probability that a crack will widen instead of extending (if possible)
export const widenProbability = 0.8;

export const crackHitboxSize = 14;
export const introGuideHitboxSize = 18;
export const dropletHitboxSize = 12;

// Level specific configurations

export type MaybeRandomNumber = number | {min: number, max: number};

type LevelConfiguration = {
	numberOfCracks: number,
	crackDelay: MaybeRandomNumber,
	waterCapacity: number,
	dropsDelay: MaybeRandomNumber,
	crackMaxLength?: number,
	allowNewCracks?: boolean,
	treesEnabled?: boolean,
	extendDelay?: number,
	extendProbability?: number,
}

export const levels: LevelConfiguration[] = [
	null, {
		numberOfCracks: 1,
		crackDelay: Infinity,
		waterCapacity: 1,
		dropsDelay: 0.5,
	}, {
		numberOfCracks: 3,
		crackDelay: { min: 3, max: 5 }, // Time between two earthquakes, in seconds
		crackMaxLength: 5,
		dropsDelay: { min: 1, max: 3 }, // Time between the appearance of droplets
		waterCapacity: 5,
	}, {
		numberOfCracks: 4,
		crackDelay: { min: 2, max: 5 }, // Time between two earthquakes, in seconds
		dropsDelay: { min: 0.5, max: 1.5 }, // Time between the appearance of droplets
		waterCapacity: 5,
	}, {
		numberOfCracks: 1,
		crackDelay: { min: 0.5, max: 2 }, // Time between two earthquakes, in seconds
		dropsDelay: { min: 0.5, max: 3 }, // Time between the appearance of droplets
		allowNewCracks: true,
		waterCapacity: 5,
		treesEnabled: true,
		extendDelay: 5,
		extendProbability: 0.4,
	}
];
