import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";

interface MatchData {
    matchId: string;
    opponent: string;
}

export class Game extends Scene {
    private opponentText: GameObjects.Text;
    private matchData: MatchData | null = null;

    constructor() {
        super("Game");
    }

    init(data: MatchData) {
        this.matchData = data;
    }

    create() {
        // Create opponent text
        this.opponentText = this.add
            .text(512, 384, "Waiting for opponent...", {
                font: "32px Arial",
                color: "#fff",
            })
            .setOrigin(0.5);

        this.updateOpponentDisplay();
        EventBus.emit("current-scene-ready", this);
    }

    private updateOpponentDisplay() {
        if (this.matchData) {
            // Find the opponent's ID (assuming we're the first player)
            const opponentId = this.matchData.opponent;
            this.opponentText.setText(`Opponent ID: ${opponentId}`);
        }
    }
}

