import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Configuration } from "./WizardConfig/Configurations";

export class MainMenu extends Scene {
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;
    explosion: GameObjects.Sprite;
    constructor() {
        super("MainMenu");
    }

    create() {
        this.anims.create({
            key: "explosion",
            frames: this.anims.generateFrameNames("explosion", {
                frames: [0, 1, 2, 3, 4, 5, 6, 7, 8],
            }),
            frameRate: 4,
            repeat: 0,
        });

        this.background = this.add.image(512, 384, "main_screen");

        // Create "Start Game" button as a text object
        const startGameButton = this.add
            .text(512, 350, "Start Game", {
                font: "32px Arial",
                color: "#fff",
            })
            .setOrigin(0.5)
            .setInteractive();

        // Change color on hover and react to clicks
        startGameButton.on("pointerover", () => {
            startGameButton.setStyle({ fill: "#f39c12" });
        });
        startGameButton.on("pointerout", () => {
            startGameButton.setStyle({ fill: "#fff" });
        });
        startGameButton.on("pointerdown", () => {
            // Start the game by switching to the appropriate scene
            this.scene.start("Matchmaking");
        });

        // Create "Wizard Configuration" button
        // const wizardConfigButton = this.add
        //     .text(512, 400, "Wizard Configuration", {
        //         font: "32px Arial",
        //         color: "#fff",
        //     })
        //     .setOrigin(0.5)
        //     .setInteractive();

        // wizardConfigButton.on("pointerover", () => {
        //     wizardConfigButton.setStyle({ fill: "#f39c12" });
        // });
        // wizardConfigButton.on("pointerout", () => {
        //     wizardConfigButton.setStyle({ fill: "#fff" });
        // });
        // wizardConfigButton.on("pointerdown", () => {
        //     // Switch to the wizard configuration scene
        //     this.scene.start("WizardConfig");
        // });

        const configContainer = new Configuration(this, 0, 400);
        this.add.existing(configContainer);

        EventBus.emit("current-scene-ready", this);
    }
}

