import { inferAsyncReturnType } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";

export async function createContext(opts: CreateNextContextOptions) {
    return {
        // Add any shared context here
        // For example: database connection, session info, etc.
    };
}

export type Context = inferAsyncReturnType<typeof createContext>;
