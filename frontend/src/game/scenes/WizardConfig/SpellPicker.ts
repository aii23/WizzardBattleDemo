import { maxSelectable } from "@/game/constants/common";
import { UserState } from "@/game/state/UserState";
import { Scene } from "phaser";
import { Spell } from "../../../../../common/types/matchmaking.types";
import { allSpells } from "../../../../../common/spells";
const userState = UserState.getInstance();

export class SpellTile extends Phaser.GameObjects.Image {
    isPicked: boolean;
    spell: Spell;

    constructor(
        scene: Scene,
        x: number,
        y: number,
        spell: Spell,
        isPicked: boolean = false,
        onPickCallback: (newState: boolean, spell: Spell) => boolean
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
            let success = onPickCallback(!this.isPicked, this.spell);
            if (success) {
                this.toggleSelection();
            }
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

    onPick(newState: boolean, spell: Spell): boolean {
        if (newState && userState.userSpells.length >= maxSelectable) {
            return false;
        }

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

        return true;
    }

    private createGrid(spells: Spell[], spacing: number, tilesPerRow: number) {
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

