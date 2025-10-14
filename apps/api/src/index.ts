import { startStandaloneServer } from "@apollo/server/standalone";
import { ApolloServer } from "@apollo/server";
import { schema } from "./schema";
import { createContext } from "./context";
import { getEnv } from "./env";

async function bootstrap() {
  const env = getEnv();
  const server = new ApolloServer({
    schema,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: env.PORT },
    context: async () => createContext(),
  });

  /* eslint-disable no-console */
  console.log(`🚀 API ready at ${url}`);
}

bootstrap().catch((error) => {
  console.error("Failed to start API server", error);
  process.exit(1);
});
