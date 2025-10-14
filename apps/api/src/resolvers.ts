import type { Resolvers } from "./types";

export const resolvers: Resolvers = {
  Query: {
    health: () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
  },
};
