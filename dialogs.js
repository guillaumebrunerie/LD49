/*
 * Dialogs
 */

let dialogs = {};

dialogs.intro = [
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
	{type: "callback", callback: (scene) => scene.createCracks(3)},
	{type: "them", text: ["See? Here are some more cracks!"]},
	{type: "you",  text: ["Oh..."]},
	{type: "them", text: ["You need to go stitch the cracks",
						  "before it's too late"]},
	{type: "you",  text: ["But..."]},
	{type: "them", text: ["Thank you so much for accepting this mission!",
						  "Good luck!"]},
	{type: "you",  text: ["..."]},
];

dialogs.intro2 = [
	{type: "them", text: ["Will you help us?",
						  "It's not like you have much choice anyway."]},
];

dialogs.intro3 = [
	{type: "them", text: ["Awesome! You seem to be up to the task!",
						  "But the cracks will keep coming..."]},
	{type: "them", text: ["I found some spare batteries the other day.",
						  "Do you want them?"]},
	{type: "you", text: ["I guess, sure?"]},
	{type: "them", text: ["Here it is."]},
	{type: "callback", callback: (scene) => scene.upgradeBattery(7)},
	{type: "callback", callback: (scene) => scene.createCracks(5)},
];

dialogs.howToStitchCracks = [
	{type: "them", text: ["You can press the SPACE key",
						  "when you are close to a crack,"]},
	{type: "them", text: ["It will close the crack, but",
						  "you need to stay long enough."]}
];


dialogs.howToRecharge = [
	{type: "them", text: ["I just went to the charging station,",
						  "my batteries were empty."]},
];
