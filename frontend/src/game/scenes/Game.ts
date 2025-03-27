import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";
import {
    TileType,
    MatchPlayerData,
    NextRoundResponse,
    Position,
    SpellEffect,
} from "@/matchmaking.types";
import { Socket } from "socket.io-client";

interface MatchMetaData {
    matchId: string;
    opponent: string;
}

interface GridTile {
    x: number;
    y: number;
    sprite: GameObjects.Image;
}

export class Game extends Scene {
    private socket: Socket;
    private background: GameObjects.Image;
    private opponentText: GameObjects.Text;
    private matchMetaData: MatchMetaData | null = null;
    private playerGrid: GridTile[][] = [];
    private opponentGrid: GridTile[][] = [];
    private playerContainer: GameObjects.Container;
    private opponentContainer: GameObjects.Container;
    private spellsContainer: GameObjects.Container;
    private readonly GRID_SIZE = 4;
    private readonly TILE_SIZE = 40;
    private readonly GRID_SPACING = 1;
    private playerData: MatchPlayerData | null = null;
    private opponentData: MatchPlayerData | null = null;
    private isInitialized: boolean = false;
    private playerHealthBar: GameObjects.Container;
    private opponentHealthBar: GameObjects.Container;
    private readonly HEALTH_BAR_WIDTH = 160;
    private readonly HEALTH_BAR_HEIGHT = 20;

    private turnSubmitted: boolean = false;
    private selectedSpell: any = null;

    constructor() {
        super("Game");
    }

    init(data: {
        socket: Socket;
        metaData: MatchMetaData;
        playerData: MatchPlayerData;
        opponentData: MatchPlayerData;
    }) {
        console.log("Game scene init with data:", data);
        this.socket = data.socket;
        this.matchMetaData = data.metaData;
        this.playerData = data.playerData;
        this.opponentData = data.opponentData;
        this.isInitialized = true;
    }

    create() {
        console.log("Game scene create");
        // Add the same background as MainMenu
        this.background = this.add.image(512, 384, "main_screen");

        // Create containers for grids
        this.playerContainer = this.add.container(0, 0);
        this.opponentContainer = this.add.container(0, 0);
        this.spellsContainer = this.add.container(0, 0);

        // Create opponent text
        this.opponentText = this.add
            .text(0, -50, "Opponent", {
                font: "32px Arial",
                color: "#fff",
            })
            .setOrigin(0.5);

        // Add text to opponent container
        this.opponentContainer.add(this.opponentText);

        // Create player text
        const playerText = this.add
            .text(0, -50, "Player", {
                font: "32px Arial",
                color: "#fff",
            })
            .setOrigin(0.5);

        // Add text to player container
        this.playerContainer.add(playerText);

        // Create grids if data is available
        if (this.isInitialized && this.playerData && this.opponentData) {
            console.log("Creating grids with data");
            this.createGrids();
        } else {
            console.log("Waiting for data to create grids");
        }

        this.updateOpponentDisplay();
        EventBus.emit("current-scene-ready", this);

        // Add socket event listeners
        this.socket.on("nextRound", (data) => this.handleNextRound(data));
    }

    private createGrids() {
        console.log("Creating grids");
        // Clear existing grids if any
        this.playerContainer.removeAll();
        this.opponentContainer.removeAll();
        this.spellsContainer.removeAll();

        // Create health bars
        this.createHealthBars();

        // Calculate grid positions for horizontal layout
        const totalWidth =
            this.GRID_SIZE * (this.TILE_SIZE + this.GRID_SPACING);
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
            for (let y = 0; y < this.GRID_SIZE; y++) {
                grid[y] = [];
                for (let x = 0; x < this.GRID_SIZE; x++) {
                    const tileX = x * (this.TILE_SIZE + this.GRID_SPACING);
                    const tileY = y * (this.TILE_SIZE + this.GRID_SPACING);

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
                    tile = this.add
                        .image(
                            tileX + this.TILE_SIZE / 2,
                            tileY + this.TILE_SIZE / 2,
                            tileImage
                        )
                        .setDisplaySize(this.TILE_SIZE, this.TILE_SIZE);

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
            this.opponentData,
            this.opponentContainer,
            this.opponentGrid,
            false
        );

        // Create player grid (right side)
        createGrid(
            this.playerData,
            this.playerContainer,
            this.playerGrid,
            true
        );

        // Position the containers
        const playerStartX = startX + totalWidth + spacing;
        this.opponentContainer.setPosition(startX + totalWidth / 2, gridY);
        this.playerContainer.setPosition(playerStartX + totalWidth / 2, gridY);
        this.spellsContainer.setPosition(
            playerStartX + totalWidth / 2,
            gridY + totalWidth + 50
        );

        // Helper function to create and position a mage sprite
        const createMage = (
            data: MatchPlayerData | null,
            container: Phaser.GameObjects.Container
        ) => {
            if (!data || !data.playerPosition) {
                console.log("No player position data for mage creation");
                return;
            }
            const pos = data.playerPosition;
            const mageX =
                pos.x * (this.TILE_SIZE + this.GRID_SPACING) +
                this.TILE_SIZE / 2;
            const mageY =
                pos.y * (this.TILE_SIZE + this.GRID_SPACING) +
                this.TILE_SIZE / 2;

            const mage = this.add
                .image(mageX, mageY, "mage")
                .setDisplaySize(this.TILE_SIZE * 0.8, this.TILE_SIZE * 0.8);
            container.add(mage);
        };

        // Add player and opponent mages
        createMage(this.playerData, this.playerContainer);
        createMage(this.opponentData, this.opponentContainer);

        // Add spells display
        if (this.playerData && this.playerData.spells) {
            this.createSpellsDisplay();
        }

        // Highlight adjacent tiles initially
        if (this.playerData?.playerPosition) {
            this.highlightAdjacentTiles(
                this.playerData.playerPosition.x,
                this.playerData.playerPosition.y
            );
        }
    }

    private createSpellsDisplay() {
        const spells = this.playerData?.spells || [];
        const spellSize = 40;
        const spacing = 10;
        const startX = -(spells.length * (spellSize + spacing)) / 2;

        spells.forEach((spell, index) => {
            const spellX = startX + index * (spellSize + spacing);

            // Create spell background
            const spellBg = this.add
                .rectangle(spellX, 0, spellSize, spellSize, 0x333333)
                .setOrigin(0.5)
                .setInteractive()
                .on("pointerdown", () => this.handleSpellSelect(spell));
            this.spellsContainer.add(spellBg);

            // Add spell image
            const spellImage = this.add
                .image(spellX, 0, spell.name)
                .setDisplaySize(spellSize * 0.8, spellSize * 0.8);
            this.spellsContainer.add(spellImage);

            // Add spell name
            const spellName = this.add
                .text(spellX, spellSize / 2 + 5, spell.name, {
                    font: "14px Arial",
                    color: "#ffffff",
                    align: "center",
                })
                .setOrigin(0.5);
            this.spellsContainer.add(spellName);
        });
    }

    private createHealthBars() {
        // Create opponent health bar container
        this.opponentHealthBar = this.add.container(0, 0);

        // Create player health bar container
        this.playerHealthBar = this.add.container(0, 0);

        // Helper function to create a health bar
        const createHealthBar = (
            container: GameObjects.Container,
            playerData: MatchPlayerData | null
        ) => {
            if (!playerData) return;

            // Background (gray)
            const bg = this.add
                .rectangle(
                    0,
                    0,
                    this.HEALTH_BAR_WIDTH,
                    this.HEALTH_BAR_HEIGHT,
                    0x333333
                )
                .setOrigin(0.5);
            container.add(bg);

            // Health bar (green)
            const healthBar = this.add
                .rectangle(
                    -this.HEALTH_BAR_WIDTH / 2,
                    0,
                    this.HEALTH_BAR_WIDTH * (playerData.health / 100),
                    this.HEALTH_BAR_HEIGHT,
                    0x00ff00
                )
                .setOrigin(0, 0.5);
            container.add(healthBar);

            // Health text
            const healthText = this.add
                .text(0, 0, `${playerData.health}/100`, {
                    font: "16px Arial",
                    color: "#ffffff",
                })
                .setOrigin(0.5);
            container.add(healthText);
        };

        // Create health bars for both players
        createHealthBar(this.opponentHealthBar, this.opponentData);
        createHealthBar(this.playerHealthBar, this.playerData);

        // Add health bars to their respective containers
        this.opponentContainer.add(this.opponentHealthBar);
        this.playerContainer.add(this.playerHealthBar);

        // Position health bars above their respective grids
        const gridXOffset =
            (this.GRID_SIZE * (this.TILE_SIZE + this.GRID_SPACING)) / 2;
        const gridYOffset = -this.TILE_SIZE;
        this.opponentHealthBar.setPosition(gridXOffset, gridYOffset);
        this.playerHealthBar.setPosition(gridXOffset, gridYOffset);
    }

    private updateHealthBars() {
        if (!this.playerData || !this.opponentData) return;

        // Update player health bar
        const playerHealthBar = this.playerHealthBar
            .list[1] as GameObjects.Rectangle;
        const playerHealthText = this.playerHealthBar
            .list[2] as GameObjects.Text;
        if (playerHealthBar && playerHealthText) {
            playerHealthBar.width =
                this.HEALTH_BAR_WIDTH * (this.playerData.health / 100);
            playerHealthText.setText(`${this.playerData.health}/100`);
        }

        // Update opponent health bar
        const opponentHealthBar = this.opponentHealthBar
            .list[1] as GameObjects.Rectangle;
        const opponentHealthText = this.opponentHealthBar
            .list[2] as GameObjects.Text;
        if (opponentHealthBar && opponentHealthText) {
            opponentHealthBar.width =
                this.HEALTH_BAR_WIDTH * (this.opponentData.health / 100);
            opponentHealthText.setText(`${this.opponentData.health}/100`);
        }
    }

    private updateOpponentDisplay() {
        if (this.matchMetaData) {
            const opponentId = this.matchMetaData.opponent;
            this.opponentText.setText(`Opponent: ${opponentId}`);
        }
    }

    private handleTileHover(x: number, y: number) {
        if (this.turnSubmitted) return;
        if (this.isAdjacentToMage(x, y)) {
            this.playerGrid[y][x].sprite.setTint(0x00ff00);
        }
    }

    private handleTileUnhover(x: number, y: number) {
        if (this.turnSubmitted) return;
        if (this.isAdjacentToMage(x, y)) {
            this.playerGrid[y][x].sprite.setTint(0xffff00);
        }
    }

    private handleTileClick(x: number, y: number) {
        if (this.turnSubmitted) return;
        if (this.isAdjacentToMage(x, y)) {
            this.triggerMotion(x, y);
        }
    }

    private isAdjacentToMage(x: number, y: number): boolean {
        if (!this.playerData?.playerPosition) return false;
        const mageX = this.playerData.playerPosition.x;
        const mageY = this.playerData.playerPosition.y;

        return (
            (Math.abs(x - mageX) === 1 && y === mageY) ||
            (Math.abs(y - mageY) === 1 && x === mageX)
        );
    }

    private highlightAdjacentTiles(mageX: number, mageY: number) {
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
                pos.x < this.GRID_SIZE &&
                pos.y >= 0 &&
                pos.y < this.GRID_SIZE
            ) {
                this.playerGrid[pos.y][pos.x].sprite.setTint(0xffff00);
            }
        });
    }

    private clearHighlights() {
        for (let y = 0; y < this.GRID_SIZE; y++) {
            for (let x = 0; x < this.GRID_SIZE; x++) {
                this.playerGrid[y][x].sprite.clearTint();
            }
        }
    }

    private triggerMotion(targetX: number, targetY: number) {
        if (!this.playerData?.playerPosition) return;

        const currentX = this.playerData.playerPosition.x;
        const currentY = this.playerData.playerPosition.y;

        // Update player position
        this.playerData.playerPosition = new Position(targetX, targetY);

        // Update mage sprite position
        // const mageX =
        //     targetX * (this.TILE_SIZE + this.GRID_SPACING) + this.TILE_SIZE / 2;
        // const mageY =
        //     targetY * (this.TILE_SIZE + this.GRID_SPACING) + this.TILE_SIZE / 2;

        // Find and update mage sprite position
        // const mageSprite = this.playerContainer.list.find(
        //     (obj) =>
        //         obj instanceof Phaser.GameObjects.Image &&
        //         obj.texture.key === "mage"
        // ) as Phaser.GameObjects.Image;

        // if (mageSprite) {
        //     mageSprite.setPosition(mageX, mageY);
        // }

        // Update highlights for new position
        // this.highlightAdjacentTiles(targetX, targetY);

        this.turnSubmitted = true;

        this.socket.emit("submitTurn", {
            sessionId: this.matchMetaData?.matchId,
            turnData: {
                playerId: this.playerData?.playerId,
                moveInfo: { to: { x: targetX, y: targetY } },
                spellCastInfo: [],
            },
        });

        // Emit motion event
        EventBus.emit("motion", {
            from: { x: currentX, y: currentY },
            to: { x: targetX, y: targetY },
        });
    }

    private handleNextRound(data: NextRoundResponse) {
        console.log("Received next round data:", data);

        // Update player data
        this.playerData = data.state.find(
            (player) => player.playerId === this.playerData?.playerId
        )!;

        // Update opponent data
        this.opponentData = data.state.find(
            (player) => player.playerId !== this.playerData?.playerId
        )!;

        // Reset turn submission flag
        this.turnSubmitted = false;

        // Update visual elements
        this.updateGameState();
    }

    private updateGameState() {
        // Update health bars
        this.updateHealthBars();

        // Update mage positions
        this.updateMagePositions();

        // Update highlights for new player position
        if (this.playerData?.playerPosition) {
            this.highlightAdjacentTiles(
                this.playerData.playerPosition.x,
                this.playerData.playerPosition.y
            );
        }
    }

    private updateMagePositions() {
        // Update player mage position
        if (this.playerData?.playerPosition) {
            const playerMageX =
                this.playerData.playerPosition.x *
                    (this.TILE_SIZE + this.GRID_SPACING) +
                this.TILE_SIZE / 2;
            const playerMageY =
                this.playerData.playerPosition.y *
                    (this.TILE_SIZE + this.GRID_SPACING) +
                this.TILE_SIZE / 2;

            const playerMageSprite = this.playerContainer.list.find(
                (obj) =>
                    obj instanceof Phaser.GameObjects.Image &&
                    obj.texture.key === "mage"
            ) as Phaser.GameObjects.Image;

            if (playerMageSprite) {
                playerMageSprite.setPosition(playerMageX, playerMageY);
            }
        }

        // Update opponent mage position
        if (this.opponentData?.playerPosition) {
            const opponentMageX =
                this.opponentData.playerPosition.x *
                    (this.TILE_SIZE + this.GRID_SPACING) +
                this.TILE_SIZE / 2;
            const opponentMageY =
                this.opponentData.playerPosition.y *
                    (this.TILE_SIZE + this.GRID_SPACING) +
                this.TILE_SIZE / 2;

            const opponentMageSprite = this.opponentContainer.list.find(
                (obj) =>
                    obj instanceof Phaser.GameObjects.Image &&
                    obj.texture.key === "mage"
            ) as Phaser.GameObjects.Image;

            if (opponentMageSprite) {
                opponentMageSprite.setPosition(opponentMageX, opponentMageY);
            }
        }
    }

    private handleSpellSelect(spell: any) {
        if (this.turnSubmitted) return;

        // Deselect previous spell if any
        if (this.selectedSpell) {
            this.clearSpellSelection();
        }

        // Select new spell
        this.selectedSpell = spell;

        // Highlight the selected spell
        if (this.playerData?.spells) {
            const spellIndex = this.playerData.spells.findIndex(
                (s) => s.name === spell.name
            );
            if (
                spellIndex !== -1 &&
                this.spellsContainer.list[spellIndex * 3]
            ) {
                const spellBg = this.spellsContainer.list[
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
        if (this.selectedSpell && this.playerData?.spells) {
            const spellIndex = this.playerData.spells.findIndex(
                (s) => s.name === this.selectedSpell.name
            );
            if (
                spellIndex !== -1 &&
                this.spellsContainer.list[spellIndex * 3]
            ) {
                const spellBg = this.spellsContainer.list[
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
        for (let y = 0; y < this.GRID_SIZE; y++) {
            for (let x = 0; x < this.GRID_SIZE; x++) {
                const tile = this.playerGrid[y][x].sprite;
                tile.setInteractive();
                tile.on("pointerover", () => this.handlePlayerTileHover(x, y));
                tile.on("pointerout", () => this.handlePlayerTileUnhover(x, y));
                tile.on("pointerdown", () => this.handlePlayerTileClick(x, y));
            }
        }
    }

    private clearPlayerGridHighlights() {
        for (let y = 0; y < this.GRID_SIZE; y++) {
            for (let x = 0; x < this.GRID_SIZE; x++) {
                const tile = this.playerGrid[y][x].sprite;
                tile.removeInteractive();
                tile.clearTint();
            }
        }
    }

    private handlePlayerTileHover(x: number, y: number) {
        if (this.turnSubmitted || !this.selectedSpell) return;
        this.playerGrid[y][x].sprite.setTint(0x00ff00);
    }

    private handlePlayerTileUnhover(x: number, y: number) {
        if (this.turnSubmitted || !this.selectedSpell) return;
        this.playerGrid[y][x].sprite.clearTint();
    }

    private handlePlayerTileClick(x: number, y: number) {
        if (this.turnSubmitted || !this.selectedSpell) return;

        this.turnSubmitted = true;

        this.socket.emit("submitTurn", {
            sessionId: this.matchMetaData?.matchId,
            turnData: {
                playerId: this.playerData?.playerId,
                moveInfo: null,
                spellCastInfo: [
                    {
                        spellId: this.selectedSpell.id,
                        targetId: this.playerData?.playerId,
                        targetPosition: new Position(x, y),
                    },
                ],
            },
        });

        // Clear spell selection
        this.clearSpellSelection();
    }

    private makeOpponentGridClickable() {
        for (let y = 0; y < this.GRID_SIZE; y++) {
            for (let x = 0; x < this.GRID_SIZE; x++) {
                const tile = this.opponentGrid[y][x].sprite;
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

    private makeOpponentGridUnclickable() {
        for (let y = 0; y < this.GRID_SIZE; y++) {
            for (let x = 0; x < this.GRID_SIZE; x++) {
                const tile = this.opponentGrid[y][x].sprite;
                tile.removeInteractive();
                tile.clearTint();
            }
        }
    }

    private handleOpponentTileHover(x: number, y: number) {
        if (this.turnSubmitted || !this.selectedSpell) return;
        this.opponentGrid[y][x].sprite.setTint(0xff0000);
    }

    private handleOpponentTileUnhover(x: number, y: number) {
        if (this.turnSubmitted || !this.selectedSpell) return;
        this.opponentGrid[y][x].sprite.clearTint();
    }

    private handleOpponentTileClick(x: number, y: number) {
        if (this.turnSubmitted || !this.selectedSpell) return;

        // Only allow enemy spells on opponent grid
        if (this.selectedSpell.effectType !== SpellEffect.ENEMY_EFFECT) {
            return;
        }

        this.turnSubmitted = true;

        this.socket.emit("submitTurn", {
            sessionId: this.matchMetaData?.matchId,
            turnData: {
                playerId: this.playerData?.playerId,
                moveInfo: null,
                spellCastInfo: [
                    {
                        spellId: this.selectedSpell.id,
                        targetId: this.opponentData?.playerId,
                        targetPosition: new Position(x, y),
                    },
                ],
            },
        });

        // Clear spell selection
        this.clearSpellSelection();
    }
}

