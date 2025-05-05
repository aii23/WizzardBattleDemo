import { plainToClass } from "class-transformer";
import {
    GameOverResponse,
    NextRoundResponse,
    NextRoundResponseV2,
    SubmittedActionsResponse,
    UserTurn,
    MatchPlayerData,
} from "../../../../../common/types/matchmaking.types";
import { Game } from "./Game";
import { GridManager } from "./Grid";

export class WebSocketManager {
    constructor(private game: Game) {}

    handleNextRound(data: NextRoundResponse) {
        console.log("Received next round data:", data);

        // Update player data
        const playerData = data.state.find(
            (player) => player.playerId === this.game.getPlayerData()?.playerId
        );
        if (playerData) {
            this.game.updatePlayerData(playerData);
        }

        // Update opponent data
        const opponentData = data.state.find(
            (player) => player.playerId !== this.game.getPlayerData()?.playerId
        );
        if (opponentData) {
            this.game.updateOpponentData(opponentData);
        }

        // Reset turn submission flag
        this.game.setTurnSubmitted(false);

        // this.game.displayImpacts(data.impacts);

        // Update visual elements
        this.updateGameState();
    }

    handleNextRoundV2(data: NextRoundResponseV2) {
        console.log("Received next round data:", data);

        // Update player data
        const playerData = data.state.find(
            (player) => player.playerId === this.game.getPlayerData()?.playerId
        );
        if (playerData) {
            this.game.updatePlayerData(playerData);
        }

        // Update opponent data
        const opponentData = data.state.find(
            (player) => player.playerId !== this.game.getPlayerData()?.playerId
        );
        if (opponentData) {
            this.game.updateOpponentData(opponentData);
        }

        // Update game state
        this.updateGameState();
    }

    handleGameOver(data: GameOverResponse) {
        const isWinner = data.winners.includes(
            this.game.getPlayerData()?.playerId!
        );
        const message = isWinner ? "You won!" : "You lost!";
        this.game.setGameOver(message);
    }

    handleSubmittedActions(data: SubmittedActionsResponse) {
        const actions = data.actions;
        this.game.processSubmittedActions(actions);
    }

    private updateGameState() {
        // Update health bars
        this.game.gridManager.updateHealthBars();
        // Update mage positions
        this.game.gridManager.updateMagePositions();
        // Update highlights for new player position
        if (this.game.getPlayerData()?.playerPosition) {
            this.game.gridManager.highlightAdjacentTiles(
                this.game.getPlayerData()!.playerPosition!.x,
                this.game.getPlayerData()!.playerPosition!.y
            );
        }
    }

    cleanup() {
        // No specific cleanup needed as socket cleanup is handled by the Game class
    }
}

