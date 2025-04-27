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
    playerData: MatchPlayerData | null = null;
    opponentData: MatchPlayerData | null = null;
    isInitialized: boolean = false;
    private readonly HEALTH_BAR_WIDTH = 160;
    private readonly HEALTH_BAR_HEIGHT = 20;
    private turnSubmitted: boolean = false;
    private gameOverText: GameObjects.Text | null = null;
    stater: Stater;

    roundActions: ActionPack[] = [];
    nextPosition: Position | null = null;

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

        this.stater = new Stater(
            {
                map: this.playerData.mapStructure!,
                health: this.playerData.health,
                skillsInfo: this.playerData.spells!,
                position: new Position(
                    this.playerData.playerPosition!.x,
                    this.playerData.playerPosition!.y
                ),
            } as UserState,
            this.matchMetaData.matchId,
            this.playerData.wizardId,
            this.playerData.playerId
        );
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
            const isOwnImpact = impact.target === this.playerData?.playerId;
            const container = isOwnImpact
                ? this.playerContainer
                : this.opponentContainer;

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
                pos.x * (this.TILE_SIZE + this.GRID_SPACING) +
                this.TILE_SIZE / 2;
            const y =
                pos.y * (this.TILE_SIZE + this.GRID_SPACING) +
                this.TILE_SIZE / 2;

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
                                x < this.GRID_SIZE &&
                                y >= 0 &&
                                y < this.GRID_SIZE
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
                for (let x = 0; x < this.GRID_SIZE; x++) {
                    laserPositions.push(new Position(x, centerPosition.y));
                }
                // Add vertical line
                for (let y = 0; y < this.GRID_SIZE; y++) {
                    laserPositions.push(new Position(centerPosition.x, y));
                }
                return laserPositions;

            default:
                return [centerPosition];
        }
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

    processSubmittedActions(actions: ActionPack[]) {
        console.log("Processing submitted actions:", actions);
        this.roundActions.push(...actions);
        for (const action of actions) {
            let playerActions = new ActionPack(
                action.actions.filter(
                    (a) => a.target == this.playerData?.playerId
                )
            );
            this.stater.applyActions(playerActions);
        }
        this.socket.emit("updatePublicState", {
            sessionId: this.matchMetaData!.matchId,
            state: this.stater.getPublicState(),
        });

        this.nextPosition = null;
        this.turnSubmitted = false;
    }
}

