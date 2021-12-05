/*
 * Configuration variables
 */

import {MaybeRandomNumber} from "./utils";

// Size (in pixels) of one tile
export const tileSize = 24;

// How many times should the tiles be scaled up
export const tileScaleFactor = 3;

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

// Speed of the robot, in tiles/second
export const playerSpeed = 5;

// Time after which a droplet will disappear
export const dropletTimeout = 15;

// Time it takes to heal a crack, in seconds
export const crackResistance = 1;

// Probability that a crack will widen instead of extending (if possible)
export const widenProbability = 0.9;

export const crackHitboxSize = 14;
export const introGuideHitboxSize = 18;
export const dropletHitboxSize = 12;

// Level specific configurations

export type LevelConfiguration = {
	worldSize: number,
	initialNumberOfCracks: number,
	crackDelay: MaybeRandomNumber, // Time between two earthquakes, in seconds
	waterCapacity: number,
	dropsDelay: MaybeRandomNumber, // Time between the appearance of droplets
	demonDelay: MaybeRandomNumber, // Time between the appearance of demons
	crackMaxLength?: number,
	allowNewCracks?: boolean,
	extendDelay: number,
	extendProbability: number,
	treePositions: {i: number, j: number, size: "small" | "big", treeId?: number, status?: string}[],
}

export const levels: LevelConfiguration[] = [
	{ // Only trees
		worldSize: 10,
		initialNumberOfCracks: 0,
		crackDelay: Infinity,
		dropsDelay: Infinity,
		demonDelay: 10,
		allowNewCracks: false,
		waterCapacity: 5,
		extendDelay: 1,
		extendProbability: 0.5,
		treePositions: [],
	}, { // First crack
		worldSize: 15,
		initialNumberOfCracks: 1,
		crackDelay: Infinity,
		dropsDelay: Infinity,
		demonDelay: 10,
		waterCapacity: 5,
		extendDelay: 1,
		extendProbability: 0.5,
		treePositions: [],
	}, { // Many cracks and droplets
		worldSize: 20,
		initialNumberOfCracks: 10,
		crackDelay: Infinity,
		dropsDelay: { min: 2, max: 3 },
		demonDelay: 10,
		waterCapacity: 5,
		extendDelay: 1,
		extendProbability: 0.5,
		treePositions: [],
	}, { // Cracks are now extending
		worldSize: 25,
		initialNumberOfCracks: 2,
		crackDelay: { min: 2, max: 5 },
		dropsDelay: { min: 1, max: 2 },
		demonDelay: 10,
		waterCapacity: 5,
		extendDelay: 1,
		extendProbability: 0.5,
		treePositions: [],
	}, { // Cracks are extending faster
		worldSize: 30,
		initialNumberOfCracks: 4,
		crackDelay: { min: 0.5, max: 2 },
		dropsDelay: { min: 1, max: 2 },
		demonDelay: 10,
		waterCapacity: 5,
		extendDelay: 1,
		extendProbability: 0.5,
		treePositions: [],
	}, { // Demon
		worldSize: 25,
		initialNumberOfCracks: 1,
		crackDelay: { min: 2, max: 4 },
		dropsDelay: { min: 1, max: 2 },
		demonDelay: 10,
		waterCapacity: 5,
		extendDelay: Infinity,
		extendProbability: 0.5,
		allowNewCracks: false,
		treePositions: (
			[0, 4, 8, 12, 16, 20, 24].map(i => (
				[0, 4, 8, 12, 16, 20, 24].map(j => (
					{i, j, size: (Math.random() < 0.5 ? "small" : "big") as "small" | "big"}
				))
			)).flat()
		)
		// treePositions: [
		// 	{i: 12, j: 12, size: "small"},
		// 	{i: 16, j: 12, size: "big"},
		// 	{i: 12, j: 16, size: "big"},
		// 	{i: 16, j: 16, size: "small"},
		// ]
	}
];

let counter = 0;
export const zIndex = {
	tree: counter++,
	crack: counter++,
	droplet: counter++,
	demon: counter++,
	target: counter++,
	laser: counter++,
	player: counter++,
	npc: counter++,
	levelComplete: counter++,
}


// export const levels: LevelConfiguration[] = [
// 	{
// 	}, {
// 		numberOfCracks: 1,
// 		dropsDelay: 0.5,
// 	}, {
// 		numberOfCracks: 3,
// 		crackDelay: { min: 3, max: 5 },
// 		crackMaxLength: 5,
// 		dropsDelay: { min: 1, max: 3 },
// 		waterCapacity: 5,
// 	}, {
// 		numberOfCracks: 4,
// 		crackDelay: { min: 2, max: 5 },
// 		dropsDelay: { min: 0.5, max: 1.5 },
// 		waterCapacity: 5,
// 	}, {
// 		numberOfCracks: 1,
// 		crackDelay: { min: 0.5, max: 2 },
// 		dropsDelay: { min: 0.5, max: 3 },
// 		allowNewCracks: true,
// 		waterCapacity: 5,
// 		extendDelay: 5,
// 		extendProbability: 0.4,
// 		treesEnabled: true,
// 	}
// ];
