import { allSpells } from "../../../../common/types/spells";
import {
    MapStructure,
    MatchPlayerData,
    Position,
    Spell,
    TileType,
} from "../../../../common/types/matchmaking.types";

export class UserState {
    private static instance: UserState;
    userSpells: Spell[];
    userMap: MapStructure;
    userPosition: Position;
    userHealth: number;

    private constructor() {
        this.userSpells = allSpells.slice(0, 3);
        this.userMap = {
            matrix: Array(4).fill(Array(4).fill(TileType.VALLEY)),
        };
        this.userPosition = new Position(2, 2);
        this.userHealth = 100;
    }

    static getInstance(): UserState {
        if (!UserState.instance) {
            UserState.instance = new UserState();
        }
        return UserState.instance;
    }

    getData(playerId: string): MatchPlayerData {
        return {
            playerId,
            spells: this.userSpells,
            mapStructure: this.userMap,
            playerPosition: this.userPosition,
            health: this.userHealth,
        };
    }
}

