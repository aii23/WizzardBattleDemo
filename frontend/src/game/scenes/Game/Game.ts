import { GameObjects, Scene } from "phaser";
import { EventBus } from "../../EventBus";
import { Socket } from "socket.io-client";
import { GridManager } from "./Grid";
import { SpellManager } from "./Spells";
import { WebSocketManager } from "./Websocket";
import {
    Impact,
    MatchPlayerData,
    Position,
    UserTurn,
} from "../../../../../common/types/matchmaking.types";
import { Action, ActionPack, Stater, UserState } from "@/stater";
import { GameConfig } from "../../config/gameConfig";
import {
    GameState,
    GameUIElements,
    MatchMetaData,
} from "../../types/gameTypes";

export class Game extends Scene {
    private socket: Socket;
    private ui: GameUIElements;
    state: GameState;
    stater: Stater;

    gridManager: GridManager;
    private spellManager: SpellManager;
    private websocketManager: WebSocketManager;

    constructor() {
        super("Game");
        this.state = {
            playerData: null,
            opponentData: null,
            matchMetaData: null,
            isInitialized: false,
            turnSubmitted: false,
            roundActions: [],
            nextPosition: null,
        };
        this.ui = {} as GameUIElements;
    }

    init(data: {
        socket: Socket;
        metaData: MatchMetaData;
        playerData: MatchPlayerData;
        opponentData: MatchPlayerData;
    }) {
        console.log("Game scene init with data:", data);
        this.socket = data.socket;
        this.state.matchMetaData = data.metaData;
        this.state.playerData = data.playerData;
        this.state.opponentData = data.opponentData;
        this.state.isInitialized = true;

        this.initializeStater();
    }

    private initializeStater() {
        if (
            !this.state.playerData?.mapStructure ||
            !this.state.playerData?.playerPosition
        ) {
            throw new Error("Player data is incomplete");
        }

        this.stater = new Stater(
            {
                map: this.state.playerData.mapStructure,
                health: this.state.playerData.health,
                skillsInfo: this.state.playerData.spells!,
                position: new Position(
                    this.state.playerData.playerPosition.x,
                    this.state.playerData.playerPosition.y
                ),
            } as UserState,
            this.state.matchMetaData!.matchId,
            this.state.playerData.wizardId,
            this.state.playerData.playerId
        );
    }

    create() {
        console.log("Game scene create");
        this.createUI();
        this.initializeManagers();
        this.setupSocketListeners();
        EventBus.emit("current-scene-ready", this);
    }

    private createUI() {
        this.createBackground();
        this.createContainers();
        this.createTextElements();
    }

    private createBackground() {
        this.ui.background = this.add.image(
            GameConfig.SCREEN.CENTER_X,
            GameConfig.SCREEN.CENTER_Y,
            "main_screen"
        );
    }

    private createContainers() {
        this.ui.playerContainer = this.add.container(0, 0);
        this.ui.opponentContainer = this.add.container(0, 0);
        this.ui.spellsContainer = this.add.container(0, 0);
    }

    private createTextElements() {
        this.ui.opponentText = this.add
            .text(0, -50, "Opponent", {
                font: GameConfig.UI.TEXT.FONT,
                color: GameConfig.UI.TEXT.COLOR,
            })
            .setOrigin(0.5);

        this.ui.opponentContainer.add(this.ui.opponentText);

        const playerText = this.add
            .text(0, -50, "Player", {
                font: GameConfig.UI.TEXT.FONT,
                color: GameConfig.UI.TEXT.COLOR,
            })
            .setOrigin(0.5);

        this.ui.playerContainer.add(playerText);
    }

    private initializeManagers() {
        this.gridManager = new GridManager(this);
        this.spellManager = new SpellManager(this);
        this.websocketManager = new WebSocketManager(this);

        if (
            this.state.isInitialized &&
            this.state.playerData &&
            this.state.opponentData
        ) {
            console.log("Creating grids with data");
            this.gridManager.createGrids();
            this.spellManager.createSpellsDisplay();
        } else {
            console.log("Waiting for data to create grids");
        }

        this.updateOpponentDisplay();
    }

    private setupSocketListeners() {
        this.socket.on("gameOver", (data) =>
            this.websocketManager.handleGameOver(data)
        );

        this.socket.on("submittedActions", (data) => {
            console.log("submittedActions", data);
            this.websocketManager.handleSubmittedActions(data);
        });

        this.socket.on("nextRoundV2", (data) => {
            console.log("nextRoundV2", data);
            this.websocketManager.handleNextRoundV2(data);
        });
    }

    displayImpacts(impacts: Action[]) {
        console.log("displayImpacts", impacts);
        for (const impact of impacts) {
            // Determine which grid to display the impact on based on playerId
            const isOwnImpact =
                impact.target === this.state.playerData?.playerId;
            const container = isOwnImpact
                ? this.ui.playerContainer
                : this.ui.opponentContainer;

            // Display the impact on the appropriate grid
            this.displayImpactOnGrid(
                impact.position,
                impact.spellId,
                container
            );
        }
    }

    private displayImpactOnGrid(
        gridPosition: Position,
        spellId: number,
        container: GameObjects.Container
    ) {
        // Get array of positions where explosions should be played
        const explosionPositions = this.getExplosionPositions(
            gridPosition,
            spellId
        );

        // Create explosion for each position
        explosionPositions.forEach((pos) => {
            // Convert grid coordinates (column, row) to pixel coordinates
            const x =
                pos.x * (this.getTileSize() + this.getGridSpacing()) +
                this.getTileSize() / 2;
            const y =
                pos.y * (this.getTileSize() + this.getGridSpacing()) +
                this.getTileSize() / 2;

            // Create impact sprite
            const impactSprite = this.add.sprite(x, y, "impact");
            // impactSprite.setScale(2);
            impactSprite.setScale(0.5);
            impactSprite.setDepth(1000);

            // Play explosion animation
            impactSprite.play("explosion", false);

            // Add the impact sprite to the container
            container.add(impactSprite);

            // Destroy sprite when animation completes
            impactSprite.once("animationcomplete", () => {
                impactSprite.destroy();
            });
        });
    }

    private getExplosionPositions(
        centerPosition: Position,
        spellId: number
    ): Position[] {
        switch (spellId) {
            case 0: // Lightning - single position
                return [centerPosition];

            case 1: // Fireball - 3x3 area
                const positions: Position[] = [];
                for (let dx = -2; dx <= 2; dx++) {
                    for (let dy = -2; dy <= 2; dy++) {
                        const x = centerPosition.x + dx;
                        const y = centerPosition.y + dy;

                        if (
                            !(
                                x >= 0 &&
                                x < this.getGridSize() &&
                                y >= 0 &&
                                y < this.getGridSize()
                            )
                        ) {
                            continue;
                        }
                        const pos = new Position(x, y);

                        if (pos.manhattanDistance(centerPosition) <= 2) {
                            positions.push(pos);
                        }
                    }
                }
                return positions;

            case 4: // Laser - line effect
                const laserPositions: Position[] = [];
                // Add horizontal line
                for (let x = 0; x < this.getGridSize(); x++) {
                    laserPositions.push(new Position(x, centerPosition.y));
                }
                // Add vertical line
                for (let y = 0; y < this.getGridSize(); y++) {
                    laserPositions.push(new Position(centerPosition.x, y));
                }
                return laserPositions;

            default:
                return [centerPosition];
        }
    }

    private updateOpponentDisplay() {
        if (this.state.matchMetaData) {
            const opponentId = this.state.matchMetaData.opponent;
            this.ui.opponentText.setText(`Opponent: ${opponentId}`);
        }
    }

    // Getters for state
    getPlayerData(): MatchPlayerData | null {
        return this.state.playerData;
    }

    getOpponentData(): MatchPlayerData | null {
        return this.state.opponentData;
    }

    getMatchMetaData(): MatchMetaData | null {
        return this.state.matchMetaData;
    }

    getSocket(): Socket {
        return this.socket;
    }

    getPlayerContainer(): GameObjects.Container {
        return this.ui.playerContainer;
    }

    getOpponentContainer(): GameObjects.Container {
        return this.ui.opponentContainer;
    }

    getSpellsContainer(): GameObjects.Container {
        return this.ui.spellsContainer;
    }

    getGridSize(): number {
        return GameConfig.GRID.SIZE;
    }

    getTileSize(): number {
        return GameConfig.GRID.TILE_SIZE;
    }

    getGridSpacing(): number {
        return GameConfig.GRID.SPACING;
    }

    getHealthBarWidth(): number {
        return GameConfig.UI.HEALTH_BAR.WIDTH;
    }

    getHealthBarHeight(): number {
        return GameConfig.UI.HEALTH_BAR.HEIGHT;
    }

    // State management methods
    updatePlayerData(data: MatchPlayerData) {
        this.state.playerData = data;
    }

    updateOpponentData(data: MatchPlayerData) {
        this.state.opponentData = data;
    }

    setTurnSubmitted(value: boolean) {
        this.state.turnSubmitted = value;
        if (!value) {
            this.gridManager.hideWaitingText();
        }
    }

    isTurnSubmitted(): boolean {
        return this.state.turnSubmitted;
    }

    setGameOver(message: string) {
        // Create game over text if it doesn't exist
        if (!this.ui.gameOverText) {
            this.ui.gameOverText = this.add
                .text(
                    GameConfig.SCREEN.CENTER_X,
                    GameConfig.SCREEN.CENTER_Y,
                    message,
                    {
                        font: "64px Arial",
                        color: "#ff0000",
                        stroke: "#000",
                        strokeThickness: 8,
                    }
                )
                .setOrigin(0.5)
                .setDepth(1000);

            // Add click handler to return to main menu
            this.input.once("pointerdown", () => {
                this.cleanup();
                this.scene.stop("Game");
                this.scene.start("MainMenu");
            });
        } else {
            this.ui.gameOverText.setText(message);
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
        // Reset state
        this.state = {
            playerData: null,
            opponentData: null,
            matchMetaData: null,
            isInitialized: false,
            turnSubmitted: false,
            roundActions: [],
            nextPosition: null,
        };

        // Cleanup UI elements
        if (this.ui.playerContainer) {
            this.ui.playerContainer.removeAll(true);
        }
        if (this.ui.opponentContainer) {
            this.ui.opponentContainer.removeAll(true);
        }
        if (this.ui.spellsContainer) {
            this.ui.spellsContainer.removeAll(true);
        }

        // Cleanup managers
        this.gridManager.cleanup();
        this.spellManager.cleanup();
        this.websocketManager.cleanup();

        // Remove socket listeners
        if (this.socket) {
            this.socket.removeAllListeners();
        }

        // Cleanup UI elements
        if (this.ui.background) {
            this.ui.background.destroy();
        }
        if (this.ui.opponentText) {
            this.ui.opponentText.destroy();
        }
        if (this.ui.gameOverText) {
            this.ui.gameOverText.destroy();
            this.ui.gameOverText = null;
        }
    }

    processSubmittedActions(actions: ActionPack[]) {
        console.log("Processing submitted actions:", actions);
        this.state.roundActions.push(...actions);
        for (const action of actions) {
            let playerActions = new ActionPack(
                action.actions.filter(
                    (a) => a.target == this.state.playerData?.playerId
                )
            );
            this.stater.applyActions(playerActions);
        }
        this.socket.emit("updatePublicState", {
            sessionId: this.state.matchMetaData!.matchId,
            state: this.stater.getPublicState(),
        });

        this.state.nextPosition = null;
        this.state.turnSubmitted = false;
    }
}

