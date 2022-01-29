export type Mask = (0 | 1)[][];

// Returns a 2D mask of size [(size + 1) × (size + 1)] that represents a circle
// of diameter [size]
export const generateWorldMask = (size: number): Mask => {
	const radius = size / 2;
	const center = size / 2;
	const result: Mask = [];
	for (let i = 0; i < size + 1; i++) {
		result[i] = [];
		for (let j = 0; j < size + 1; j++) {
			const distance = (j - center) * (j - center) + (i - center) * (i - center);
			result[i][j] = distance < radius * radius ? 1 : 0;
		}
	}
	return result;
};

const makeTileDataFromMask = (mask: Mask, tiles: {[key: string]: number}) => {
	const result: number[][] = [];
	for (let y = 0; y < mask.length - 1; y++) {
		result[y] = [];
		for (let x = 0; x < mask[0].length - 1; x++) {
			let maskNW = mask[y][x];
			let maskNE = mask[y][x + 1];
			let maskSE = mask[y + 1][x + 1];
			let maskSW = mask[y + 1][x];
			let value = `${maskNW}${maskNE}${maskSE}${maskSW}`;
			let tile = tiles[value];
			result[y][x] = tile;
		}
	}
	return result;
};
