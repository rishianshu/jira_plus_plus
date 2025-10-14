import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar DateTime

  enum Role {
    ADMIN
    USER
  }

  type HealthCheck {
    status: String!
    timestamp: String!
  }

  type User {
    id: ID!
    email: String!
    displayName: String!
    role: Role!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type JiraSite {
    id: ID!
    alias: String!
    baseUrl: String!
    adminEmail: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    projects: [JiraProject!]!
  }

  type JiraProject {
    id: ID!
    jiraId: String!
    key: String!
    name: String!
    isActive: Boolean!
    site: JiraSite!
    createdAt: DateTime!
    updatedAt: DateTime!
    trackedUsers: [ProjectTrackedUser!]!
  }

  type UserProjectLink {
    id: ID!
    jiraAccountId: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User!
    project: JiraProject!
  }

  type ProjectTrackedUser {
    id: ID!
    jiraAccountId: String!
    displayName: String!
    email: String
    avatarUrl: String
    isTracked: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type JiraProjectOption {
    id: String!
    key: String!
    name: String!
    projectTypeKey: String
    lead: String
  }

  type JiraUserOption {
    accountId: String!
    displayName: String!
    email: String
    avatarUrl: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateUserInput {
    email: String!
    displayName: String!
    password: String!
    role: Role = USER
  }

  input UpdateUserRoleInput {
    userId: ID!
    role: Role!
  }

  input RegisterJiraSiteInput {
    alias: String!
    baseUrl: String!
    adminEmail: String!
    apiToken: String!
  }

  input RegisterJiraProjectInput {
    siteId: ID!
    jiraId: String!
    key: String!
    name: String!
  }

  input MapUserInput {
    userId: ID!
    projectId: ID!
    jiraAccountId: String!
  }

  input SetProjectTrackedUsersInput {
    projectId: ID!
    users: [ProjectTrackedUserInput!]!
  }

  input ProjectTrackedUserInput {
    jiraAccountId: String!
    displayName: String!
    email: String
    avatarUrl: String
    isTracked: Boolean = true
  }

  type Query {
    health: HealthCheck!
    me: User
    users: [User!]!
    jiraSites: [JiraSite!]!
    jiraProjects(siteId: ID!): [JiraProject!]!
    userProjectLinks(userId: ID!): [UserProjectLink!]!
    jiraProjectOptions(siteId: ID!): [JiraProjectOption!]!
    jiraProjectUserOptions(siteId: ID!, projectKey: String!): [JiraUserOption!]!
    projectTrackedUsers(projectId: ID!): [ProjectTrackedUser!]!
  }

  type Mutation {
    login(input: LoginInput!): AuthPayload!
    createUser(input: CreateUserInput!): User!
    updateUserRole(input: UpdateUserRoleInput!): User!
    registerJiraSite(input: RegisterJiraSiteInput!): JiraSite!
    registerJiraProject(input: RegisterJiraProjectInput!): JiraProject!
    mapUserToProject(input: MapUserInput!): UserProjectLink!
    unlinkUserFromProject(linkId: ID!): Boolean!
    setProjectTrackedUsers(input: SetProjectTrackedUsersInput!): [ProjectTrackedUser!]!
  }
`;
