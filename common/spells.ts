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
    effect: (castPosition: Position, player: MatchPlayerData) => {
      if (!player.playerPosition) {
        console.error("Player position is not set");
        return player;
      }

      if ((player.playerPosition as Position).equals(castPosition)) {
        player.health -= 100;
      }

      return player;
    },

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
    effect: (castPosition: Position, player: MatchPlayerData) => {
      if (!player.playerPosition) {
        console.error("Player position is not set");
        return player;
      }

      const distance = (player.playerPosition as Position).manhattanDistance(
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

      player.health -= damage;

      return player;
    },

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
    effect: (castPosition: Position, player: MatchPlayerData) => {
      player.playerPosition = castPosition;

      return player;
    },

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
    effect: (castPosition: Position, player: MatchPlayerData) => {
      const wizard = allWizards.find((w) => w.id === player.wizardId)!;

      player.health = Math.min(player.health + 30, wizard?.defaultHealth);

      return player;
    },

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
    effect: (castPosition: Position, player: MatchPlayerData) => {
      if (!player.playerPosition) {
        console.error("Player position is not set");
        return player;
      }

      if (
        player.playerPosition.x === castPosition.x ||
        player.playerPosition.y === castPosition.y
      ) {
        player.health -= 35;
      }

      return player;
    },
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
