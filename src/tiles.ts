type AnimationEntry = [string, Phaser.Types.Animations.GenerateFrameNames];

type AnimationEntries = AnimationEntry[];

export const playerWalkAnimations: AnimationEntries = [
	["W", {frames: [13, 14, 15]}],
	["E", {frames: [26, 27, 28]}],
	["N", {frames: [65, 66, 67]}],
	["S", {frames: [0, 1, 2]}],
	["NW", {frames: [52, 53, 54]}],
	["NE", {frames: [56, 57, 58]}],
	["SW", {frames: [39, 40, 41]}],
	["SE", {frames: [43, 44, 45]}],
];

export const laserAnimations: AnimationEntries = [
	["W", {start: 0, end: 2}],
	["E", {start: 3, end: 5}],
	["N", {start: 6, end: 8}],
	["S", {start: 9, end: 11}],
	["NW", {start: 13, end: 15}],
	["NE", {start: 16, end: 18}],
	["SW", {start: 19, end: 21}],
	["SE", {start: 22, end: 24}],
	["Particles", {start: 26, end: 29}],
];

export const idleFrame = Object.fromEntries(playerWalkAnimations.map(([direction, anim]) => [direction, anim.frames[0]]));
export const firingFrame = Object.fromEntries(playerWalkAnimations.map(([direction, anim]) => [direction, anim.frames[0] + 3]));
firingFrame.E++;
firingFrame.W++;
