import { allSpells } from "../constants/spells";
import { ISpell } from "../types";

export class UserState {
    private static instance: UserState;
    userSpells: ISpell[];

    private constructor() {
        this.userSpells = allSpells.slice(0, 3);
    }

    static getInstance(): UserState {
        if (!UserState.instance) {
            UserState.instance = new UserState();
        }
        return UserState.instance;
    }
}

