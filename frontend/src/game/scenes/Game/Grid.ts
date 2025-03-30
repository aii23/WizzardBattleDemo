import { GameObjects } from "phaser";
import { MatchPlayerData, Position, TileType } from "@/matchmaking.types";
import { Game } from "./Game";
import { allWizards } from "../../../../../common/wizards";

interface GridTile {
    x: number;
    y: number;
    sprite: GameObjects.Image;
}

export class GridManager {
    private playerGrid: GridTile[][] = [];
    private opponentGrid: GridTile[][] = [];
    private playerHealthBar: GameObjects.Container;
    private opponentHealthBar: GameObjects.Container;
    private waitingText: GameObjects.Text | null = null;

    constructor(private game: Game) {}

    createGrids() {
        console.log("Creating grids");
        // Clear existing grids if any
        this.game.getPlayerContainer().removeAll();
        this.game.getOpponentContainer().removeAll();
        this.game.getSpellsContainer().removeAll();

        // Create waiting text
        this.waitingText = this.game.add
            .text(0, 0, "Waiting for opponent...", {
                font: "32px Arial",
                color: "#fff",
                stroke: "#000",
                strokeThickness: 4,
            })
            .setDepth(100)
            .setOrigin(0.5)
            .setVisible(false);

        // Create health bars
        this.createHealthBars();

        // Calculate grid positions for horizontal layout
        const totalWidth =
            this.game.getGridSize() *
            (this.game.getTileSize() + this.game.getGridSpacing());
        const spacing = 100; // Space between the two grids
        const startX = 0;
        const gridY = 384; // Center vertically

        // Helper function to create a grid
        const createGrid = (
            playerData: MatchPlayerData | null,
            container: Phaser.GameObjects.Container,
            grid: any[][],
            isPlayerGrid: boolean
        ) => {
            if (!playerData || !playerData.mapStructure) {
                console.log("No data for grid creation");
                return;
            }
            console.log("Creating grid with data:", playerData);
            for (let y = 0; y < this.game.getGridSize(); y++) {
                grid[y] = [];
                for (let x = 0; x < this.game.getGridSize(); x++) {
                    const tileX =
                        x *
                        (this.game.getTileSize() + this.game.getGridSpacing());
                    const tileY =
                        y *
                        (this.game.getTileSize() + this.game.getGridSpacing());

                    let tile;
                    const tileType = playerData.mapStructure.matrix[y][x];
                    let tileImage;
                    switch (tileType) {
                        case TileType.VALLEY:
                            tileImage = "valley";
                            break;
                        case TileType.ROCK:
                            tileImage = "rock";
                            break;
                        case TileType.WATER:
                            tileImage = "water";
                            break;
                    }
                    tile = this.game.add
                        .image(
                            tileX + this.game.getTileSize() / 2,
                            tileY + this.game.getTileSize() / 2,
                            tileImage
                        )
                        .setDisplaySize(
                            this.game.getTileSize(),
                            this.game.getTileSize()
                        );

                    if (isPlayerGrid) {
                        tile.setInteractive();
                        tile.on("pointerover", () =>
                            this.handleTileHover(x, y)
                        );
                        tile.on("pointerout", () =>
                            this.handleTileUnhover(x, y)
                        );
                        tile.on("pointerdown", () =>
                            this.handleTileClick(x, y)
                        );
                    }

                    grid[y][x] = { x, y, sprite: tile };
                    container.add(tile);
                }
            }
        };

        // Create opponent grid (left side)
        createGrid(
            this.game.getOpponentData(),
            this.game.getOpponentContainer(),
            this.opponentGrid,
            false
        );

        // Create player grid (right side)
        createGrid(
            this.game.getPlayerData(),
            this.game.getPlayerContainer(),
            this.playerGrid,
            true
        );

        // Position the containers
        const playerStartX = startX + totalWidth + spacing;
        this.game
            .getOpponentContainer()
            .setPosition(startX + totalWidth / 2, gridY);
        this.game
            .getPlayerContainer()
            .setPosition(playerStartX + totalWidth / 2, gridY);
        this.game
            .getSpellsContainer()
            .setPosition(
                playerStartX + totalWidth / 2,
                gridY + totalWidth + 50
            );

        // Add player and opponent mages
        this.createMage(
            this.game.getPlayerData(),
            this.game.getPlayerContainer()
        );
        this.createMage(
            this.game.getOpponentData(),
            this.game.getOpponentContainer()
        );

        // Highlight adjacent tiles initially
        if (this.game.getPlayerData()?.playerPosition) {
            this.highlightAdjacentTiles(
                this.game.getPlayerData()!.playerPosition!.x,
                this.game.getPlayerData()!.playerPosition!.y
            );
        }
    }

    private createHealthBars() {
        // Create opponent health bar container
        this.opponentHealthBar = this.game.add.container(0, 0);

        // Create player health bar container
        this.playerHealthBar = this.game.add.container(0, 0);

        // Helper function to create a health bar
        const createHealthBar = (
            container: GameObjects.Container,
            playerData: MatchPlayerData | null
        ) => {
            if (!playerData) return;

            const wizard = allWizards.find(
                (w) => w.id === playerData.wizardId
            )!;

            // Background (gray)
            const bg = this.game.add
                .rectangle(
                    0,
                    0,
                    this.game.getHealthBarWidth(),
                    this.game.getHealthBarHeight(),
                    0x333333
                )
                .setOrigin(0.5);
            container.add(bg);

            // Health bar (green)
            const healthBar = this.game.add
                .rectangle(
                    -this.game.getHealthBarWidth() / 2,
                    0,
                    this.game.getHealthBarWidth() *
                        (playerData.health / wizard?.defaultHealth),
                    this.game.getHealthBarHeight(),
                    0x00ff00
                )
                .setOrigin(0, 0.5);
            container.add(healthBar);

            // Health text
            const healthText = this.game.add
                .text(0, 0, `${playerData.health}/100`, {
                    font: "16px Arial",
                    color: "#ffffff",
                })
                .setOrigin(0.5);
            container.add(healthText);
        };

        // Create health bars for both players
        createHealthBar(this.opponentHealthBar, this.game.getOpponentData());
        createHealthBar(this.playerHealthBar, this.game.getPlayerData());

        // Add health bars to their respective containers
        this.game.getOpponentContainer().add(this.opponentHealthBar);
        this.game.getPlayerContainer().add(this.playerHealthBar);

        // Position health bars above their respective grids
        const gridXOffset =
            (this.game.getGridSize() *
                (this.game.getTileSize() + this.game.getGridSpacing())) /
            2;
        const gridYOffset = -this.game.getTileSize();
        this.opponentHealthBar.setPosition(gridXOffset, gridYOffset);
        this.playerHealthBar.setPosition(gridXOffset, gridYOffset);
    }

    private createMage(
        data: MatchPlayerData | null,
        container: Phaser.GameObjects.Container
    ) {
        if (!data || !data.playerPosition) {
            console.log("No player position data for mage creation");
            return;
        }
        const pos = data.playerPosition;
        const mageX =
            pos.x * (this.game.getTileSize() + this.game.getGridSpacing()) +
            this.game.getTileSize() / 2;
        const mageY =
            pos.y * (this.game.getTileSize() + this.game.getGridSpacing()) +
            this.game.getTileSize() / 2;

        const mage = this.game.add
            .image(mageX, mageY, `wizard_${data.wizardId}`)
            .setDisplaySize(
                this.game.getTileSize() * 0.8,
                this.game.getTileSize() * 0.8
            );
        container.add(mage);
    }

    private handleTileHover(x: number, y: number) {
        if (this.game.isTurnSubmitted()) return;
        if (this.isAdjacentToMage(x, y)) {
            this.playerGrid[y][x].sprite.setTint(0x00ff00);
        }
    }

    private handleTileUnhover(x: number, y: number) {
        if (this.game.isTurnSubmitted()) return;
        if (this.isAdjacentToMage(x, y)) {
            this.playerGrid[y][x].sprite.setTint(0xffff00);
        }
    }

    private handleTileClick(x: number, y: number) {
        if (this.game.isTurnSubmitted()) return;
        if (this.isAdjacentToMage(x, y)) {
            this.triggerMotion(x, y);
        }
    }

    private isAdjacentToMage(x: number, y: number): boolean {
        if (!this.game.getPlayerData()?.playerPosition) return false;
        const mageX = this.game.getPlayerData()!.playerPosition!.x;
        const mageY = this.game.getPlayerData()!.playerPosition!.y;

        return (
            (Math.abs(x - mageX) === 1 && y === mageY) ||
            (Math.abs(y - mageY) === 1 && x === mageX)
        );
    }

    highlightAdjacentTiles(mageX: number, mageY: number) {
        // Clear previous highlights
        this.clearHighlights();

        // Highlight adjacent tiles
        const adjacentPositions = [
            { x: mageX + 1, y: mageY },
            { x: mageX - 1, y: mageY },
            { x: mageX, y: mageY + 1 },
            { x: mageX, y: mageY - 1 },
        ];

        adjacentPositions.forEach((pos) => {
            if (
                pos.x >= 0 &&
                pos.x < this.game.getGridSize() &&
                pos.y >= 0 &&
                pos.y < this.game.getGridSize()
            ) {
                this.playerGrid[pos.y][pos.x].sprite.setTint(0xffff00);
            }
        });
    }

    private clearHighlights() {
        for (let y = 0; y < this.game.getGridSize(); y++) {
            for (let x = 0; x < this.game.getGridSize(); x++) {
                this.playerGrid[y][x].sprite.clearTint();
            }
        }
    }

    private triggerMotion(targetX: number, targetY: number) {
        console.log("triggerMotion", targetX, targetY);
        if (!this.game.getPlayerData()?.playerPosition) return;

        const currentX = this.game.getPlayerData()!.playerPosition!.x;
        const currentY = this.game.getPlayerData()!.playerPosition!.y;

        // Update player position
        this.game.getPlayerData()!.playerPosition = new Position(
            targetX,
            targetY
        );

        // Show waiting text
        this.showWaitingText();

        // Set turn as submitted
        this.game.setTurnSubmitted(true);

        // Emit motion event
        this.game.getSocket().emit("submitTurn", {
            sessionId: this.game.getMatchMetaData()!.matchId,
            turnData: {
                playerId: this.game.getPlayerData()!.playerId,
                spellCastInfo: [],
                moveInfo: {
                    to: {
                        x: targetX,
                        y: targetY,
                    },
                },
            },
        });
    }

    showWaitingText() {
        if (this.waitingText) {
            this.waitingText.setPosition(512, 384); // Center of the screen
            this.waitingText.setVisible(true);
        }
    }

    hideWaitingText() {
        if (this.waitingText) {
            this.waitingText.setVisible(false);
        }
    }

    updateHealthBars() {
        if (!this.game.getPlayerData() || !this.game.getOpponentData()) return;

        console.log("updateHealthBars");
        console.log(this.playerHealthBar.list);
        const wizard = allWizards.find(
            (w) => w.id === this.game.getPlayerData()!.wizardId
        )!;

        // Update player health bar
        const playerHealthBar = this.playerHealthBar
            .list[1] as GameObjects.Rectangle;
        const playerHealthText = this.playerHealthBar
            .list[2] as GameObjects.Text;
        if (playerHealthBar && playerHealthText) {
            playerHealthBar.width =
                this.game.getHealthBarWidth() *
                (this.game.getPlayerData()!.health / wizard?.defaultHealth);
            playerHealthText.setText(
                `${this.game.getPlayerData()!.health}/${wizard?.defaultHealth}`
            );
        }

        const opponentWizard = allWizards.find(
            (w) => w.id === this.game.getOpponentData()!.wizardId
        )!;

        // Update opponent health bar
        const opponentHealthBar = this.opponentHealthBar
            .list[1] as GameObjects.Rectangle;
        const opponentHealthText = this.opponentHealthBar
            .list[2] as GameObjects.Text;
        if (opponentHealthBar && opponentHealthText) {
            opponentHealthBar.width =
                this.game.getHealthBarWidth() *
                (this.game.getOpponentData()!.health /
                    opponentWizard?.defaultHealth);
            opponentHealthText.setText(
                `${this.game.getOpponentData()!.health}/${
                    opponentWizard?.defaultHealth
                }`
            );
        }
    }

    updateMagePositions() {
        // Update player mage position
        if (this.game.getPlayerData()?.playerPosition) {
            const playerMageX =
                this.game.getPlayerData()!.playerPosition!.x *
                    (this.game.getTileSize() + this.game.getGridSpacing()) +
                this.game.getTileSize() / 2;
            const playerMageY =
                this.game.getPlayerData()!.playerPosition!.y *
                    (this.game.getTileSize() + this.game.getGridSpacing()) +
                this.game.getTileSize() / 2;

            const playerMageSprite = this.game
                .getPlayerContainer()
                .list.find(
                    (obj) =>
                        obj instanceof Phaser.GameObjects.Image &&
                        obj.texture.key ===
                            `wizard_${this.game.getPlayerData()?.wizardId}`
                ) as Phaser.GameObjects.Image;

            if (playerMageSprite) {
                playerMageSprite.setPosition(playerMageX, playerMageY);
            }
        }

        // Update opponent mage position
        if (this.game.getOpponentData()?.playerPosition) {
            const opponentMageX =
                this.game.getOpponentData()!.playerPosition!.x *
                    (this.game.getTileSize() + this.game.getGridSpacing()) +
                this.game.getTileSize() / 2;
            const opponentMageY =
                this.game.getOpponentData()!.playerPosition!.y *
                    (this.game.getTileSize() + this.game.getGridSpacing()) +
                this.game.getTileSize() / 2;

            const opponentMageSprite = this.game
                .getOpponentContainer()
                .list.find(
                    (obj) =>
                        obj instanceof Phaser.GameObjects.Image &&
                        obj.texture.key ===
                            `wizard_${this.game.getOpponentData()?.wizardId}`
                ) as Phaser.GameObjects.Image;

            if (opponentMageSprite) {
                opponentMageSprite.setPosition(opponentMageX, opponentMageY);
            }
        }
    }
}

