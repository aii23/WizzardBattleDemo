export interface Wizard {
    wizardId: string;
    wizardLevel: number;
    wizardXP: number;
}

export interface XPState {
    address: string;
    accountLevel: number;
    accountXP: number;
    wizards: Wizard[];
}

export interface XPResponse {
    success: boolean;
    newAmount?: number;
    newLevel?: number;
    error?: string;
    data?: XPState;
}

export interface LevelUpResponse {
    success: boolean;
    newLevel: number;
    xpRemaining: number;
    data?: XPState;
}

export interface AddXPInput {
    address: string;
    accountXP: number;
    wizardXP: {
        wizardId: string;
        amount: number;
    }[];
}

export interface GetXPInput {
    address: string;
    wizardId?: string; // Optional: if not provided, gets account XP
}

