export interface HealthCheck {
  status: string;
  timestamp: string;
}

export interface QueryResolvers {
  health: () => HealthCheck;
}

export interface Resolvers {
  Query: QueryResolvers;
}
