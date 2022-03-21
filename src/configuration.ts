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
export const playerSpeed = [6, 7, 8]; // 6, 7, 8

// Speed of the demon, in tiles/second
export const demonSpeed = 4;

// Time after which a droplet will disappear
export const dropletTimeout = 15;

// Time it takes to heal a crack, in seconds
export const crackResistance = [1.2, 1, 0.8];

// Time it takes to heal a tree, in seconds
export const treeResistance = [1.2, 1, 0.8];

// Time it takes to kill a demon, in seconds
export const demonResistance = [2.2, 2, 1.8];

// Probability that a crack will widen instead of extending (if possible)
export const widenProbability = 0.7;

export const crackHitboxSize = 14;
export const introGuideHitboxSize = 18;
export const dropletHitboxSize = 12;

// Level specific configurations

export type LevelConfiguration = {
	worldSize: number,
	maxTrees?: number,
	initialNumberOfCracks: number,
	crackDelay: MaybeRandomNumber, // Time between two earthquakes, in seconds
	dropsDelay: MaybeRandomNumber, // Time between the appearance of droplets
	demonDelay: MaybeRandomNumber, // Time between the appearance of demons
	crackMaxLength?: number,
	allowNewCracks?: boolean,
	maxDemons: number,
	waterCapacity: number,
	nextWaterCapacity: number,
	skin: number,
	upgradeSkin: boolean,
}

export const levels: LevelConfiguration[] = [
	{ // Level 1
		worldSize: 10,
		maxTrees: 4,
		initialNumberOfCracks: 0,
		crackDelay: Infinity,
		dropsDelay: Infinity,
		demonDelay: Infinity,
		allowNewCracks: false,
		maxDemons: 0,
		waterCapacity: 4,
		nextWaterCapacity: 5,
		skin: 1,
		upgradeSkin: false,

	}, { // Level 2
		worldSize: 14,
		initialNumberOfCracks: 2,
		crackDelay: {min: 10, max: 15},
		dropsDelay: {min: 2, max: 3},
		demonDelay: Infinity,
		allowNewCracks: true,
		maxDemons: 0,
		waterCapacity: 5,
		nextWaterCapacity: 5,
		skin: 1,
		upgradeSkin: true,

	}, { // Level 3
		worldSize: 16,
		initialNumberOfCracks: 5, // 3 including one big
		crackDelay: { min: 5, max: 10 },
		dropsDelay: { min: 2, max: 3 },
		demonDelay: 10,
		allowNewCracks: true,
		maxDemons: 1,
		waterCapacity: 5,
		nextWaterCapacity: 6,
		skin: 2,
		upgradeSkin: false,

	}, { // Level 4
		worldSize: 18,
		initialNumberOfCracks: 5,
		crackDelay: { min: 2.5, max: 5 },
		dropsDelay: { min: 2, max: 3 },
		demonDelay: 7,
		allowNewCracks: true,
		maxDemons: 2,
		waterCapacity: 6,
		nextWaterCapacity: 6,
		skin: 2,
		upgradeSkin: true,

	}, { // Level 5
		worldSize: 21,
		initialNumberOfCracks: 5,
		crackDelay: { min: 1.5, max: 3 },
		dropsDelay: { min: 2, max: 3 },
		demonDelay: 5,
		allowNewCracks: true,
		maxDemons: 4,
		waterCapacity: 6,
		nextWaterCapacity: 7,
		skin: 3,
		upgradeSkin: false,

	}, { // Level 6
		worldSize: 24,
		initialNumberOfCracks: 5,
		crackDelay: { min: 1, max: 2 },
		dropsDelay: { min: 2, max: 3 },
		demonDelay: 3,
		allowNewCracks: true,
		maxDemons: 6,
		waterCapacity: 7,
		nextWaterCapacity: 7,
		skin: 3,
		upgradeSkin: false,
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
	smoke: counter++,
}
