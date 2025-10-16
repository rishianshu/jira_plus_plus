import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar DateTime
  scalar Date
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
    browseUrl: String
    priority: String
    assignee: JiraUser
    project: JiraProject!
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
    issue: Issue!
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

  enum DailySummaryStatus {
    ON_TRACK
    DELAYED
    BLOCKED
  }

  type IssueStatusCounts {
    todo: Int!
    inProgress: Int!
    backlog: Int!
  }

  type DailySummaryWorkItem {
    issue: Issue!
    recentWorklogs: [Worklog!]!
    recentComments: [Comment!]!
    totalWorklogHours: Float!
  }

  type DailySummaryWorkItemGroup {
    status: String!
    items: [DailySummaryWorkItem!]!
  }

  type DailySummary {
    id: ID!
    user: User
    trackedUser: ProjectTrackedUser
    jiraAccountId: String
    projectId: ID!
    project: JiraProject!
    date: Date!
    yesterday: String
    today: String
    blockers: String
    createdAt: DateTime!
    updatedAt: DateTime!
    status: DailySummaryStatus!
    worklogHours: Float!
    issueCounts: IssueStatusCounts!
    workItems: [DailySummaryWorkItemGroup!]!
  }

  type FocusDateRange {
    start: Date!
    end: Date!
  }

  type WorklogBucket {
    date: Date!
    hours: Float!
  }

  type FocusDashboardMetrics {
    totalIssues: Int!
    inProgressIssues: Int!
    blockerIssues: Int!
    hoursLogged: Float!
    averageHoursPerDay: Float!
  }

  type FocusBoard {
    projects: [JiraProject!]!
    issues: [Issue!]!
    blockers: [Issue!]!
    comments: [Comment!]!
    worklogTimeline: [WorklogBucket!]!
    metrics: FocusDashboardMetrics!
    dateRange: FocusDateRange!
    updatedAt: DateTime!
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
    dailySummaries(date: Date!, projectId: ID!): [DailySummary!]!
    scrumProjects: [JiraProject!]!
    focusBoard(projectIds: [ID!], start: Date, end: Date): FocusBoard!
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

  enum SummaryExportTarget {
    PDF
    SLACK
  }

  type SummaryExportResult {
    success: Boolean!
    message: String!
    location: String
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
    generateDailySummaries(date: Date!, projectId: ID!): [DailySummary!]!
    regenerateDailySummary(userId: ID!, date: Date!, projectId: ID!): DailySummary!
    exportDailySummaries(date: Date!, projectId: ID!, target: SummaryExportTarget!): SummaryExportResult!
  }
`;
