import {generateWorldMask} from "./Masks";
import {pick} from "./utils";

export type TreePosition = {i: number, j: number, size: "small" | "big"};

const isUseful = (worldSize: number, tree: TreePosition, trees: TreePosition[]) => {
	const mask = generateWorldMask(worldSize);
	for (const tree of trees) {
		const {i, j, size: treeSize} = tree;
		const size = {
			"small": 2.5,
			"big": 3.5,
		}[treeSize];
		for (let i2 = 0; i2 < mask.length; i2++) {
			for (let j2 = 0; j2 < mask[0].length; j2++) {
				const di = Math.abs(i2 - i);
				const dj = Math.abs(j2 - j);
				if (Math.pow(di, 2) + Math.pow(dj, 2) < size * size)
					mask[i2][j2] = 0;
			}
		}
	}

	const size = {
		"small": 2.5,
		"big": 3.5,
	}[tree.size];

	return (mask[tree.i][tree.j] == 1 && !trees.some(other => Math.pow(other.i - tree.i, 2) + Math.pow(other.j - tree.j, 2) < size * size));
};

export const generateTreePositions = (size: number): TreePosition[] => {
	const mask = generateWorldMask(size);

	let candidatesForAddition: TreePosition[] = mask.flatMap((line, i) => (
		line.flatMap((x, j) => (
			x == 1 ? [{i, j, size: "small"}, {i, j, size: "big"}] : []
		))
	));
	const positions: TreePosition[] = [];

	// return candidatesForAddition;
	while (candidatesForAddition.length >= 1) {
		const treeToAdd = pick(candidatesForAddition);
		positions.push(treeToAdd);
		candidatesForAddition = candidatesForAddition.filter(tree => isUseful(size, tree, positions));
	}

	return positions;
}
