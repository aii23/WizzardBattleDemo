export interface WizardXPStat {
    wizardId: string;
    wizardLevel: number;
    wizardXP: number;
}

export interface XPState {
    address: string;
    accountLevel: number;
    accountXP: number;
    wizards: WizardXPStat[];
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
    xp: number;
    wizardId: string;
}

export interface GetXPInput {
    address: string;
    wizardId?: string; // Optional: if not provided, gets account XP
}

