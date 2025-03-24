import { GameObjects, Scene } from "phaser";

export class WizardPicker extends GameObjects.Image {
    wizardId: number;

    constructor(scene: Scene, x: number, y: number, wizardId: number) {
        console.log("In wizzard picker");
        super(scene, x, y, `wizard_${wizardId}`);
        this.setOrigin(0, 0);
        this.wizardId = wizardId;
        this.setDisplaySize(150, 150);
        scene.add.existing(this);
        this.setInteractive();

        // Optional: add a hover effect
        this.on("pointerover", () => {
            this.setTint(0xffaa00);
        });
        this.on("pointerout", () => {
            this.clearTint();
        });
    }
}

