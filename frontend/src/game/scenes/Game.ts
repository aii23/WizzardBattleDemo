import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";

interface MatchData {
    matchId: string;
    opponent: string;
}

interface GridTile {
    x: number;
    y: number;
    sprite: GameObjects.Rectangle;
}

export class Game extends Scene {
    private background: GameObjects.Image;
    private opponentText: GameObjects.Text;
    private matchData: MatchData | null = null;
    private playerGrid: GridTile[][] = [];
    private opponentGrid: GridTile[][] = [];
    private readonly GRID_SIZE = 4;
    private readonly TILE_SIZE = 80;
    private readonly GRID_SPACING = 10;

    constructor() {
        super("Game");
    }

    init(data: MatchData) {
        this.matchData = data;
    }

    create() {
        // Add the same background as MainMenu
        this.background = this.add.image(512, 384, "main_screen");

        // Create opponent text
        this.opponentText = this.add
            .text(512, 100, "Opponent", {
                font: "32px Arial",
                color: "#fff",
            })
            .setOrigin(0.5);

        // Create player text
        this.add
            .text(512, 668, "Player", {
                font: "32px Arial",
                color: "#fff",
            })
            .setOrigin(0.5);

        // Create grids
        this.createGrids();

        this.updateOpponentDisplay();
        EventBus.emit("current-scene-ready", this);
    }

    private createGrids() {
        // Calculate grid positions
        const opponentGridX =
            512 - (this.GRID_SIZE * (this.TILE_SIZE + this.GRID_SPACING)) / 2;
        const opponentGridY = 200;
        const playerGridX =
            512 - (this.GRID_SIZE * (this.TILE_SIZE + this.GRID_SPACING)) / 2;
        const playerGridY = 568;

        // Create opponent grid
        for (let y = 0; y < this.GRID_SIZE; y++) {
            this.opponentGrid[y] = [];
            for (let x = 0; x < this.GRID_SIZE; x++) {
                const tileX =
                    opponentGridX + x * (this.TILE_SIZE + this.GRID_SPACING);
                const tileY =
                    opponentGridY + y * (this.TILE_SIZE + this.GRID_SPACING);

                const tile = this.add.rectangle(
                    tileX + this.TILE_SIZE / 2,
                    tileY + this.TILE_SIZE / 2,
                    this.TILE_SIZE,
                    this.TILE_SIZE,
                    0x666666
                );

                this.opponentGrid[y][x] = { x, y, sprite: tile };
            }
        }

        // Create player grid
        for (let y = 0; y < this.GRID_SIZE; y++) {
            this.playerGrid[y] = [];
            for (let x = 0; x < this.GRID_SIZE; x++) {
                const tileX =
                    playerGridX + x * (this.TILE_SIZE + this.GRID_SPACING);
                const tileY =
                    playerGridY + y * (this.TILE_SIZE + this.GRID_SPACING);

                const tile = this.add.rectangle(
                    tileX + this.TILE_SIZE / 2,
                    tileY + this.TILE_SIZE / 2,
                    this.TILE_SIZE,
                    this.TILE_SIZE,
                    0x666666
                );

                this.playerGrid[y][x] = { x, y, sprite: tile };
            }
        }
    }

    private updateOpponentDisplay() {
        if (this.matchData) {
            const opponentId = this.matchData.opponent;
            this.opponentText.setText(`Opponent: ${opponentId}`);
        }
    }
}

