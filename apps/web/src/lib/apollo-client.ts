import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

function createApolloClient() {
  return new ApolloClient({
    link: new HttpLink({
      uri: import.meta.env.VITE_GRAPHQL_ENDPOINT ?? "http://localhost:4000/graphql",
    }),
    cache: new InMemoryCache(),
  });
}

export const apolloClient = createApolloClient();
