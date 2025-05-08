import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { XPState, AddXPInput } from "./types";
import { XPModel } from "./models/XPModel";
import {
    wizzardLevelUpXPRequirements,
    accountLevelUpXPRequirements,
} from "../../../common/constants";

import mongoose from "mongoose";

// Connect to MongoDB
mongoose
    .connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/wizard-battle"
    )
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

const ADD_XP_SCHEMA = z.object({
    address: z.string(),
    xp: z.number(),
    wizardId: z.string(),
});

const GET_XP_SCHEMA = z.object({
    address: z.string(),
});

export const xpRouter = router({
    get: publicProcedure
        .input(GET_XP_SCHEMA)
        .query(async ({ input }): Promise<XPState> => {
            const { address } = input;

            const xpDoc = await XPModel.findOne({ address });

            if (!xpDoc) {
                return {
                    address,
                    accountLevel: 1,
                    accountXP: 0,
                    wizards: [],
                };
            }

            return xpDoc.toObject();
        }),

    addXp: publicProcedure
        .input(ADD_XP_SCHEMA)
        .mutation(async ({ input }): Promise<XPState> => {
            const { address, xp, wizardId } = input;

            let xpDoc = await XPModel.findOne({ address });

            if (!xpDoc) {
                xpDoc = await XPModel.create({
                    address,
                    accountLevel: 1,
                    accountXP: 0,
                    wizards: [],
                });
            }

            // Add XP to account
            if (
                xpDoc.accountXP + xp >=
                accountLevelUpXPRequirements[xpDoc.accountLevel]
            ) {
                xpDoc.accountXP =
                    xpDoc.accountXP +
                    xp -
                    accountLevelUpXPRequirements[xpDoc.accountLevel];

                xpDoc.accountLevel++;
            } else {
                xpDoc.accountXP += xp;
            }

            // Add XP to wizards
            const wizard = xpDoc.wizards.find((w) => w.wizardId === wizardId);
            if (wizard) {
                if (
                    wizard.wizardXP + xp >=
                    wizzardLevelUpXPRequirements[wizard.wizardLevel]
                ) {
                    wizard.wizardXP =
                        wizard.wizardXP +
                        xp -
                        wizzardLevelUpXPRequirements[wizard.wizardLevel];
                    wizard.wizardLevel++;
                } else {
                    wizard.wizardXP += xp;
                }
            } else {
                xpDoc.wizards.push({
                    wizardId,
                    wizardLevel: 1,
                    wizardXP: xp,
                });
            }

            await xpDoc.save();
            return xpDoc.toObject();
        }),
});

export const appRouter = router({
    xp: xpRouter,
});

export type AppRouter = typeof appRouter;

