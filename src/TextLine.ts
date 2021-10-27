import * as Phaser from "phaser";

const charsInFont = "ABCDEFGHIJKLMNOPQRSTUVWXYZ.:,;°×!?' ";

// newTextLine
export default (scene: Phaser.Scene, x: number, y: number, text: string) => {
	const letters = [];
	let currentX = x;
	[...text].forEach(letter => {
		const frame = charsInFont.indexOf(letter.toUpperCase());
		if (frame < 0) {
			// Unknown character
			currentX += 6;
		} else {
			letters.push(scene.add.image(currentX, y, "Font", frame));
			currentX += 8;
		}
	});

	const destroy = () => letters.forEach(letter => letter.destroy())

	return { destroy };
}
