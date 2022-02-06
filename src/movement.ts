type Position = {x: number, y: number};
export type Segment = {from: Position, to: Position};
export type Polygon = Segment[];
type SidePosition = Position & {type: "inside" | "outside" | "border"};

const EPSILON = 0.000001;

const getDistance = (position: Position, wall: Segment): {distance: number, t: number} => {
	const delta = {x: wall.to.x - wall.from.x, y: wall.to.y - wall.from.y};
	const lengthSquared = delta.x * delta.x + delta.y * delta.y;
	const alpha = {x: position.x - wall.from.x, y: position.y - wall.from.y};
	const dotProduct = alpha.x * delta.x + alpha.y * delta.y;
	const t = dotProduct / lengthSquared;
	if (t < EPSILON) {
		const distance = Math.sqrt(alpha.x * alpha.x + alpha.y * alpha.y);
		return {distance, t: 0};
	} else if (t > 1 - EPSILON) {
		const beta = {x: position.x - wall.to.x, y: position.y - wall.to.y};
		const distance = Math.sqrt(beta.x * beta.x + beta.y * beta.y);
		return {distance, t: 1};
	} else {
		const gamma = {x: position.x - (wall.from.x + t * delta.x), y: position.y - (wall.from.y + t * delta.y)};
		const distance = Math.sqrt(gamma.x * gamma.x + gamma.y * gamma.y);
		return {distance, t};
	}
}

const findIntersection = (wall1: Segment, wall2: Segment): (
	{type: "none" | "point" | "segment", ts: number[], us: number[]}
) => {
	// Vector corresponding to the wall
	const beta1 = {x: wall1.to.x - wall1.from.x, y: wall1.to.y - wall1.from.y};
	const beta2 = {x: wall2.to.x - wall2.from.x, y: wall2.to.y - wall2.from.y};
	const alpha = {x: wall2.from.x - wall1.from.x, y: wall2.from.y - wall1.from.y};

	// To determine in which direction we go compared to the wall
	const crossB = beta1.x * beta2.y - beta1.y * beta2.x;
	const cross1 = alpha.x * beta2.y - alpha.y * beta2.x;
	const cross2 = alpha.x * beta1.y - alpha.y * beta1.x;

	if (Math.abs(crossB) > EPSILON) {
		// We are not colinear to the wall, use the regular formulas
		let t = cross1 / crossB;
		let u = cross2 / crossB;

		if (u < -EPSILON || u > 1 + EPSILON || t < -EPSILON || t > 1 + EPSILON) {
			// The movement either starts after the wall or ends before or is
			// offset to the side
			return {type: "none", ts: [], us: []};
		}

		if (Math.abs(t) < EPSILON) t = 0;
		if (Math.abs(t - 1) < EPSILON) t = 1;
		if (Math.abs(u) < EPSILON) u = 0;
		if (Math.abs(u - 1) < EPSILON) u = 1;

		return {type: "point", ts: [t], us: [u]};
	} else if (Math.abs(cross1) > EPSILON || Math.abs(cross2) > EPSILON) {
		// We are parallel to the wall, but not colinear
		return {type: "none", ts: [], us: []};
	}

	// We are colinear to the wall
	const lengthSquared = beta1.x * beta1.x + beta1.y * beta1.y;
	const length2Squared = beta2.x * beta2.x + beta2.y * beta2.y;

	const gamma = {x: wall2.to.x - wall1.from.x, y: wall2.to.y - wall2.from.y};
	const t1 = (alpha.x * beta1.x + alpha.y * beta1.y) / lengthSquared;
	const t2 = (gamma.x * beta1.x + gamma.y * beta1.y) / lengthSquared;

	if (t1 < -EPSILON && t2 < -EPSILON) {
		return {type: "none", ts: [], us: []};
	} else if (t1 > 1 + EPSILON && t2 > 1 + EPSILON) {
		return {type: "none", ts: [], us: []};
	} else if (t1 < -EPSILON && Math.abs(t2) < EPSILON) {
		return {type: "point", ts: [1], us: [0]};
	} else if (Math.abs(t1) < EPSILON && t2 < -EPSILON) {
		return {type: "point", ts: [0], us: [0]};
	} else if (t1 > 1 + EPSILON && Math.abs(t2 - 1) < EPSILON) {
		return {type: "point", ts: [1], us: [1]};
	} else if (Math.abs(t1 - 1) < EPSILON && t2 > 1 + EPSILON) {
		return {type: "point", ts: [0], us: [1]};
	} else {
		const delta = {x: wall1.from.x - wall2.from.x, y: wall1.from.y - wall2.from.y};
		const epsilon = {x: wall1.to.x - wall2.from.x, y: wall1.to.y - wall2.from.y};
		const u1 = (delta.x * beta2.x + delta.y * beta2.y) / length2Squared;
		const u2 = (epsilon.x * beta2.x + epsilon.y * beta2.y) / length2Squared;

		return {
			type: "segment",
			ts: [Math.max(0, Math.min(t1, t2)), Math.min(1, Math.max(t1, t2))],
			us: [Math.max(0, Math.min(u1, u2)), Math.min(1, Math.max(u1, u2))],
		};
	}
};

const cutWall = (wall: Segment, t: number): Segment[] => {
	if (t < EPSILON || t > 1 - EPSILON) {
		return [wall]
	} else {
		const middlePoint = {
			x: wall.from.x + t * (wall.to.x - wall.from.x),
			y: wall.from.y + t * (wall.to.y - wall.from.y),
		};
		return [
			{from: wall.from, to: middlePoint},
			{from: middlePoint, to: wall.to},
		]
	}
};

const cutWallMultiple = (wall: Segment, ts: number[]): Segment[] => (
	ts.reduce((walls, t) => walls.flatMap(wall => cutWall(wall, t)), [wall])
);

const subdivide = (polygon: Polygon, cut: Segment): Polygon => (
	polygon.flatMap(segment => {
		const intersection = findIntersection(cut, segment);
		if (intersection.type == "point") {
			return cutWallMultiple(segment, intersection.us);
		} else {
			return [segment];
		}
	})
);

const middlePoint = (segment: Segment): Position => ({
	x: (segment.from.x + segment.to.x) / 2,
	y: (segment.from.y + segment.to.y) / 2,
});

const combinePolygons = (polygon1: Polygon, polygon2: Polygon): Polygon => {
	const newPolygon1 = polygon2.reduce(subdivide, polygon1);
	const newPolygon2 = polygon1.reduce(subdivide, polygon2);
	const strippedPolygon1 = newPolygon1.filter(side => projectOutside(middlePoint(side), polygon2).type !== "inside");
	const strippedPolygon2 = newPolygon2.filter(side => projectOutside(middlePoint(side), polygon1).type == "outside");
	return [...strippedPolygon1, ...strippedPolygon2];
};

export const combineAllPolygons = (polygons: Polygon[]): Polygon => (
	polygons.reduce(combinePolygons)
);

/*
 * If the position is outside the walls, return it, otherwise project it to the
 * closest position on the walls.
 */
export const projectOutside = (position: Position, walls: Polygon): SidePosition => {
	const nearestBorder = walls.map(wall => ({wall, ...getDistance(position, wall)}))
		  .sort((x, y) => x.distance - y.distance)[0];
	const {wall, distance, t} = nearestBorder;
	const point: SidePosition = {
		type: "inside",
		x: wall.from.x + t * (wall.to.x - wall.from.x),
		y: wall.from.y + t * (wall.to.y - wall.from.y),
	};
	const originalPosition: SidePosition = {type: "outside", ...position};
	if (distance < EPSILON) {
		// We are on the wall
		return {...point, type: "border"};
	} else if (t > EPSILON && t < 1 - EPSILON) {
		// We will snap back to a wall
		const delta = {x: wall.to.x - wall.from.x, y: wall.to.y - wall.from.y};
		const alpha = {x: position.x - wall.from.x, y: position.y - wall.from.y};
		const cross = delta.x * alpha.y - delta.y * alpha.x;
		return (cross > 0) ? point : originalPosition;
	} else {
		// We will snap back to a corner
		const wall1 = walls.find(w => Math.abs(w.to.x - point.x) < EPSILON && Math.abs(w.to.y - point.y) < EPSILON);
		const wall2 = walls.find(w => Math.abs(w.from.x - point.x) < EPSILON && Math.abs(w.from.y - point.y) < EPSILON);
		if (!wall1 || !wall2) {
			console.error("Can’t find wall!", walls, position, point)
			return point;
		}
		const alpha1 = Math.atan2(wall1.from.y - wall1.to.y, wall1.from.x - wall1.to.x);
		const alpha2 = Math.atan2(wall2.to.y - wall2.from.y, wall2.to.x - wall2.from.x);
		const alpha = Math.atan2(position.y - point.y, position.x - point.x);
		const inside = (
			alpha1 < alpha2
			? (alpha < alpha1 || alpha > alpha2)
			: (alpha < alpha1 && alpha > alpha2)
		);
		return inside ? point : originalPosition;
	}
};
