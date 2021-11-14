export type MaybeRandomNumber = number | {min: number, max: number};

export const pick = (array: any[]) => (
	array[Math.floor(Math.random() * array.length)]
);

export const random = (value?: MaybeRandomNumber) => {
	if (typeof value == "number")
		return value;
	else if (value)
		return (value.min + Math.random() * (value.max - value.min));
	else
		return 0;
}

export type Direction8 = ("N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW");
export const dPosToDirection8 = (dy: number, dx: number) : Direction8 => {
	const angle = (Math.atan2(dy, dx) + Math.PI) * 180 / Math.PI;
	const directionIndex = Math.round(angle / 45);
	const table: Direction8[] = ["W", "NW", "N", "NE", "E", "SE", "S", "SW", "W"];
	return table[directionIndex];
};

export type Position = {x: number, y: number};
export type Direction = ("" | "Right" | "Left" | "Up" | "Down");
export type Direction4 = ("N" | "S" | "W" | "E");
export type milliseconds = number;

export const partialDistance = ({from, to, direction}: {from: Position, to: Position, direction: Direction4}): number => {
    switch (direction) {
        case "N":
            return (from.y - to.y);
        case "S":
            return (to.y - from.y);
        case "W":
            return (from.x - to.x);
        case "E":
            return (to.x - from.x);
    }
}

export const move = ({from, to, direction, distance}: {from: Position, to: Position, direction: Direction4, distance: number}): Position => {
    switch (direction) {
        case "N": {
            const newY = Math.max(from.y - distance, to.y);
            return {x: from.x, y: newY};
        }
        case "S": {
            const newY = Math.min(from.y + distance, to.y);
            return {x: from.x, y: newY};
        }
        case "W": {
            const newX = Math.max(from.x - distance, to.x);
            return {x: newX, y: from.y};
        }
        case "E": {
            const newX = Math.min(from.x + distance, to.x);
            return {x: newX, y: from.y};
        }
    }
}

export const findNewDirection = ({from, to, direction}: {from: Position, to: Position, direction: Direction4}): Direction4 => {
    switch (direction) {
        case "N":
            if (partialDistance({from, to, direction: "E"}) > 0)
                return "E";
            else
                return "W";
        case "S":
            if (partialDistance({from, to, direction: "W"}) > 0)
                return "W";
            else
                return "E";
        case "W":
            if (partialDistance({from, to, direction: "N"}) > 0)
                return "N";
            else
                return "S";
        case "E":
            if (partialDistance({from, to, direction: "S"}) > 0)
                return "S";
            else
                return "N";
    }
}

type AnimationEntry = {
    key: string,
    anim: Phaser.Types.Animations.GenerateFrameNames,
};

export type AnimationEntries = {
    key: string,
    repeat: number,
    entries: AnimationEntry[];
}
