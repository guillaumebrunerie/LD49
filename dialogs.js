/*
 * Dialogs
 */

let dialogs = {};

dialogs.levels = [null, {}, {}, {}, {}, {}];

// dialogs.levels[1].start = [
// 	{type: "them", text: ["You made it!"]},
// 	{type: "them", text: ["I can’t believe my eyes!"]},
// 	{type: "them", text: ["Our planet is green again!"]},
// 	{type: "them", text: ["Thank you so much for everything!", "You will always be welcome here!"]},
// 	{type: "callback", callback: (scene) => scene.loseGame()},
// ];

dialogs.levels[1].start = [
	{type: "you",  text: ["Who am I??", "Where am I??"]},
	{type: "them", text: ["Thank goodness, you are here!"]},
	{type: "them", text: ["You have been sent to save us all!"]},
	{type: "them", text: ["Our scientists were studying",
						  "the core of this planet."]},
	{type: "them", text: ["But unfortunately it is much more",
						  "unstable than what they thought."]},
	{type: "them", text: ["It made the planet unstable and",
						  "it risks exploding very soon."]},
	{type: "callback", callback: (scene) => scene.initLevel(1)},
	{type: "them", text: ["Look! Here are a crack!"]},
	{type: "you",  text: ["Oh..."]},
	{type: "them", text: ["Go next to it and keep pressing SPACE",
						  "until it is gone!"]},
	{type: "you",  text: ["But..."]},
	{type: "them", text: ["And come back to me afterwards!"]},
	{type: "you",  text: ["Ok"]},
];

dialogs.levels[1].loop = [
	{type: "them", text: ["Will you help us?",
						  "The planet won’t make it without you."]},
	{type: "them", text: ["Hold SPACE next to the crack until it disappears"]},
];

dialogs.levels[2].start = [
	{type: "them", text: ["Good job! You managed to close it!",
						  "But the cracks will keep coming..."]},
	{type: "callback", callback: (scene) => scene.initLevel(2)},
	{type: "them", text: ["Oh no, more cracks!",
						  "Those are unstable, they may grow!"]},
	{type: "them", text: ["Collect the drops to recharge your tank."]}
];

dialogs.levels[2].loop = [
	{type: "them", text: ["Did you manage to fix all the cracks yet?"]},
	{type: "them", text: ["If you need more water, find some drops to collect."]}
];

dialogs.levels[3].start = [
	{type: "them", text: ["Awesome!! I wonder if it will ever end..."]},
	{type: "callback", callback: (scene) => scene.initLevel(3)},
	{type: "them", text: ["Again?? So many cracks this time...",
						  "I hope the planet won't explode..."]},
];

dialogs.levels[3].loop = [
	{type: "them", text: ["What are you waiting for?", "The planet is burning!"]},
	{type: "them", text: ["If you don't close the cracks,", "the planet might explode!"]},
];

dialogs.levels[4].start = [
	{type: "them", text: ["Back in the days, this planet was green",
						  "and full of trees and flowers."]},
	{type: "callback", callback: (scene) => scene.initLevel(4)},
	{type: "them", text: ["It was beautiful..."]},
	{type: "them", text: ["Maybe you could try to water those plants..."]},
];

dialogs.levels[4].loop = [
	{type: "them", text: ["Water the trees and the flowers", "and save the planet."]},
];

dialogs.levels[5].start = [
	{type: "them", text: ["You made it!"]},
	{type: "them", text: ["I can’t believe my eyes!"]},
	{type: "them", text: ["Our planet is green again!"]},
	{type: "them", text: ["Thank you so much for everything!", "You will always be welcome here!"]},
	{type: "callback", callback: (scene) => scene.winGame()},
];
