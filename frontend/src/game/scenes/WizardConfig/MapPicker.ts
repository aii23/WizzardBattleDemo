import { GameObjects, Scene } from "phaser";

export class MapPicker extends GameObjects.Image {
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, `construction`);
        this.setOrigin(0, 0);
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

