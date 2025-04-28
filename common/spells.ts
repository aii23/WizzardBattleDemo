import { allWizards } from "./wizards";
import {
  MatchPlayerData,
  Position,
  Spell,
  SpellEffect,
} from "./types/matchmaking.types";
import { Stater, UserState } from "./stater";

export const allSpells: Spell[] = [
  {
    id: 0,
    name: "Lightning",
    description: "A powerful bolt of lightning. High one point damage",
    image: "Lightning.png",
    effectType: SpellEffect.ENEMY_EFFECT,

    effect2: (state: UserState, castPosition: Position) => {
      const playerPosition = state.position;
      if ((playerPosition as Position).equals(castPosition)) {
        state.health -= 100;
      }
    },
  },
  {
    id: 1,
    name: "Fireball",
    description: "A ball of fire. High area damage",
    image: "Fireball.png",
    effectType: SpellEffect.ENEMY_EFFECT,

    effect2: (state: UserState, castPosition: Position) => {
      const playerPosition = state.position;

      console.log("playerPosition", playerPosition);
      console.log(playerPosition as Position);
      const distance = (playerPosition as Position).manhattanDistance(
        castPosition
      );

      let damage = 0;
      switch (distance) {
        case 0:
          damage = 50;
          break;
        case 1:
          damage = 30;
          break;
        case 2:
          damage = 15;
          break;
        default:
          damage = 0;
      }

      state.health -= damage;
    },
  },
  {
    id: 2,
    name: "Teleport",
    description: "Teleport to a random location",
    image: "Teleport.png",
    effectType: SpellEffect.FRIENDLY_EFFECT,

    effect2: (state: UserState, castPosition: Position) => {
      state.position = castPosition;
    },
  },
  {
    id: 3,
    name: "Heal",
    description: "Heal yourself",
    image: "Heal.png",
    effectType: SpellEffect.FRIENDLY_EFFECT,

    effect2: (state: UserState, castPosition: Position) => {
      // Todo: Add max health check
      state.health += 30;
    },
  },
  {
    id: 4,
    name: "Laser",
    description: "A powerful laser. Damage to line",
    image: "Laser.png",
    effectType: SpellEffect.ENEMY_EFFECT,
    effect2: (state: UserState, castPosition: Position) => {
      const playerPosition = state.position;
      if (
        playerPosition.x === castPosition.x ||
        playerPosition.y === castPosition.y
      ) {
        state.health -= 35;
      }
    },
  },
];
