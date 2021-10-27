import * as Phaser from "phaser";
import * as Conf from "./configuration";
import MainScene from "./MainScene";
import { Direction4, move, partialDistance, Position, findNewDirection } from "./utils";

type AnimationEntry = {
    key: string,
    anim: Phaser.Types.Animations.GenerateFrameNames,
};

type AnimationEntries = {
    key: string,
    repeat: number,
    entries: AnimationEntry[];
}

const startAnimations: AnimationEntries = {
    key: "Start",
    repeat: 0,
    entries: [
        {key: "N", anim: {start: 23, end: 25}},
        {key: "S", anim: {start: 7 , end: 9}},
        {key: "E", anim: {start: 20, end: 22}},
        {key: "W", anim: {start: 10, end: 12}},
    ]
};

const walkAnimations: AnimationEntries = {
    key: "Walk",
    repeat: -1,
    entries: [
        {key: "N", anim: {start: 54, end: 57}},
        {key: "S", anim: {start: 0 , end: 3}},
        {key: "E", anim: {start: 44, end: 46}},
        {key: "W", anim: {start: 39, end: 41}},
    ]
};

const attackAnimations: AnimationEntries = {
    key: "Attack",
    repeat: -1,
    entries: [
        {key: "N", anim: {start: 58, end: 60}},
        {key: "S", anim: {start: 4 , end: 6}},
        {key: "E", anim: {start: 47, end: 48}},
        {key: "W", anim: {start: 42, end: 43}},
    ]
};

const dieAnimations: AnimationEntries = {
    key: "Die",
    repeat: 0,
    entries: [
        {key: "N", anim: {start: 84, end: 89}},
        {key: "S", anim: {start: 65, end: 70}},
        {key: "E", anim: {start: 78, end: 83}},
        {key: "W", anim: {start: 71, end: 76}},
    ]
};

const idleAnimation: AnimationEntries = {
    key: "Idle",
    repeat: -1,
    entries: [
        {key: "", anim: {start: 13, end: 19}},
    ]
};

const turnAnimations: AnimationEntries = {
    key: "Turn",
    repeat: 0,
    entries: [
        {key: "NE", anim: {start: 61, end: 62}},
        {key: "NW", anim: {start: 53 , end: 52}},
        {key: "NS", anim: {frames: [61, 62, 31, 30, 29]}},
        {key: "SN", anim: {frames: [26, 27, 28, 52, 53]}},
        {key: "SE", anim: {start: 29, end: 31}},
        {key: "SW", anim: {start: 26, end: 28}},
        {key: "EN", anim: {start: 62 , end: 61}},
        {key: "ES", anim: {start: 31 , end: 29}},
        {key: "EW", anim: {frames: [31, 30, 29, 26, 27, 28]}},
        {key: "WN", anim: {start: 52, end: 53}},
        {key: "WS", anim: {start: 28, end: 26}},
        {key: "WE", anim: {frames: [52, 53, 61, 62]}},
    ]
};

const allAnimations: AnimationEntries[] = [
    startAnimations,
    walkAnimations,
    attackAnimations,
    dieAnimations,
    idleAnimation,
    turnAnimations
];

type State = "STARTING" | "WALKING" | "TURNING" | "ATTACKING" | "DYING" | "IDLING";

export default class {
    sprite: Phaser.GameObjects.Sprite;
    direction: Direction4;
    destination: Position;

    state: State;
    scene: MainScene;

    get x() { return this.sprite.x };
    get y() { return this.sprite.y };

    static createAnimations(anims: Phaser.Animations.AnimationManager) {
        allAnimations.forEach(({key, entries, repeat}) => {
            entries.forEach(({key: key2, anim}) => {
                anims.create({
                    key: "Demon" + key + key2,
                    frameRate: 5,
                    frames: anims.generateFrameNames("Demon", anim),
                    repeat,
                });
            });
        });
    }

    constructor(scene: MainScene, x: number, y: number, direction = <Direction4>"S") {
        this.scene = scene;
        this.sprite = scene.add.sprite(x, y, "Demon");
        this.direction = direction;
        this.state = "STARTING";
        this.sprite.play("DemonStart" + direction).once("animationcomplete", () => this.startIdling());
    }

    setDestination(pos: Position) {
        this.destination = pos;
        this.state = "WALKING";
    }

    die() {
        this.state = "DYING";
        this.sprite.play("DemonDie" + this.direction).once("animationcomplete", () => this.sprite.destroy());
    }

    // isCloseTo(position: Phaser.Types.Math.Vector2Like): boolean {
    //     return (Phaser.Math.Distance.BetweenPoints(position, this) < Conf.dropletHitboxSize);
    // }

    finishAttack() {
        this.startIdling();
        this.scene.time.delayedCall(2000, () => this.scene.requestNewDestination(this));
    }

    startIdling() {
        this.state = "IDLING";
        this.sprite.play("DemonIdle");
    }

    update(_time: number, delta: number) {
        if (this.state == "WALKING") {
            if (this.x == this.destination.x && this.y == this.destination.y) {
                this.sprite.play("DemonAttack" + this.direction, true);
                this.state = "ATTACKING";
                this.scene.time.delayedCall(3000, () => this.finishAttack());
            } else {
                const distance = partialDistance({from: this, to: this.destination, direction: this.direction});
                const speed = 0.1;

                if (distance > 0) {
                    const {x: newX, y: newY} = move({from: this, to: this.destination, direction: this.direction, distance: delta * speed})
                    this.sprite.play("DemonWalk" + this.direction, true);
                    this.sprite.x = newX;
                    this.sprite.y = newY;
                } else {
                    this.state = "TURNING";
                    const newDirection = findNewDirection({from: this, to: this.destination, direction: this.direction});
                    this.sprite.play("DemonTurn" + this.direction + newDirection).once("animationcomplete", () => {
                        this.state = "WALKING";
                        this.direction = newDirection;
                    });
                }
            }
        }
    }
}
