import { allWizards } from "./wizards";
import {
  MatchPlayerData,
  Position,
  Spell,
  SpellEffect,
} from "./types/matchmaking.types";
import { PublicState, Stater, UserState } from "./stater";

export enum WizardId {
  MAGE = 0,
  WARRIOR = 1,
  ROGUE = 2,
}

export const allSpells: Spell[] = [
  {
    id: "lightning",
    wizardId: WizardId.MAGE,
    cooldown: 1,
    name: "Lightning",
    description: "A powerful bolt of lightning. High one point damage",
    image: "Lightning.png",
    effectType: SpellEffect.ENEMY_EFFECT,

    effect2: (
      state: UserState,
      publicState: PublicState,
      castPosition: Position
    ) => {
      const playerPosition = state.position;
      if ((playerPosition as Position).equals(castPosition)) {
        state.health -= 100;
      }
    },
  },
  {
    id: "fireball",
    wizardId: WizardId.MAGE,
    cooldown: 1,
    name: "Fireball",

    description: "A ball of fire. High area damage",
    image: "Fireball.png",
    effectType: SpellEffect.ENEMY_EFFECT,

    effect2: (
      state: UserState,
      publicState: PublicState,
      castPosition: Position
    ) => {
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
    id: "teleport",
    wizardId: WizardId.MAGE,
    cooldown: 1,
    name: "Teleport",
    description: "Teleport to a random location",
    image: "Teleport.png",
    effectType: SpellEffect.FRIENDLY_EFFECT,

    effect2: (
      state: UserState,
      publicState: PublicState,
      castPosition: Position
    ) => {
      state.position = castPosition;
    },
  },
  {
    id: "heal",
    wizardId: WizardId.MAGE,
    cooldown: 1,
    name: "Heal",
    description: "Heal yourself",
    image: "Heal.png",
    effectType: SpellEffect.FRIENDLY_EFFECT,

    effect2: (
      state: UserState,
      publicState: PublicState,
      castPosition: Position
    ) => {
      // Todo: Add max health check
      state.health += 30;
    },
  },
  {
    id: "laser",
    wizardId: WizardId.MAGE,
    cooldown: 1,
    name: "Laser",
    description: "A powerful laser. Damage to line",
    image: "Laser.png",
    effectType: SpellEffect.ENEMY_EFFECT,
    effect2: (
      state: UserState,
      publicState: PublicState,
      castPosition: Position
    ) => {
      const playerPosition = state.position;
      if (
        playerPosition.x === castPosition.x ||
        playerPosition.y === castPosition.y
      ) {
        state.health -= 35;
      }
    },
  },

  {
    id: "rock-throw",
    wizardId: WizardId.WARRIOR,
    cooldown: 1,
    name: "Rock Throw",
    description: "A rock thrown at a single target",
    image: "RockThrow.png",
    effectType: SpellEffect.ENEMY_EFFECT,
    effect2: (
      state: UserState,
      publicState: PublicState,
      castPosition: Position,
      additionalData: any
    ) => {
      const type = additionalData.type;
      if (type === "horizontal") {
        if (state.position.x === castPosition.x) {
          state.health -= 35;
        }
      } else if (type === "vertical") {
        if (state.position.y === castPosition.y) {
          state.health -= 35;
        }
      } else {
        const xDiff = Math.abs(state.position.x - castPosition.x);
        const yDiff = Math.abs(state.position.y - castPosition.y);
        if (xDiff === yDiff || xDiff === -yDiff) {
          state.health -= 35;
        }
      }
    },
  },
  {
    id: "spin",
    wizardId: WizardId.WARRIOR,
    cooldown: 1,
    name: "Spin",
    description: "Spin with your sword",
    image: "Spin.png",
    effectType: SpellEffect.ENEMY_EFFECT,
    effect2: (
      state: UserState,
      publicState: PublicState,
      castPosition: Position
    ) => {
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
    id: "food",
    wizardId: WizardId.WARRIOR,
    cooldown: 1,
    name: "Food",
    description: "Eat food to restore health",
    image: "Food.png",
    effectType: SpellEffect.FRIENDLY_EFFECT,
    effect2: (
      state: UserState,
      publicState: PublicState,
      castPosition: Position
    ) => {
      state.health += 30;
    },
  },
  {
    id: "dash",
    wizardId: WizardId.WARRIOR,
    cooldown: 1,
    name: "Dash",
    description: "Dash to a single target",
    image: "Dash.png",
    effectType: SpellEffect.FRIENDLY_EFFECT,
    effect2: (
      state: UserState,
      publicState: PublicState,
      castPosition: Position
    ) => {
      state.position = castPosition;
    },
  },
];

const mageSpells = allSpells.filter(
  (spell) => spell.wizardId === WizardId.MAGE
);
const warriorSpells = allSpells.filter(
  (spell) => spell.wizardId === WizardId.WARRIOR
);
const rogueSpells = allSpells.filter(
  (spell) => spell.wizardId === WizardId.ROGUE
);
