import { allSpells } from "../../../../common/spells";
import {
    MapStructure,
    MatchPlayerData,
    Position,
    Spell,
    TileType,
} from "../../../../common/types/matchmaking.types";
import { Wizard, allWizards } from "../../../../common/wizards";

// TODO: Remove this. Transfer to stater
export class UserState {
    private static instance: UserState;
    userSpells: Spell[];
    userMap: MapStructure;
    userPosition: Position;
    wizard: Wizard;

    private constructor() {
        this.userSpells = allSpells.slice(0, 3);
        this.userMap = this.generateRandomMap();
        this.userPosition = this.generateRandomPosition();
        this.wizard = allWizards[0];
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
            wizardId: this.wizard.id,
            spells: this.userSpells,
            mapStructure: this.userMap,
            playerPosition: this.userPosition,
            health: this.wizard.defaultHealth,
        };
    }

    getPublicData(playerId: string): MatchPlayerData {
        return {
            playerId,
            wizardId: this.wizard.id,
            spells: this.userSpells,
            mapStructure: this.userMap,
            health: this.wizard.defaultHealth,
        };
    }

    private generateRandomMap() {
        const matrix = Array(5)
            .fill(null)
            .map(() => Array(5).fill(TileType.VALLEY));

        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                const random = Math.random() * 100; // Random number between 0 and 100

                if (random < 10) {
                    // 10% chance for WATER
                    matrix[y][x] = TileType.WATER;
                } else if (random < 30) {
                    // 20% chance for ROCK (30 - 10 = 20)
                    matrix[y][x] = TileType.ROCK;
                }
                // 70% chance for VALLEY (default)
            }
        }

        return { matrix };
    }

    private generateRandomPosition() {
        const x = Math.floor(Math.random() * 5); // Random number from 0 to 4
        const y = Math.floor(Math.random() * 5); // Random number from 0 to 4
        return new Position(x, y);
    }
}

