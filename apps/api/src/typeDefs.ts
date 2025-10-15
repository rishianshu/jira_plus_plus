import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  enum Role {
    ADMIN
    USER
  }

  enum SyncJobStatus {
    ACTIVE
    PAUSED
    ERROR
  }

  enum SyncStatus {
    IDLE
    RUNNING
    SUCCESS
    FAILED
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

  type JiraUser {
    id: ID!
    accountId: String!
    displayName: String!
    email: String
    avatarUrl: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type JiraProject {
    id: ID!
    jiraId: String!
    key: String!
    name: String!
    isActive: Boolean!
    site: JiraSite!
    trackedUsers: [ProjectTrackedUser!]!
    syncJob: SyncJob
    syncStates: [SyncState!]!
    createdAt: DateTime!
    updatedAt: DateTime!
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

  type SyncJob {
    id: ID!
    workflowId: String!
    scheduleId: String!
    cronSchedule: String!
    status: SyncJobStatus!
    lastRunAt: DateTime
    nextRunAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type SyncState {
    id: ID!
    entity: String!
    lastSyncTime: DateTime
    status: SyncStatus!
    metadata: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type SyncLog {
    id: ID!
    level: String!
    message: String!
    details: JSON
    createdAt: DateTime!
  }

  type Issue {
    id: ID!
    jiraId: String!
    key: String!
    summary: String
    status: String!
    priority: String
    assignee: JiraUser
    sprint: Sprint
    jiraCreatedAt: DateTime!
    jiraUpdatedAt: DateTime!
    remoteData: JSON
    comments: [Comment!]!
    worklogs: [Worklog!]!
  }

  type Comment {
    id: ID!
    jiraId: String!
    author: JiraUser!
    body: String!
    jiraCreatedAt: DateTime!
    jiraUpdatedAt: DateTime
  }

  type Worklog {
    id: ID!
    jiraId: String!
    author: JiraUser!
    description: String
    timeSpent: Int
    jiraStartedAt: DateTime!
    jiraUpdatedAt: DateTime!
  }

  type Sprint {
    id: ID!
    jiraId: String!
    name: String!
    state: String!
    startDate: DateTime
    endDate: DateTime
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

  input ProjectTrackedUserInput {
    jiraAccountId: String!
    displayName: String!
    email: String
    avatarUrl: String
    isTracked: Boolean = true
  }

  input SetProjectTrackedUsersInput {
    projectId: ID!
    users: [ProjectTrackedUserInput!]!
  }

  type AuthPayload {
    token: String!
    user: User!
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
    syncStates(projectId: ID!): [SyncState!]!
    syncLogs(projectId: ID!, limit: Int = 50): [SyncLog!]!
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

  type UserProjectLink {
    id: ID!
    jiraAccountId: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User!
    project: JiraProject!
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
    startProjectSync(projectId: ID!, full: Boolean = false): Boolean!
    pauseProjectSync(projectId: ID!): Boolean!
    resumeProjectSync(projectId: ID!): Boolean!
    rescheduleProjectSync(projectId: ID!, cron: String!): Boolean!
    triggerProjectSync(projectId: ID!, full: Boolean = false, accountIds: [String!]): Boolean!
  }
`;
