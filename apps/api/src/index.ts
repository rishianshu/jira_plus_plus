import { startStandaloneServer } from "@apollo/server/standalone";
import { ApolloServer } from "@apollo/server";
import { schema } from "./schema";
import { createContext } from "./context";
import { getEnv } from "./env";
import { seedAdminUser } from "./auth";

async function bootstrap() {
  const env = getEnv();

  await seedAdminUser();

  const server = new ApolloServer({
    schema,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: env.PORT },
    context: async ({ req }) => createContext({ req }),
  });

  /* eslint-disable no-console */
  console.log(`🚀 API ready at ${url}`);
}

bootstrap().catch((error) => {
  console.error("Failed to start API server", error);
  process.exit(1);
});
