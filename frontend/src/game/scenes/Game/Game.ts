import { GameObjects, Scene } from "phaser";
import { EventBus } from "../../EventBus";
import { MatchPlayerData, Position } from "@/matchmaking.types";
import { Socket } from "socket.io-client";
import { GridManager } from "./Grid";
import { SpellManager } from "./Spells";
import { WebSocketManager } from "./Websocket";

interface MatchMetaData {
    matchId: string;
    opponent: string;
}

export class Game extends Scene {
    private socket: Socket;
    private background: GameObjects.Image;
    private opponentText: GameObjects.Text;
    private matchMetaData: MatchMetaData | null = null;
    private playerContainer: GameObjects.Container;
    private opponentContainer: GameObjects.Container;
    private spellsContainer: GameObjects.Container;
    private readonly GRID_SIZE = 5;
    private readonly TILE_SIZE = 40;
    private readonly GRID_SPACING = 1;
    private playerData: MatchPlayerData | null = null;
    private opponentData: MatchPlayerData | null = null;
    private isInitialized: boolean = false;
    private readonly HEALTH_BAR_WIDTH = 160;
    private readonly HEALTH_BAR_HEIGHT = 20;
    private turnSubmitted: boolean = false;
    private gameOverText: GameObjects.Text | null = null;

    gridManager: GridManager;
    private spellManager: SpellManager;
    private websocketManager: WebSocketManager;

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

        // Initialize managers
        this.gridManager = new GridManager(this);
        this.spellManager = new SpellManager(this);
        this.websocketManager = new WebSocketManager(this);

        // Create grids if data is available
        if (this.isInitialized && this.playerData && this.opponentData) {
            console.log("Creating grids with data");
            this.gridManager.createGrids();
            this.spellManager.createSpellsDisplay();
        } else {
            console.log("Waiting for data to create grids");
        }

        this.updateOpponentDisplay();
        EventBus.emit("current-scene-ready", this);

        // Add socket event listeners
        this.socket.on("nextRound", (data) =>
            this.websocketManager.handleNextRound(data)
        );

        this.socket.on("gameOver", (data) =>
            this.websocketManager.handleGameOver(data)
        );
    }

    private updateOpponentDisplay() {
        if (this.matchMetaData) {
            const opponentId = this.matchMetaData.opponent;
            this.opponentText.setText(`Opponent: ${opponentId}`);
        }
    }

    // Getters for managers
    getPlayerData(): MatchPlayerData | null {
        return this.playerData;
    }

    getOpponentData(): MatchPlayerData | null {
        return this.opponentData;
    }

    getMatchMetaData(): MatchMetaData | null {
        return this.matchMetaData;
    }

    getSocket(): Socket {
        return this.socket;
    }

    getPlayerContainer(): GameObjects.Container {
        return this.playerContainer;
    }

    getOpponentContainer(): GameObjects.Container {
        return this.opponentContainer;
    }

    getSpellsContainer(): GameObjects.Container {
        return this.spellsContainer;
    }

    getGridSize(): number {
        return this.GRID_SIZE;
    }

    getTileSize(): number {
        return this.TILE_SIZE;
    }

    getGridSpacing(): number {
        return this.GRID_SPACING;
    }

    getHealthBarWidth(): number {
        return this.HEALTH_BAR_WIDTH;
    }

    getHealthBarHeight(): number {
        return this.HEALTH_BAR_HEIGHT;
    }

    // Methods to update game state
    updatePlayerData(data: MatchPlayerData) {
        this.playerData = data;
    }

    updateOpponentData(data: MatchPlayerData) {
        this.opponentData = data;
    }

    setTurnSubmitted(value: boolean) {
        this.turnSubmitted = value;
        if (!value) {
            this.gridManager.hideWaitingText();
        }
    }

    isTurnSubmitted(): boolean {
        return this.turnSubmitted;
    }

    setGameOver(message: string) {
        // Create game over text if it doesn't exist
        if (!this.gameOverText) {
            this.gameOverText = this.add
                .text(512, 384, message, {
                    font: "64px Arial",
                    color: "#ff0000",
                    stroke: "#000",
                    strokeThickness: 8,
                })
                .setOrigin(0.5)
                .setDepth(1000);

            // Add click handler to return to main menu
            this.input.once("pointerdown", () => {
                this.cleanup();
                this.scene.stop("Game");
                this.scene.start("MainMenu");
            });
        } else {
            this.gameOverText.setText(message);
        }
    }

    shutdown() {
        // Clean up all game state
        this.cleanup();
    }

    destroy() {
        // Additional cleanup if needed
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    private cleanup() {
        // Reset all game state
        this.playerData = null;
        this.opponentData = null;
        this.matchMetaData = null;
        this.isInitialized = false;
        this.turnSubmitted = false;

        // Remove all containers and their contents
        if (this.playerContainer) {
            this.playerContainer.removeAll(true);
        }
        if (this.opponentContainer) {
            this.opponentContainer.removeAll(true);
        }
        if (this.spellsContainer) {
            this.spellsContainer.removeAll(true);
        }

        // Reset managers
        // if (this.gridManager) {
        //     this.gridManager.cleanup();
        // }
        // if (this.spellManager) {
        //     this.spellManager.cleanup();
        // }
        // if (this.websocketManager) {
        //     this.websocketManager.cleanup();
        // }

        // Remove all socket listeners
        if (this.socket) {
            this.socket.removeAllListeners();
        }

        // Remove background
        if (this.background) {
            this.background.destroy();
        }

        // Remove opponent text
        if (this.opponentText) {
            this.opponentText.destroy();
        }

        // Remove game over text if it exists
        if (this.gameOverText) {
            this.gameOverText.destroy();
            this.gameOverText = null;
        }
    }
}

