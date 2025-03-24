import { EventBus } from "../../EventBus";
import { Scene } from "phaser";
import { WizardPicker } from "./WizardPicker";
import { Configuration } from "./Configurations";

export class WizardConfig extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameOverText: Phaser.GameObjects.Text;

    constructor() {
        super("WizardConfig");
    }

    create() {
        this.camera = this.cameras.main;
        // this.camera.setBackgroundColor(0xff0000);

        this.background = this.add.image(512, 384, "main_screen");
        // this.background.setAlpha(0.5);

        this.gameOverText = this.add
            .text(512, 384, "Wizard Configuration", {
                fontFamily: "Arial Black",
                fontSize: 64,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 8,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);
        // const wizardPicker = new WizardPicker(this, 512, 384, 1);
        // this.add.existing(wizardPicker);
        const configurator = new Configuration(this, 200, 450);
        this.add.existing(configurator);

        EventBus.emit("current-scene-ready", this);
    }
}

