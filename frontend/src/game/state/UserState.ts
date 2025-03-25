import { allSpells } from "../constants/spells";
import {
    MapStructure,
    Spell,
    TileType,
} from "../../../../common/types/matchmaking.types";

export class UserState {
    private static instance: UserState;
    userSpells: Spell[];
    userMap: MapStructure;

    private constructor() {
        this.userSpells = allSpells.slice(0, 3);
        this.userMap = {
            matrix: Array(4).fill(Array(4).fill(TileType.VALLEY)),
        };
    }

    static getInstance(): UserState {
        if (!UserState.instance) {
            UserState.instance = new UserState();
        }
        return UserState.instance;
    }
}

