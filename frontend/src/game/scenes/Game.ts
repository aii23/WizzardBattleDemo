import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";
import { TileType, MatchPlayerData } from "@/matchmaking.types";

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

    constructor() {
        super("Game");
    }

    init(data: {
        metaData: MatchMetaData;
        playerData: MatchPlayerData;
        opponentData: MatchPlayerData;
    }) {
        console.log("Game scene init with data:", data);
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
    }

    private createGrids() {
        console.log("Creating grids");
        // Clear existing grids if any
        this.playerContainer.removeAll();
        this.opponentContainer.removeAll();
        this.spellsContainer.removeAll();

        // Re-add the text labels
        this.opponentContainer.add(this.opponentText);
        const playerText = this.add
            .text(0, -50, "Player", {
                font: "32px Arial",
                color: "#fff",
            })
            .setOrigin(0.5);
        this.playerContainer.add(playerText);

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
            grid: any[][]
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

                    grid[y][x] = { x, y, sprite: tile };
                    container.add(tile);
                }
            }
        };

        // Create opponent grid (left side)
        createGrid(
            this.opponentData,
            this.opponentContainer,
            this.opponentGrid
        );

        // Create player grid (right side)
        createGrid(this.playerData, this.playerContainer, this.playerGrid);

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
                .setOrigin(0.5);
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

    private updateOpponentDisplay() {
        if (this.matchMetaData) {
            const opponentId = this.matchMetaData.opponent;
            this.opponentText.setText(`Opponent: ${opponentId}`);
        }
    }
}

