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
	{type: "none"}
	| {type: "point", t: number, u: number}
	| {type: "segment"}
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
			return {type: "none"};
		}

		// We pass by a side of the wall, only way to get "constraints: 2"
		if (Math.abs(t) < EPSILON) t = 0;
		if (Math.abs(t - 1) < EPSILON) t = 1;
		if (Math.abs(u) < EPSILON) u = 0;
		if (Math.abs(u - 1) < EPSILON) u = 1;

		return {type: "point", t, u};
	} else {
		// Now cross is approximately 0, so we are parallel to the wall
		if (Math.abs(cross1) > EPSILON || Math.abs(cross2) > EPSILON) {
			// We are parallel to the wall, but not colinear
			return {type: "none"};
		}

		const lengthSquared = beta1.x * beta1.x + beta1.y * beta1.y;

		const gamma = {x: wall2.to.x - wall1.from.x, y: wall2.to.y - wall2.from.y};
		const p = (alpha.x * beta1.x + alpha.y * beta1.y) / lengthSquared;
		const q = (gamma.x * beta1.x + gamma.y * beta1.y) / lengthSquared;
		if (p < -EPSILON && q < -EPSILON) {
			return {type: "none"};
		} else if (p > 1 + EPSILON && q > 1 + EPSILON) {
			return {type: "none"};
		} else if (p < -EPSILON && Math.abs(q) < EPSILON) {
			return {type: "point", t: 1, u: 0};
		} else if (Math.abs(p) < EPSILON && q < -EPSILON) {
			return {type: "point", t: 0, u: 0};
		} else if (p > 1 + EPSILON && Math.abs(q - 1) < EPSILON) {
			return {type: "point", t: 1, u: 1};
		} else if (Math.abs(p - 1) < EPSILON && q > 1 + EPSILON) {
			return {type: "point", t: 0, u: 1};
		} else {
			return {type: "segment"};
		}
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

const subdivide = (polygon: Polygon, cut: Segment): Polygon => (
	polygon.flatMap(segment => {
		const intersection = findIntersection(cut, segment);
		if (intersection.type == "point") {
			return cutWall(segment, intersection.u);
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
	const strippedPolygon1 = newPolygon1.filter(side => projectOutside(middlePoint(side), polygon2).type == "outside");
	const strippedPolygon2 = newPolygon2.filter(side => projectOutside(middlePoint(side), polygon1).type == "outside");
	debugger;
	return [...strippedPolygon1, ...strippedPolygon2];
};

export const combineAllPolygons = (polygons: Polygon[]): Polygon => (
	polygons.reduce(combinePolygons)
)

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
