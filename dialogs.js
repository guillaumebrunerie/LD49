/*
 * Dialogs
 */

let dialogs = {};

dialogs.levels = [null, {}, {}, {}, {}];

dialogs.levels[1].start = [
	{type: "you",  text: ["Who am I??", "Where am I??"]},
	{type: "them", text: ["Thank goodness, you are here!"]},
	{type: "them", text: ["You have been sent by our gods",
						  "to save us all!"]},
	{type: "them", text: ["One of our scientists was studying",
						  "the core of this planet"]},
	{type: "them", text: ["But unfortunately, someone spilled",
						  "their tea into the cracks."]},
	{type: "them", text: ["It made the planet unstable and",
						  "it risks exploding very soon."]},
	{type: "callback", callback: (scene) => scene.initLevel(1)},
	{type: "them", text: ["See? Here are some more cracks!"]},
	{type: "you",  text: ["Oh..."]},
	{type: "them", text: ["You need to go stitch the cracks",
						  "before it's too late"]},
	{type: "you",  text: ["But..."]},
	{type: "them", text: ["Thank you so much for accepting this mission!",
						  "Good luck!"]},
	{type: "you",  text: ["..."]},
];

dialogs.levels[1].loop = [
	{type: "them", text: ["Will you help us?",
						  "It's not like you have much choice anyway."]},
];

dialogs.levels[2].start = [
	{type: "them", text: ["Awesome! You seem to be up to the task!",
						  "But the cracks will keep coming..."]},
	{type: "callback", callback: (scene) => scene.initLevel(2)},
	{type: "them", text: ["If you need more water, you'll find some"]}
];

dialogs.levels[2].loop = [
	{type: "them", text: ["If you need more water, collect the drops"]}
];

dialogs.levels[3].start = [
	{type: "them", text: ["Good job, please continue."]},
	{type: "callback", callback: (scene) => scene.initLevel(3)},
];

dialogs.levels[3].loop = [
	{type: "them", text: ["What are you waiting for?", "The planet is burning!"]}
];

dialogs.levels[4].start = [
	{type: "them", text: ["Trees and stuff."]},
	{type: "callback", callback: (scene) => scene.initLevel(4)},
];

dialogs.levels[4].loop = [
	{type: "them", text: ["Trees and stuff, I said!!"]}
];


// dialogs.howToStitchCracks = [
// 	{type: "them", text: ["You can press the SPACE key",
// 						  "when you are close to a crack,"]},
// 	{type: "them", text: ["It will close the crack, but",
// 						  "you need to stay long enough."]}
// ];

// dialogs.howToRecharge = [
// 	{type: "them", text: ["I just went to the charging station,",
// 						  "my batteries were empty."]},
// ];
