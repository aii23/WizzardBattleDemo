import { Action } from "@/stater";
import {
    MatchPlayerData,
    Position,
} from "../../../../common/types/matchmaking.types";

export interface MatchMetaData {
    matchId: string;
    opponent: string;
}

export interface GameState {
    playerData: MatchPlayerData | null;
    opponentData: MatchPlayerData | null;
    matchMetaData: MatchMetaData | null;
    isInitialized: boolean;
    turnSubmitted: boolean;
    roundActions: Action[];
    nextPosition: Position | null;
}

export interface GameUIElements {
    background: Phaser.GameObjects.Image;
    opponentText: Phaser.GameObjects.Text;
    playerContainer: Phaser.GameObjects.Container;
    opponentContainer: Phaser.GameObjects.Container;
    spellsContainer: Phaser.GameObjects.Container;
    gameOverText: Phaser.GameObjects.Text | null;
}

