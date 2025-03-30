import { allWizards } from "../wizards";
import {
  MatchPlayerData,
  Position,
  Spell,
  SpellEffect,
} from "./matchmaking.types";

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

      if (
        (player.playerPosition as Position).manhattanDistance(castPosition) <= 2
      ) {
        player.health -= 50;
      }

      return player;
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
  },
  {
    id: 3,
    name: "Heal",
    description: "Heal yourself",
    image: "Heal.png",
    effectType: SpellEffect.FRIENDLY_EFFECT,
    effect: (castPosition: Position, player: MatchPlayerData) => {
      const wizard = allWizards.find((w) => w.id === player.wizardId);

      player.health = Math.min(player.health + 30, wizard?.defaultHealth);

      return player;
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
        player.health -= 20;
      }

      return player;
    },
  },
];
