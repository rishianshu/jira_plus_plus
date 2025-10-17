import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

export const TOKEN_STORAGE_KEY = "jira-plus-plus/token";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function createApolloClient() {
  const defaultEndpoint =
    typeof window !== "undefined" && LOCAL_HOSTS.has(window.location.hostname)
      ? "http://localhost:4000/graphql"
      : "https://api.jira-plus-plus.in/graphql";

  const httpLink = new HttpLink({
    uri: import.meta.env.VITE_GRAPHQL_ENDPOINT ?? defaultEndpoint,
  });

  const authLink = setContext((_, { headers }) => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  });

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
}

export const apolloClient = createApolloClient();
