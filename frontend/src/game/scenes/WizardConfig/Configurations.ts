import { GameObjects, Scene } from "phaser";
import { WizardPicker } from "./WizardPicker";
import { MapPicker } from "./MapPicker";
import { SpellPicker } from "./SpellPicker";

export class Configuration extends GameObjects.Container {
    constructor(scene: Scene, x: number, y: number) {
        console.log("In configurations");
        super(scene, x, y);
        scene.add.existing(this);

        // Wizard picker
        let wizardLabel = new Phaser.GameObjects.Text(
            this.scene,
            50,
            0,
            "Wizard",
            {
                fontFamily: "Arial Black",
                fontSize: 14,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 2,
                align: "center",
            }
        );
        this.add(wizardLabel);
        const wizardPicker = new WizardPicker(this.scene, 0, 20, 1);
        this.add(wizardPicker);

        // Map picker
        let mapLabel = new Phaser.GameObjects.Text(this.scene, 260, 0, "Map", {
            fontFamily: "Arial Black",
            fontSize: 14,
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 2,
            align: "center",
        });
        this.add(mapLabel);
        const mapPicker = new MapPicker(this.scene, 200, 20);
        this.add(mapPicker);

        // Spell picker
        let spellsLabel = new Phaser.GameObjects.Text(
            this.scene,
            450,
            0,
            "Spells",
            {
                fontFamily: "Arial Black",
                fontSize: 14,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 2,
                align: "center",
            }
        );
        this.add(spellsLabel);
        const spellPicker = new SpellPicker(this.scene, 400, 50, 60);
        this.add(spellPicker);
    }
}

