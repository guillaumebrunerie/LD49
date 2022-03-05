import * as Phaser from "phaser";

const charsInFont = "ABCDEFGHIJKLMNOPQRSTUVWXYZ.:,;°×!?' ";

const letterDelay = 12;

// newTextLine
export default (scene: Phaser.Scene, x: number, y: number, previousLetters: number, text: string) => {
	const letters: Phaser.GameObjects.Image[] = [];
	const initialDelay = previousLetters * letterDelay;
	let currentX = x;
	[...text].forEach((letter, i) => {
		const frame = charsInFont.indexOf(letter.toUpperCase());
		if (frame < 0) {
			// Unknown character
			currentX += 6;
		} else {
			letters[i] = scene.add.image(currentX, y, "Font", frame).setVisible(false);
			scene.time.delayedCall(initialDelay + i * letterDelay, () => {
				if (!letters[i].scene) return;

				scene.sound.play("Beep" + (1 + Math.floor(Math.random() * 5)), {volume: 0.2});
				letters[i].setVisible(true);
			});
			currentX += 8;
		}
	});

	const destroy = () => letters.forEach(letter => letter.destroy())

	return { destroy };
}
