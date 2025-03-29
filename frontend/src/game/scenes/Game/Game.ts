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
    private readonly GRID_SIZE = 4;
    private readonly TILE_SIZE = 40;
    private readonly GRID_SPACING = 1;
    private playerData: MatchPlayerData | null = null;
    private opponentData: MatchPlayerData | null = null;
    private isInitialized: boolean = false;
    private readonly HEALTH_BAR_WIDTH = 160;
    private readonly HEALTH_BAR_HEIGHT = 20;
    private turnSubmitted: boolean = false;

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
}

