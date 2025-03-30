import { GameOverResponse, NextRoundResponse } from "@/matchmaking.types";
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

        // Update visual elements
        this.updateGameState();
    }

    handleGameOver(data: GameOverResponse) {
        console.log("Received game over data:", data);

        if (data.winners.length === 0) {
            this.game.setGameOver("Draw");
            return;
        }

        if (data.winners.includes(this.game.getPlayerData()?.playerId!)) {
            this.game.setGameOver("You win!");
        } else {
            this.game.setGameOver("You lose!");
        }
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
}

