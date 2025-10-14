import { ApolloProvider as ApolloRootProvider } from "@apollo/client";
import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import type { ReactNode } from "react";

interface ApolloProviderProps {
  client: ApolloClient<NormalizedCacheObject>;
  children: ReactNode;
}

export function ApolloProvider({ client, children }: ApolloProviderProps) {
  return <ApolloRootProvider client={client}>{children}</ApolloRootProvider>;
}
