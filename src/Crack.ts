import * as Conf from "./configuration";
import {pick, Direction, Position} from "./utils";
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

const rotateDxDy = ({dx, dy}: {dx: number, dy: number}, rotation: number) => {
	return [
		{ dx, dy },
		{ dx: -dy, dy: dx },
		{ dx: -dx, dy: -dy },
		{ dx: dy, dy: -dx },
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
	fromSize: number;
	to: Direction;
	toSize: number;
	pivotX: number;
	pivotY: number;
	flipX?: boolean;
};

const initialCrackTilesData: CrackTileData[] = [
	// { tile: 0, dx: 0, dy: 0, from: "", fromSize: 0, to: "Right", toSize: 1, pivotX: -1, pivotY: -0.5 },
	{ tile: 1, dx: 2, dy: -1, from: "Right", fromSize: 1, to: "Right", toSize: 1, pivotX: 1, pivotY: -0.5 },
	{ tile: 2, dx: 2, dy: 1, from: "Right", fromSize: 1, to: "Right", toSize: 2, pivotX: 1, pivotY: 0.5 },
	{ tile: 3, dx: 2, dy: -1, from: "Right", fromSize: 2, to: "Right", toSize: 2, pivotX: 1, pivotY: -0.5 },
	{ tile: 4, dx: 2, dy: 1, from: "Right", fromSize: 2, to: "Right", toSize: 3, pivotX: 1, pivotY: 0.5 },
	{ tile: 5, dx: 2, dy: -1, from: "Right", fromSize: 3, to: "Right", toSize: 3, pivotX: 1, pivotY: -0.5 },

	// { tile: 6, dx: 0, dy: 0, from: "", fromSize: 0, to: "Right", toSize: 1, pivotX: -1, pivotY: 0.5 },
	{ tile: 7, dx: 2, dy: 1, from: "Right", fromSize: 1, to: "Right", toSize: 1, pivotX: 1, pivotY: 0.5 },
	{ tile: 8, dx: 2, dy: -1, from: "Right", fromSize: 1, to: "Right", toSize: 2, pivotX: 1, pivotY: -0.5 },
	{ tile: 9, dx: 2, dy: 1, from: "Right", fromSize: 2, to: "Right", toSize: 2, pivotX: 1, pivotY: 0.5 },
	{ tile: 10, dx: 2, dy: -1, from: "Right", fromSize: 2, to: "Right", toSize: 3, pivotX: 1, pivotY: -0.5 },
	{ tile: 11, dx: 2, dy: 1, from: "Right", fromSize: 3, to: "Right", toSize: 3, pivotX: 1, pivotY: 0.5 },

	{ tile: 12, dx: 0, dy: 0, from: "", fromSize: 0, to: "Right", toSize: 2, pivotX: -1, pivotY: -0.5 },
	{ tile: 13, dx: 0, dy: 0, from: "", fromSize: 0, to: "Right", toSize: 3, pivotX: -1, pivotY: -0.5 },
	{ tile: 14, dx: 2, dy: -1, from: "Right", fromSize: 1, to: "Right", toSize: 3, pivotX: 1, pivotY: -0.5 },

	{ tile: 15, dx: 0, dy: 0, from: "", fromSize: 0, to: "Right", toSize: 2, pivotX: -1, pivotY: 0.5 },
	{ tile: 16, dx: 0, dy: 0, from: "", fromSize: 0, to: "Right", toSize: 3, pivotX: -1, pivotY: 0.5 },
	{ tile: 17, dx: 2, dy: 1, from: "Right", fromSize: 1, to: "Right", toSize: 3, pivotX: 1, pivotY: 0.5 },

	{ tile: 18, dx: 0, dy: 0, from: "", fromSize: 0, to: "Right", toSize: 1, pivotX: -1, pivotY: -0.5 },
	{ tile: 19, dx: 0, dy: 0, from: "Right", fromSize: 1, to: "", toSize: 0, pivotX: 1, pivotY: -0.5 },
	{ tile: 20, dx: 0, dy: 0, from: "", fromSize: 0, to: "Right", toSize: 1, pivotX: -1, pivotY: -0.5 },
	{ tile: 21, dx: 0, dy: 0, from: "Right", fromSize: 1, to: "", toSize: 0, pivotX: 1, pivotY: -0.5 },
	{ tile: 22, dx: 0, dy: 0, from: "", fromSize: 0, to: "Right", toSize: 1, pivotX: -1, pivotY: -0.5 },
	{ tile: 23, dx: 0, dy: 0, from: "Right", fromSize: 1, to: "", toSize: 0, pivotX: 1, pivotY: -0.5 },
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
type FinalCrackTileData = CrackTileData & {
	rotation: number,
};
const finalCrackTilesData: FinalCrackTileData[] = [];
intermediateCrackTilesData.forEach(({ tile, dx, dy, from, fromSize, to, toSize, pivotX, pivotY, flipX }) => {
	[0, 3].forEach((rotation: number) => {
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

export type CrackPoint = {x: number, y: number, direction: Direction, size: number};
type CrackSegmentData = {x: number, y: number, tile: number, flipX: boolean, rotation: number};

export default class Crack {
	crackPoints: CrackPoint[];
	scene: MainScene;
	crackSegments: Phaser.GameObjects.Sprite[] = [];
	crackSegmentData: CrackSegmentData[] = [];

	constructor({scene, x = 0, y = 0, crackPoints = undefined}: {scene: MainScene, x?: number, y?: number, crackPoints?: CrackPoint[]}) {
		this.scene = scene;
		this.crackPoints = crackPoints || this.generateRandomCrack(1, {x, y});
		this.regenerateAll();
	}

	destroy() {
		this.crackSegments.forEach(s => {
			if (s.anims.isPlaying) {
				s.once("animationcomplete", () => {
					s.destroy();
				})
			} else {
				s.destroy();
			}
		});
	}

	regenerateAll() {
		this.crackSegmentData = this.generateCrackSegmentData(this.crackPoints);

		this.destroy();
		this.crackSegments = this.generateCrackSegments(this.crackSegmentData);
	}

	extend() {
		const canBeWidened = (crackPoint: CrackPoint, _i: number, _array: CrackPoint[]) => (
			crackPoint.size <= 2
		);
		// const canBeWidened = (crackPoint: CrackPoint, i: number, array: CrackPoint[]) => (
		// 	i > 0 && i < array.length - 1 && crackPoint.size <= array[i - 1].size && crackPoint.size <= array[i + 1].size && crackPoint.size <= 2
		// );

		const pointsToWiden = this.crackPoints.filter(canBeWidened);
		const target = this.scene.pointTargeted;
		if (pointsToWiden.length > 0 && Math.random() < Conf.widenProbability) {
			const pointToWiden = pick(pointsToWiden);
			if (pointToWiden == this.scene.pointTargeted)
				return false;
			pointToWiden.size++;
		} else if (Math.random() < 0.5) {
			const lastPoint = this.crackPoints[this.crackPoints.length - 1];
			if (target && lastPoint.x == target.x && lastPoint.y == target.y)
				return false;
			const tile = pick(finalCrackTilesData.filter(data => data.from == lastPoint.direction && data.toSize == 1));
			const x = lastPoint.x + tile.dx * Conf.tileSize;
			const y = lastPoint.y + tile.dy * Conf.tileSize;
			if (this.scene.isCrackAllowedAt([0.25, 0.5, 0.75, 1, 1.25, 1.5].map(k => ({x: lastPoint.x + tile.dx * k * Conf.tileSize, y: lastPoint.y + tile.dy * k * Conf.tileSize})), this)) {
				this.crackPoints.push({
					x,
					y,
					direction: tile.to,
					size: 1,
				});
			} else return false;
		} else {
			const firstPoint = this.crackPoints[0];
			if (target && firstPoint.x == target.x && firstPoint.y == target.y)
				return false;
			const tile = pick(finalCrackTilesData.filter(data => data.fromSize == 1 && data.to == firstPoint.direction));
			const x = firstPoint.x - tile.dx * Conf.tileSize;
			const y = firstPoint.y - tile.dy * Conf.tileSize;
			if (this.scene.isCrackAllowedAt([0.25, 0.5, 0.75, 1, 1.25, 1.5].map(k => ({x: firstPoint.x - tile.dx * k * Conf.tileSize, y: firstPoint.y - tile.dy * k * Conf.tileSize})), this))  {
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

	generateRandomCrack(length: number, {x: initialX, y: initialY}: Position) : CrackPoint[] {
		const result = [];
		let direction : Direction = "";
		let x = initialX;
		let y = initialY;

		for (let i = 0; i < length; i++) {
			const tile = pick(finalCrackTilesData.filter(data => data.from == direction && data.to !== ""));
			x += tile.dx * Conf.tileSize;
			y += tile.dy * Conf.tileSize;
			direction = tile.to;
			result.push({x, y, direction, size: 1 as 1});
		}

		return result;
	}

	generateCrackSegmentData(crackPoints: CrackPoint[]): CrackSegmentData[] {
		const result = [];
		const pick = (array: any[]) => array[Math.floor(Math.random() * array.length)];

		const firstTile = pick(finalCrackTilesData.filter(data => data.from == "" && data.to == crackPoints[0].direction && data.toSize == crackPoints[0].size));

		result.push({
			x: crackPoints[0].x + firstTile.pivotX * Conf.tileSize,
			y: crackPoints[0].y + firstTile.pivotY * Conf.tileSize,
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
				Math.abs(data.dx * Conf.tileSize - dx) < 0.1 && Math.abs(data.dy * Conf.tileSize - dy) < 0.1
					&& data.from == from && data.fromSize == fromSize
					&& data.to == to && data.toSize == toSize
			)));
			result.push({
				x: previousCrackPoint.x + tileData.pivotX * Conf.tileSize,
				y: previousCrackPoint.y + tileData.pivotY * Conf.tileSize,
				tile: tileData.tile,
				flipX: tileData.flipX,
				rotation: tileData.rotation,
			});
		});

		const lastPoint = crackPoints[crackPoints.length - 1];
		const lastTile = pick(finalCrackTilesData.filter(data => (
			data.from == lastPoint.direction && data.fromSize == lastPoint.size && data.to == "" && data.tile !== firstTile.tile
		)));
		result.push({
			x: lastPoint.x + lastTile.pivotX * Conf.tileSize,
			y: lastPoint.y + lastTile.pivotY * Conf.tileSize,
			tile: lastTile.tile,
			flipX: lastTile.flipX,
			rotation: lastTile.rotation,
		});

		return result;
	}

	generateCrackSegments(crackSegmentData: CrackSegmentData[]) {
		const result: Phaser.GameObjects.Sprite[] = [];
		crackSegmentData.forEach(({x, y, tile, flipX = false, rotation = 0}) => {
			const segment = this.scene.add.sprite(
				x,
				y,
				"CracksTiles",
				tile,
			).setFlipX(flipX).setAngle(rotation * 90).setDepth(Conf.zIndex.crack);
			result.push(segment);
		});
		return result;
	}

	distanceToPlayer({x, y}: Position) {
		const dx = Math.abs(x - this.scene.player.x);
		const dy = Math.abs(y - this.scene.player.y);
		return (dx + dy);
	}

	isCloseToPlayer({x, y}: Position) {
		const dx = Math.abs(x - this.scene.player.x);
		const dy = Math.abs(y - this.scene.player.y);
		return (dx + dy < 2 * Conf.tileSize);
	}

	update(time: number, delta: number) {
		this.crackSegments.forEach(cs => cs.update(time, delta));
	}

	getWalls() {
		const walls = [];

		const widths = [0, 0.3, 0.45, 0.6];
		const lengths = [0, 1, 1.2, 1.4];

		// Initial walls
		{
			let {x, y, direction, size} = this.crackPoints[0];
			const width = widths[size];
			const length = lengths[size];
			x /= 24;
			y /= 24;
			if (direction == "Right") {
				walls.push({
					from: {x, y: y + width},
					to:   {x: x - length, y: y + width},
				}, {
					from: {x: x - length, y: y + width},
					to:   {x: x - length, y: y - width},
				}, {
					from: {x: x - length, y: y - width},
					to:   {x, y: y - width},
				})
			} else {
				walls.push({
					from: {x: x + width, y},
					to:   {x: x + width, y: y + length},
				}, {
					from: {x: x + width, y: y + length},
					to:   {x: x - width, y: y + length},
				}, {
					from: {x: x - width, y: y + length},
					to:   {x: x - width, y},
				})
			}
		}

		// Intermediate walls
		this.crackPoints.forEach((q, i) => {
			if (i == 0)
				return;
			const p = this.crackPoints[i - 1];
			const px = p.x / 24;
			const py = p.y / 24;
			const qx = q.x / 24;
			const qy = q.y / 24;
			const widthP = widths[p.size];
			const widthQ = widths[q.size];
			if (p.direction == "Right") {
				walls.push({
					from: {x: qx, y: qy + widthQ},
					to: {x: px, y: py + widthP}
				}, {
					from: {x: px, y: py - widthP},
					to: {x: qx, y: qy - widthQ},
				})
			} else {
				walls.push({
					from: {x: px - widthP, y: py},
					to: {x: qx - widthQ, y: qy},
				}, {
					from: {x: qx + widthQ, y: qy},
					to: {x: px + widthP, y: py},
				})
			}
		});

		// Final walls
		{
			let {x, y, direction, size} = this.crackPoints[this.crackPoints.length - 1];
			const width = widths[size];
			const length = lengths[size];
			x /= 24;
			y /= 24;
			if (direction == "Right") {
				walls.push({
					from: {x, y: y - width},
					to:   {x: x + length, y: y - width},
				}, {
					from: {x: x + length, y: y - width},
					to:   {x: x + length, y: y + width},
				}, {
					from: {x: x + length, y: y + width},
					to:   {x, y: y + width},
				})
			} else {
				walls.push({
					from: {x: x - width, y},
					to:   {x: x - width, y: y - length},
				}, {
					from: {x: x - width, y: y - length},
					to:   {x: x + width, y: y - length},
				}, {
					from: {x: x + width, y: y - length},
					to:   {x: x + width, y},
				})
			}
		}

		return walls;
	}
}

const animationPerTile : {[key: string] : string} = {
	18: "Left1",
	19: "Right1",
	20: "Left2",
	21: "Right2",
	22: "Left3",
	23: "Right3",
}

export const healAt = (scene: MainScene, crack: Crack, crackPoint: CrackPoint) => {
	const crackPoints = [...crack.crackPoints];
	const index = crackPoints.indexOf(crackPoint);

	if (crackPoint.size > 1) {
		crackPoint.size--;
		return [new Crack({scene, crackPoints})];
	} else if (crackPoints.length == 1) {
		crack.crackSegments.forEach(segment => {
			if (!animationPerTile[segment.frame.name]) {
				debugger;
			}
			segment.play("CracksSingleEnd" + animationPerTile[segment.frame.name]);
			if (crackPoints[0].direction == "Right") {
				scene.add.sprite(crackPoints[0].x, crackPoints[0].y, "CracksSmokeEndHorizontal").setOrigin(0.5, 0.75).setDepth(Conf.zIndex.smoke).play("CracksSmokeEndHorizontal");
			} else {
				scene.add.sprite(crackPoints[0].x, crackPoints[0].y, "CracksSmokeEndVertical").setAngle(-90).setOrigin(0.5, 0.25).setDepth(Conf.zIndex.smoke).play("CracksSmokeEndVertical");
			}
		});
		return [];
	} else if (index == 0) {
		return [new Crack({scene, crackPoints: crackPoints.slice(1)})];
	} else if (index == crackPoints.length - 1) {
		return [new Crack({scene, crackPoints: crackPoints.slice(0, index)})];
	} else {
		return [
			new Crack({scene, crackPoints: crackPoints.slice(0, index)}),
			new Crack({scene, crackPoints: crackPoints.slice(index + 1)}),
		];
	}
};
