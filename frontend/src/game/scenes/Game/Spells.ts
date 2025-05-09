import { GameObjects } from "phaser";
import {
    MatchPlayerData,
    Position,
    SpellEffect,
} from "../../../../../common/types/matchmaking.types";
import { Game } from "./Game";
import { Action } from "@/stater";

export class SpellManager {
    private selectedSpell: any = null;

    constructor(private game: Game) {}

    createSpellsDisplay() {
        const spells = this.game.getPlayerData()?.skillsInfo || [];
        const spellSize = 40;
        const spacing = 10;
        const startX = -(spells.length * (spellSize + spacing)) / 2;

        spells.forEach((spell, index) => {
            const spellX = startX + index * (spellSize + spacing);

            // Create spell background
            const spellBg = this.game.add
                .rectangle(spellX, 0, spellSize, spellSize, 0x333333)
                .setOrigin(0.5)
                .setInteractive()
                .on("pointerdown", () => this.handleSpellSelect(spell));
            this.game.getSpellsContainer().add(spellBg);

            // Add spell image
            const spellImage = this.game.add
                .image(spellX, 0, spell.name)
                .setDisplaySize(spellSize * 0.8, spellSize * 0.8);
            this.game.getSpellsContainer().add(spellImage);

            // Add spell name
            const spellName = this.game.add
                .text(spellX, spellSize / 2 + 5, spell.name, {
                    font: "14px Arial",
                    color: "#ffffff",
                    align: "center",
                })
                .setOrigin(0.5);
            this.game.getSpellsContainer().add(spellName);
        });
    }

    private handleSpellSelect(spell: any) {
        if (this.game.isTurnSubmitted()) return;

        // Deselect previous spell if any
        if (this.selectedSpell) {
            this.clearSpellSelection();
        }

        // Select new spell
        this.selectedSpell = spell;

        // Highlight the selected spell
        if (this.game.getPlayerData()?.skillsInfo) {
            const spellIndex = this.game
                .getPlayerData()!
                .skillsInfo!.findIndex((s) => s.name === spell.name);
            if (
                spellIndex !== -1 &&
                this.game.getSpellsContainer().list[spellIndex * 3]
            ) {
                const spellBg = this.game.getSpellsContainer().list[
                    spellIndex * 3
                ] as GameObjects.Rectangle;
                spellBg.setFillStyle(0x666666);
            }
        }

        // Only make opponent grid clickable for enemy spells
        if (spell.effectType === SpellEffect.ENEMY_EFFECT) {
            this.makeOpponentGridClickable();
        } else {
            // For friendly spells, highlight player's grid
            this.highlightPlayerGrid();
        }
    }

    private clearSpellSelection() {
        if (this.selectedSpell && this.game.getPlayerData()?.skillsInfo) {
            const spellIndex = this.game
                .getPlayerData()!
                .skillsInfo!.findIndex(
                    (s) => s.name === this.selectedSpell.name
                );
            if (
                spellIndex !== -1 &&
                this.game.getSpellsContainer().list[spellIndex * 3]
            ) {
                const spellBg = this.game.getSpellsContainer().list[
                    spellIndex * 3
                ] as GameObjects.Rectangle;
                spellBg.setFillStyle(0x333333);
            }
            this.selectedSpell = null;
        }
        this.makeOpponentGridUnclickable();
        this.clearPlayerGridHighlights();
    }

    private highlightPlayerGrid() {
        for (let y = 0; y < this.game.getGridSize(); y++) {
            for (let x = 0; x < this.game.getGridSize(); x++) {
                const tile = this.game
                    .getPlayerContainer()
                    .list.find(
                        (obj) =>
                            obj instanceof Phaser.GameObjects.Image &&
                            obj.x ===
                                x *
                                    (this.game.getTileSize() +
                                        this.game.getGridSpacing()) +
                                    this.game.getTileSize() / 2 &&
                            obj.y ===
                                y *
                                    (this.game.getTileSize() +
                                        this.game.getGridSpacing()) +
                                    this.game.getTileSize() / 2
                    ) as Phaser.GameObjects.Image;

                if (tile) {
                    // Add spell-specific hover handlers while preserving existing ones
                    tile.on("pointerover", () =>
                        this.handlePlayerTileHover(x, y)
                    );
                    tile.on("pointerout", () =>
                        this.handlePlayerTileUnhover(x, y)
                    );
                    tile.on("pointerdown", () =>
                        this.handlePlayerTileClick(x, y)
                    );
                }
            }
        }
    }

    private clearPlayerGridHighlights() {
        for (let y = 0; y < this.game.getGridSize(); y++) {
            for (let x = 0; x < this.game.getGridSize(); x++) {
                const tile = this.game
                    .getPlayerContainer()
                    .list.find(
                        (obj) =>
                            obj instanceof Phaser.GameObjects.Image &&
                            obj.x ===
                                x *
                                    (this.game.getTileSize() +
                                        this.game.getGridSpacing()) +
                                    this.game.getTileSize() / 2 &&
                            obj.y ===
                                y *
                                    (this.game.getTileSize() +
                                        this.game.getGridSpacing()) +
                                    this.game.getTileSize() / 2
                    ) as Phaser.GameObjects.Image;

                if (tile) {
                    // Remove only spell-specific handlers
                    tile.removeListener("pointerover", () =>
                        this.handlePlayerTileHover(x, y)
                    );
                    tile.removeListener("pointerout", () =>
                        this.handlePlayerTileUnhover(x, y)
                    );
                    tile.removeListener("pointerdown", () =>
                        this.handlePlayerTileClick(x, y)
                    );
                    tile.clearTint();
                }
            }
        }
    }

    private handlePlayerTileHover(x: number, y: number) {
        if (this.game.isTurnSubmitted() || !this.selectedSpell) return;
        const tile = this.game
            .getPlayerContainer()
            .list.find(
                (obj) =>
                    obj instanceof Phaser.GameObjects.Image &&
                    obj.x ===
                        x *
                            (this.game.getTileSize() +
                                this.game.getGridSpacing()) +
                            this.game.getTileSize() / 2 &&
                    obj.y ===
                        y *
                            (this.game.getTileSize() +
                                this.game.getGridSpacing()) +
                            this.game.getTileSize() / 2
            ) as Phaser.GameObjects.Image;

        if (tile) {
            // Use a different tint color for spell hover to distinguish from movement hover
            tile.setTint(0x00ffff); // Cyan color for spell hover
        }
    }

    private handlePlayerTileUnhover(x: number, y: number) {
        if (this.game.isTurnSubmitted() || !this.selectedSpell) return;
        const tile = this.game
            .getPlayerContainer()
            .list.find(
                (obj) =>
                    obj instanceof Phaser.GameObjects.Image &&
                    obj.x ===
                        x *
                            (this.game.getTileSize() +
                                this.game.getGridSpacing()) +
                            this.game.getTileSize() / 2 &&
                    obj.y ===
                        y *
                            (this.game.getTileSize() +
                                this.game.getGridSpacing()) +
                            this.game.getTileSize() / 2
            ) as Phaser.GameObjects.Image;

        if (tile) {
            tile.clearTint();
        }
    }

    private handlePlayerTileClick(x: number, y: number) {
        if (this.game.isTurnSubmitted() || !this.selectedSpell) return;

        this.game.setTurnSubmitted(true);
        this.game.gridManager.showWaitingText();

        console.log("Sending actions");
        let actionPack = [
            new Action(
                this.selectedSpell.id,
                new Position(x, y),
                this.game.getPlayerData()?.playerId!
            ),
        ];

        this.game.getSocket().emit("SendActions", {
            sessionId: this.game.getMatchMetaData()?.matchId,
            turnData: {
                playerId: this.game.getPlayerData()?.playerId,
                actions: actionPack,
            },
        });
        // Clear spell selection
        this.clearSpellSelection();
    }

    private makeOpponentGridClickable() {
        for (let y = 0; y < this.game.getGridSize(); y++) {
            for (let x = 0; x < this.game.getGridSize(); x++) {
                const tile = this.game
                    .getOpponentContainer()
                    .list.find(
                        (obj) =>
                            obj instanceof Phaser.GameObjects.Image &&
                            obj.x ===
                                x *
                                    (this.game.getTileSize() +
                                        this.game.getGridSpacing()) +
                                    this.game.getTileSize() / 2 &&
                            obj.y ===
                                y *
                                    (this.game.getTileSize() +
                                        this.game.getGridSpacing()) +
                                    this.game.getTileSize() / 2
                    ) as Phaser.GameObjects.Image;

                if (tile) {
                    tile.setInteractive();
                    tile.on("pointerover", () =>
                        this.handleOpponentTileHover(x, y)
                    );
                    tile.on("pointerout", () =>
                        this.handleOpponentTileUnhover(x, y)
                    );
                    tile.on("pointerdown", () =>
                        this.handleOpponentTileClick(x, y)
                    );
                }
            }
        }
    }

    private makeOpponentGridUnclickable() {
        for (let y = 0; y < this.game.getGridSize(); y++) {
            for (let x = 0; x < this.game.getGridSize(); x++) {
                const tile = this.game
                    .getOpponentContainer()
                    .list.find(
                        (obj) =>
                            obj instanceof Phaser.GameObjects.Image &&
                            obj.x ===
                                x *
                                    (this.game.getTileSize() +
                                        this.game.getGridSpacing()) +
                                    this.game.getTileSize() / 2 &&
                            obj.y ===
                                y *
                                    (this.game.getTileSize() +
                                        this.game.getGridSpacing()) +
                                    this.game.getTileSize() / 2
                    ) as Phaser.GameObjects.Image;

                if (tile) {
                    tile.removeInteractive();
                    tile.clearTint();
                }
            }
        }
    }

    private handleOpponentTileHover(x: number, y: number) {
        if (this.game.isTurnSubmitted() || !this.selectedSpell) return;
        const tile = this.game
            .getOpponentContainer()
            .list.find(
                (obj) =>
                    obj instanceof Phaser.GameObjects.Image &&
                    obj.x ===
                        x *
                            (this.game.getTileSize() +
                                this.game.getGridSpacing()) +
                            this.game.getTileSize() / 2 &&
                    obj.y ===
                        y *
                            (this.game.getTileSize() +
                                this.game.getGridSpacing()) +
                            this.game.getTileSize() / 2
            ) as Phaser.GameObjects.Image;

        if (tile) {
            tile.setTint(0xff0000);
        }
    }

    private handleOpponentTileUnhover(x: number, y: number) {
        if (this.game.isTurnSubmitted() || !this.selectedSpell) return;
        const tile = this.game
            .getOpponentContainer()
            .list.find(
                (obj) =>
                    obj instanceof Phaser.GameObjects.Image &&
                    obj.x ===
                        x *
                            (this.game.getTileSize() +
                                this.game.getGridSpacing()) +
                            this.game.getTileSize() / 2 &&
                    obj.y ===
                        y *
                            (this.game.getTileSize() +
                                this.game.getGridSpacing()) +
                            this.game.getTileSize() / 2
            ) as Phaser.GameObjects.Image;

        if (tile) {
            tile.clearTint();
        }
    }

    private handleOpponentTileClick(x: number, y: number) {
        if (this.game.isTurnSubmitted() || !this.selectedSpell) return;

        // Only allow enemy spells on opponent grid
        if (this.selectedSpell.effectType !== SpellEffect.ENEMY_EFFECT) {
            return;
        }

        this.game.setTurnSubmitted(true);
        this.game.gridManager.showWaitingText();

        console.log("Sending actions");
        this.game.getSocket().emit("SendActions", {
            sessionId: this.game.getMatchMetaData()?.matchId,
            turnData: {
                playerId: this.game.getPlayerData()?.playerId,
                actions: [
                    new Action(
                        this.selectedSpell.id,
                        new Position(x, y),
                        this.game.getOpponentData()?.playerId!
                    ),
                ],
            },
        });

        // Clear spell selection
        this.clearSpellSelection();
    }

    setTurnSubmitted(value: boolean) {
        this.game.setTurnSubmitted(value);
    }

    cleanup() {
        // Clear selected spell
        this.selectedSpell = null;

        // Clear any spell highlights
        this.clearSpellSelection();
        this.clearPlayerGridHighlights();
        this.makeOpponentGridUnclickable();
    }
}

