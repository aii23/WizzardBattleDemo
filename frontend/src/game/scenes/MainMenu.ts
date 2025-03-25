import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";

export class MainMenu extends Scene {
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;

    constructor() {
        super("MainMenu");
    }

    create() {
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
        const wizardConfigButton = this.add
            .text(512, 400, "Wizard Configuration", {
                font: "32px Arial",
                color: "#fff",
            })
            .setOrigin(0.5)
            .setInteractive();

        wizardConfigButton.on("pointerover", () => {
            wizardConfigButton.setStyle({ fill: "#f39c12" });
        });
        wizardConfigButton.on("pointerout", () => {
            wizardConfigButton.setStyle({ fill: "#fff" });
        });
        wizardConfigButton.on("pointerdown", () => {
            // Switch to the wizard configuration scene
            this.scene.start("WizardConfig");
        });

        EventBus.emit("current-scene-ready", this);
    }
}

