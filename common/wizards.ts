export interface Wizard {
  id: number;
  name: string;
  defaultHealth: number;
  publicFields?: string[];
  requiredLevel?: number;
}

export enum WizardId {
  MAGE = 0,
  WARRIOR = 1,
  ROGUE = 2,
}

export const allWizards: Wizard[] = [
  {
    id: WizardId.MAGE,
    name: "Wizard",
    defaultHealth: 100,
    publicFields: ["map", "health"],
  },
  {
    id: WizardId.WARRIOR,
    name: "Warrior",
    defaultHealth: 300,
    publicFields: ["playerPosition", "map", "health"],
    requiredLevel: 2,
  },
];
