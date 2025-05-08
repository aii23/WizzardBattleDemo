import mongoose, { Schema, Document } from "mongoose";

interface IWizard {
    wizardId: string;
    wizardLevel: number;
    wizardXP: number;
}

export interface IXP extends Document {
    address: string;
    accountLevel: number;
    accountXP: number;
    wizards: IWizard[];
}

const WizardSchema = new Schema<IWizard>({
    wizardId: { type: String, required: true },
    wizardLevel: { type: Number, required: true, default: 1 },
    wizardXP: { type: Number, required: true, default: 0 },
});

const XPSchema = new Schema<IXP>({
    address: { type: String, required: true, unique: true },
    accountLevel: { type: Number, required: true, default: 1 },
    accountXP: { type: Number, required: true, default: 0 },
    wizards: [WizardSchema],
});

export const XPModel = mongoose.model<IXP>("XP", XPSchema);

