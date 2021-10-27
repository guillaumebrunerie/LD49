import * as Conf from "./configuration";
import {pick, Direction} from "./utils";
import MainScene from "./MainScene";

const rotateDirection = (direction: Direction, rotation: number): Direction => {
	switch (rotation) {
		case 0:
			return direction;
		case 2:
		case 3:
			return rotateDirection(rotateDirection(direction, 1), rotation - 1);
		case 1:
			const table: Record<Direction, Direction> = {
				"": "",
				"Right": "Down",
				"Down": "Left",
				"Left": "Up",
				"Up": "Right",
			};
			return table[direction];
		default:
			throw new Error("Wrong rotation");
	}
};

const rotateDxDy = ({ dx, dy }, rotation: (0 | 1 | 2 | 3)) => {
	return [
		{ dx, dy },
		{ dx: dy, dy: -dx },
		{ dx: -dx, dy: -dy },
		{ dx: -dy, dy: dx },
	][rotation];
};

const flipXDirection = (direction: Direction): Direction => {
	const table: Record<Direction, Direction> = {
		"": "",
		"Right": "Left",
		"Left": "Right",
		"Up": "Up",
		"Down": "Down",
	};
	return table[direction];
};

const reverseDirection = (direction: Direction): Direction => {
	const table: Record<Direction, Direction> = {
		"": "",
		"Right": "Left",
		"Left": "Right",
		"Up": "Down",
		"Down": "Up",
	};
	return table[direction];
};

type CrackTileData = {
	tile: number;
	dx: number;
	dy: number;
	from: Direction;
	fromSize?: number;
	to: Direction;
	toSize?: number;
	pivotX: number;
	pivotY: number;
	flipX?: boolean;
};

const initialCrackTilesData: CrackTileData[] = [
	{ tile: 0, dx: 0, dy: 0, from: "", to: "Right", toSize: 1, pivotX: -1, pivotY: 0.5 },
	{ tile: 1, dx: 2, dy: 1, from: "Right", fromSize: 1, to: "Right", toSize: 1, pivotX: 1, pivotY: 0.5 },
	{ tile: 2, dx: 2, dy: -1, from: "Right", fromSize: 1, to: "Right", toSize: 2, pivotX: 1, pivotY: -0.5 },
	{ tile: 3, dx: 2, dy: 1, from: "Right", fromSize: 2, to: "Right", toSize: 2, pivotX: 1, pivotY: 0.5 },
	{ tile: 4, dx: 2, dy: -1, from: "Right", fromSize: 2, to: "Right", toSize: 3, pivotX: 1, pivotY: -0.5 },
	{ tile: 5, dx: 2, dy: 1, from: "Right", fromSize: 3, to: "Right", toSize: 3, pivotX: 1, pivotY: 0.5 },

	{ tile: 6, dx: 0, dy: 0, from: "", to: "Right", toSize: 1, pivotX: -1, pivotY: 0.5 },
	{ tile: 7, dx: 2, dy: -1, from: "Right", fromSize: 1, to: "Right", toSize: 1, pivotX: 1, pivotY: -0.5 },
	{ tile: 8, dx: 2, dy: 1, from: "Right", fromSize: 1, to: "Right", toSize: 2, pivotX: 1, pivotY: 0.5 },
	{ tile: 9, dx: 2, dy: -1, from: "Right", fromSize: 2, to: "Right", toSize: 2, pivotX: 1, pivotY: -0.5 },
	{ tile: 10, dx: 2, dy: 1, from: "Right", fromSize: 2, to: "Right", toSize: 3, pivotX: 1, pivotY: 0.5 },
	{ tile: 11, dx: 2, dy: -1, from: "Right", fromSize: 3, to: "Right", toSize: 3, pivotX: 1, pivotY: -0.5 },

	{ tile: 12, dx: 0, dy: 0, from: "", to: "Right", toSize: 2, pivotX: -1, pivotY: 0.5 },
	{ tile: 13, dx: 0, dy: 0, from: "", to: "Right", toSize: 3, pivotX: -1, pivotY: 0.5 },
	{ tile: 14, dx: 2, dy: 1, from: "Right", fromSize: 1, to: "Right", toSize: 3, pivotX: 1, pivotY: 0.5 },

	{ tile: 15, dx: 0, dy: 0, from: "", to: "Right", toSize: 2, pivotX: -1, pivotY: -0.5 },
	{ tile: 16, dx: 0, dy: 0, from: "", to: "Right", toSize: 3, pivotX: -1, pivotY: -0.5 },
	{ tile: 17, dx: 2, dy: -1, from: "Right", fromSize: 1, to: "Right", toSize: 3, pivotX: 1, pivotY: -0.5 },
];

// Flip horizontally and reverse the direction
const intermediateCrackTilesData: CrackTileData[] = [];
initialCrackTilesData.forEach(({ tile, dx, dy, from, fromSize, to, toSize, pivotX, pivotY }) => {
	intermediateCrackTilesData.push({ tile, dx, dy, from, fromSize, to, toSize, pivotX, pivotY });
	intermediateCrackTilesData.push({
		tile,
		dx, dy: -dy,
		from: reverseDirection(flipXDirection(to)), fromSize: toSize,
		to: reverseDirection(flipXDirection(from)), toSize: fromSize,
		pivotX: dx - pivotX,
		pivotY: pivotY - dy,
		flipX: true
	});
});

// Rotate
const finalCrackTilesData = [];
intermediateCrackTilesData.forEach(({ tile, dx, dy, from, fromSize, to, toSize, pivotX, pivotY, flipX }) => {
	[0, 3].forEach((rotation: (0 | 3)) => {
		const { dx: newDx, dy: newDy } = rotateDxDy({ dx, dy }, rotation);
		const { dx: newPivotX, dy: newPivotY } = rotateDxDy({ dx: pivotX, dy: pivotY }, rotation);
		finalCrackTilesData.push({
			tile,
			dx: newDx, dy: newDy,
			from: rotateDirection(from, rotation), fromSize,
			to: rotateDirection(to, rotation), toSize,
			pivotX: newPivotX, pivotY: newPivotY,
			flipX,
			rotation,
		});
	});
});

// const pickWeighted = (array) => {
// 	const cumulative
// 	return array[Math.floor(Math.random() * array.length)];
// };

export type CrackPoint = { x: number, y: number, direction: Direction, size: (1 | 2 | 3) };
type CrackSegmentData = { x: number, y: number, tile: number, flipX: boolean, rotation: number };

export default class Crack {
	crackPoints: CrackPoint[];
	scene: MainScene;
	crackSegments: Phaser.GameObjects.Sprite[];
	crackSegmentData: CrackSegmentData[];

	constructor({ scene, x = 0, y = 0, crackPoints = undefined }) {
		this.scene = scene;
		this.crackPoints = crackPoints || this.generateRandomCrack(1, {x, y});
		this.crackSegments = [];
		this.regenerateAll();
	}

	destroy() {
		this.crackSegments.forEach(s => s.destroy());
	}

	regenerateAll() {
		this.crackSegmentData = this.generateCrackSegmentData(this.crackPoints);

		this.crackSegments.forEach(s => s.destroy());
		this.crackSegments = this.generateCrackSegments(this.crackSegmentData);
	}

	extend() {
		const teste = (i: number, j: number) => (i < j);
        const test2 = (i: number, j: number) => (i < j);

		const canBeWidened = (crackPoint: CrackPoint, i: number, array: CrackPoint[]) => (
			i > 0 && i < array.length - 1 && crackPoint.size <= array[i - 1].size && crackPoint.size <= array[i + 1].size && crackPoint.size <= 2
		);

		const pointsToWiden = this.crackPoints.filter(canBeWidened);
		if (pointsToWiden.length > 0 && Math.random() < Conf.widenProbability) {
			const pointToWiden = pick(pointsToWiden);
			if (pointToWiden == this.scene.pointBeingHealed?.crackPoint)
				return false;
			pointToWiden.size++;
		} else if (Math.random() < 0.5) {
			const lastPoint = this.crackPoints[this.crackPoints.length - 1];
			if (lastPoint == this.scene.pointBeingHealed?.crackPoint)
				return false;
			const tile = pick(finalCrackTilesData.filter(data => data.from == lastPoint.direction && data.toSize == 1));
			const x = lastPoint.x + tile.dx;
			const y = lastPoint.y + tile.dy;
			if ([0.25, 0.5, 0.75, 1].every(k => this.scene.isValidPosition({x: lastPoint.x + tile.dx * k, y: -(lastPoint.y + tile.dy * k)}, this))) {
				this.crackPoints.push({
					x,
					y,
					direction: tile.to,
					size: 1,
				});
			} else return false;
		} else {
			const firstPoint = this.crackPoints[0];
			if (firstPoint == this.scene.pointBeingHealed?.crackPoint)
				return false;
			const tile = pick(finalCrackTilesData.filter(data => data.fromSize == 1 && data.to == firstPoint.direction));
			const x = firstPoint.x - tile.dx;
			const y = firstPoint.y - tile.dy;
			if ([0.25, 0.5, 0.75, 1].every(k => this.scene.isValidPosition({x: firstPoint.x - tile.dx * k, y: -(firstPoint.y - tile.dy * k)}, this)))  {
				this.crackPoints.unshift({
					x,
					y,
					direction: tile.from,
					size: 1,
				});
			} else return false;
		}
		this.regenerateAll();
		return true;
	}

	generateRandomCrack(length: number, {x: initialX, y: initialY}) {
		const result = [];
		let direction = "";
		let x = initialX;
		let y = initialY;

		for (let i = 0; i < length; i++) {
			const tile = pick(finalCrackTilesData.filter(data => data.from == direction && data.to !== ""));
			x += tile.dx;
			y += tile.dy;
			direction = tile.to;
			result.push({x, y, direction, size: 1});
		}

		return result;
	}

	generateCrackSegmentData(crackPoints: CrackPoint[]) {
		const result = [];

		const pick = (array: any[]) => array[0];

		const firstTile = pick(finalCrackTilesData.filter(data => data.from == "" && data.to == crackPoints[0].direction && data.toSize == crackPoints[0].size));
		result.push({
			x: crackPoints[0].x + firstTile.pivotX,
			y: crackPoints[0].y + firstTile.pivotY,
			tile: firstTile.tile,
			flipX: firstTile.flipX,
			rotation: firstTile.rotation,
		});

		crackPoints.forEach((crackPoint, index) => {
			if (index == 0) return;

			const previousCrackPoint = crackPoints[index - 1];
			const dx = crackPoint.x - previousCrackPoint.x;
			const dy = crackPoint.y - previousCrackPoint.y;
			const from = previousCrackPoint.direction;
			const fromSize = previousCrackPoint.size;
			const to = crackPoint.direction;
			const toSize = crackPoint.size;
			const tileData = pick(finalCrackTilesData.filter(data => (
				Math.abs(data.dx - dx) < 0.1 && Math.abs(data.dy - dy) < 0.1
					&& data.from == from && data.fromSize == fromSize
					&& data.to == to && data.toSize == toSize
			)));
			result.push({
				x: previousCrackPoint.x + tileData.pivotX,
				y: previousCrackPoint.y + tileData.pivotY,
				tile: tileData.tile,
				flipX: tileData.flipX,
				rotation: tileData.rotation,
			});
		});

		const lastPoint = crackPoints[crackPoints.length - 1];
		const lastTile = pick(finalCrackTilesData.filter(data => data.from == lastPoint.direction && data.fromSize == lastPoint.size && data.to == ""));
		result.push({
			x: lastPoint.x + lastTile.pivotX,
			y: lastPoint.y + lastTile.pivotY,
			tile: lastTile.tile,
			flipX: lastTile.flipX,
			rotation: lastTile.rotation,
		});

		return result;
	}

	generateCrackSegments(crackSegmentData) {
		const result = [];
		crackSegmentData.forEach(({x, y, tile, flipX = false, rotation = 0}) => {
			const segment = this.scene.add.sprite(
				x * Conf.tileSize,
				-y * Conf.tileSize,
				"CracksTiles",
				tile,
			).setFlipX(flipX).setAngle(rotation * 90);
			result.push(segment);
		});
		return result;
	}

	distanceToPlayer({x, y}) {
		const dx = Math.abs(x - this.scene.player.x);
		const dy = Math.abs(y - this.scene.player.y);
		return (dx + dy);
	}

	isCloseToPlayer({x, y}) {
		const dx = Math.abs(x - this.scene.player.x);
		const dy = Math.abs(y - this.scene.player.y);
		return (dx + dy < 2 * Conf.tileSize);
	}

	update(time: number, delta: number) {
		this.crackSegments.forEach(cs => cs.update(time, delta));
	}
}
