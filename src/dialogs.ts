/*
 * Dialogs
 */

import MainScene from "./MainScene";

type DialogLine =
	{ type: ("you" | "them"), text: string[] }
	| { type: "callback", callback: (scene: MainScene) => void };

export type Dialog = DialogLine[];

type LevelDialog = { start: Dialog, loop: Dialog, end: Dialog };

type LevelDialogs = LevelDialog[]

const dialogs: LevelDialogs = [{ // Level 1
	start: [
		{ type: "you", text: ["Yo Micro, why have you called me", "in the middle of the night?"] },
		{ type: "them", text: ["I'm really glad you're here!", "Quickly, I need your help to save my planet!"] },
		{ type: "you", text: ["Alright, alright...", "How can I help you?"] },
		{ type: "them", text: ["Try to make the whole planet green."] },
		{ type: "them", text: ["You can move using the arrow keys, and", "water a tree by holding SPACE next to it."] },
		{ type: "them", text: ["Good luck!"]},
		{ type: "you", text: ["Luck is for amateurs."] }
	],
	loop: [
		{ type: "them", text: ["You can move using the arrow keys, and", "water a tree by holding SPACE next to it."] },
		{ type: "you", text: ["Have anyone ever told you", "that you look like a sheep?"] },
		{ type: "them", text: ["Try to make the whole planet green."] }
	],
	end: [
		{ type: "them", text: ["You made it! Thanks!", "I will recommend you to all my friends!"]},
		{ type: "you", text: ["You don't have any friends."] },
		{ type: "them", text: ["hmm... Here is a little gift for you.", "Make good use of it!"]}
	],

}, { // Level 2
	start: [
		{ type: "them", text: ["Hey buddy, I'm happy that you're here", "Save my plants, make those cracks to go away"] },
		{ type: "you", text: ["I think you're a paranoid", "but I'll double check what's going on"] }
	],
	loop: [
		{ type: "them", text: ["Those cracks are unstable, they may grow!"] },
		{ type: "them", text: ["If you need more water, find some drops!"] }
	],
	end: [
		{ type: "them", text: ["Well done! Here's your new armor!"]},
		{ type: "you", text: ["Yes... new clothes was what I really needed", "right now..."] }
	],

}, { // Level 3
	start: [
		{ type: "them", text: ["Hey! You're right on time! "] },
		{ type: "them", text: ["It's not so safe here anymore."] },
		{ type: "them", text: ["Be careful, I've heard that there are some", "monsters coming out from the cracks"] },
		{ type: "you", text: ["They need to be careful to not get into my way"] }
	],
	loop: [
		{ type: "them", text: ["What are you waiting for?", "The planet is burning!"] },
		{ type: "them", text: ["If you don't close the cracks,", "the planet will explode!"] }
	],
	end: [
		{ type: "them", text: ["Neat job! Here's additional container!", "You may need it."]},
		{ type: "you", text: ["Cool, I got another thing to carry..."] }
	],

}, { // Level 4
	start: [
		{ type: "them", text: ["Back in the days, this planet was green", "and full of trees, flowers and love."] },
		{ type: "you", text: ["Don't be too romantic... Move away!"] }
	],
	loop: [
		{ type: "them", text: ["Try to get rid of the Demons first", "or they'll make a lot of damage to this planet"] }
	],
	end: [
		{ type: "them", text: ["Ha ha! My planet is alive again!", "Here's your new equipment"]},
		{ type: "them", text: ["Remember, with great power comes", "great responsibility!"]},
		{ type: "you", text: ["Yeah, yeah... Just give me my new suit"]}
	],

}, { // Level 5
	start: [
		{ type: "them", text: ["Welcome to my land you little sweet creature!"] },
		{ type: "them", text: ["Help me to bring my flowers back to life again!"] },
		{ type: "you", text: ["No problem, watch me!"]}
	],
	loop: [
		{ type: "them", text: ["Awesome!"] },
		{ type: "you", text: ["Who bit off a piece of your head flower?"]}
	],
	end: [
		{ type: "them", text: ["Oh my, oh my...", "I don't know what to say!!"]},
		{ type: "you", text: ["Just don't say anything."]},
		{ type: "them", text: ["I need to give you something then!", "Here!"]}
	],

}, { // Level 6
	start: [
		{ type: "them", text: ["Welcome to hell!! ", "My planet is about to explode soon", "The demons are coming", "a lot of them..."] },
		{ type: "them", text: ["Run!!! Save yourself!!"] },
		{ type: "you", text: [" Stop trembling! I don't run. I fight!"]}
	],
	loop: [
		{ type: "them", text: ["I'm so happy that you're here.", "I was so lonely..."] },
		{ type: "you", text: ["buy a cat"]}
	],
	end: [
		{ type: "them", text: ["Thank you so much for everything!", "You will always be welcome here!"] },
		{ type: "you", text: ["Well... Until next time!"]},
		{ type: "them", text: ["Whaaat??? I thought it's over"] },
		{ type: "you", text: ["Yes, for now..."]}
	],
}];

export default dialogs;
