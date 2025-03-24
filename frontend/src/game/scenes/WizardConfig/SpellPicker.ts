import { maxSelectable } from "@/game/constants/common";
import { allSpells } from "@/game/constants/spells";
import { UserState } from "@/game/state/UserState";
import { ISpell } from "@/game/types";
import { Scene } from "phaser";

const userState = UserState.getInstance();

export class SpellTile extends Phaser.GameObjects.Image {
    isPicked: boolean;
    spell: ISpell;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        spell: ISpell,
        isPicked: boolean = false,
        onPickCallback: (newState: boolean, spell: ISpell) => void
    ) {
        super(scene, x, y, spell.name);
        this.isPicked = isPicked;
        this.spell = spell;
        this.setSize(50, 50);
        scene.add.existing(this);
        this.setInteractive();

        if (isPicked) {
            this.setTint(0x00ff00);
        }

        // Optional: add a hover effect
        this.on("pointerover", () => {
            if (this.isPicked) {
                return;
            }
            this.setTint(0xffaa00);
        });
        this.on("pointerout", () => {
            if (this.isPicked) {
                return;
            }
            this.clearTint();
        });

        this.on("pointerdown", () => {
            this.toggleSelection();
            onPickCallback(this.isPicked, this.spell);
        });
    }

    toggleSelection(): void {
        this.isPicked = !this.isPicked;
        if (this.isPicked) {
            // Highlight the tile (green tint)
            this.setTint(0x00ff00);
        } else {
            this.clearTint();
        }
    }
}

export class SpellPicker extends Phaser.GameObjects.Container {
    tiles: SpellTile[];
    selectionCountText: Phaser.GameObjects.Text;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        spacing: number,
        tilesPerRow: number = 5
    ) {
        super(scene, x, y);
        scene.add.existing(this);
        this.tiles = [];
        this.createGrid(allSpells, spacing, tilesPerRow);

        this.selectionCountText = scene.add.text(
            0,
            Math.ceil(allSpells.length / tilesPerRow) * spacing + 10,
            `${userState.userSpells.length}/${maxSelectable}`,
            { fontFamily: "Arial", fontSize: "20px", color: "#ffffff" }
        );
        this.add(this.selectionCountText);
    }

    onPick(newState: boolean, spell: ISpell) {
        if (newState) {
            userState.userSpells.push(spell);
        } else {
            userState.userSpells = userState.userSpells.filter(
                (v) => v.id !== spell.id
            );
        }

        this.selectionCountText.setText(
            `${userState.userSpells.length}/${maxSelectable}`
        );
    }

    private createGrid(spells: ISpell[], spacing: number, tilesPerRow: number) {
        spells.forEach((spell, index) => {
            // Calculate positions relative to the container
            const localX = (index % tilesPerRow) * spacing;
            const localY = Math.floor(index / tilesPerRow) * spacing;
            const tile = new SpellTile(
                this.scene,
                localX,
                localY,
                spell,
                userState.userSpells.some((v) => v.id === spell.id),
                (newState, spell) => this.onPick(newState, spell)
            );
            this.tiles.push(tile);
            this.add(tile);
        });
    }
}

