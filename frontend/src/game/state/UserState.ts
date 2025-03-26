import { allSpells } from "../constants/spells";
import {
    MapStructure,
    MatchPlayerData,
    Spell,
    TileType,
} from "../../../../common/types/matchmaking.types";

export class UserState {
    private static instance: UserState;
    userSpells: Spell[];
    userMap: MapStructure;
    userPosition: { x: number; y: number };
    userHealth: number;

    private constructor() {
        this.userSpells = allSpells.slice(0, 3);
        this.userMap = {
            matrix: Array(4).fill(Array(4).fill(TileType.VALLEY)),
        };
        this.userPosition = { x: 2, y: 2 };
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

