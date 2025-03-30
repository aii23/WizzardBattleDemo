export interface Wizard {
  id: number;
  name: string;
  defaultHealth: number;
  publicFields?: string[];
}

export const allWizards: Wizard[] = [
  {
    id: 1,
    name: "Wizard",
    defaultHealth: 100,
  },
  {
    id: 2,
    name: "Warrior",
    defaultHealth: 300,
    publicFields: ["playerPosition"],
  },
];
