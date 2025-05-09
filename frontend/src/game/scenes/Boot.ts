import { Scene } from "phaser";
import { allSpells } from "../../../../common/spells";

export class Boot extends Scene {
    constructor() {
        super("Boot");
    }

    preload() {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image("main_screen", "assets/main_screen.jpg");
        this.load.image("wizard_1", "assets/wizards/1.png");
        this.load.image("wizard_2", "assets/wizards/2.png");
        this.load.image("construction", "assets/construction.png");
        this.load.image("mage", "assets/wizards/1.png");

        for (const spell of allSpells) {
            this.load.image(spell.name, `assets/spells/${spell.image}`);
        }

        this.load.image("valley", "assets/tiles/Valley.png");
        this.load.image("rock", "assets/tiles/Rock.png");
        this.load.image("water", "assets/tiles/Water.png");

        this.load.spritesheet("explosion", "assets/explosion.png", {
            frameWidth: 96,
            frameHeight: 96,
        });
    }

    create() {
        this.scene.start("Preloader");
    }
}

