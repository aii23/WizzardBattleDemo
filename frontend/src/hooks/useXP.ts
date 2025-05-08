import { trpc } from "../utils/trpc";
import { AddXPInput } from "../trpc/types";

export function useXP() {
    const get = trpc.xp.get.useQuery;
    const addXp = trpc.xp.addXp.useMutation();

    return {
        get: (address: string) => get({ address }),
        addXp: (input: AddXPInput) => addXp.mutate(input),
        isLoading: addXp.isPending,
        error: addXp.error,
    };
}

