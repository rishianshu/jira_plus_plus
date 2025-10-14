import { gql } from "graphql-tag";

export const typeDefs = gql`
  """
  Minimal schema placeholder to keep the API bootable.
  Extend this schema per feature specs.
  """
  type HealthCheck {
    status: String!
    timestamp: String!
  }

  type Query {
    health: HealthCheck!
  }
`;
