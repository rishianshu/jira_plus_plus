import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { BarChart3, Link2, PlusCircle, ServerCog, ShieldCheck, Users } from "lucide-react";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/modal";
import { useAuth } from "../providers/AuthProvider";

const ADMIN_CONSOLE_QUERY = gql`
  query AdminConsoleData {
    users {
      id
      email
      displayName
      phone
      role
      createdAt
    }
    jiraSites {
      id
      alias
      baseUrl
      adminEmail
      createdAt
      projects {
        id
        jiraId
        key
        name
        isActive
        createdAt
        trackedUsers {
          id
          jiraAccountId
          displayName
          email
          avatarUrl
          isTracked
        }
        syncJob {
          id
          status
          cronSchedule
          lastRunAt
          nextRunAt
        }
        syncStates {
          id
          entity
          status
          lastSyncTime
        }
      }
    }
  }
`;

const USER_LINKS_QUERY = gql`
  query UserProjectLinks($userId: ID!) {
    userProjectLinks(userId: $userId) {
      id
      jiraAccountId
      createdAt
      project {
        id
        key
        name
        site {
          id
          alias
        }
      }
    }
  }
`;

const REGISTER_SITE_MUTATION = gql`
  mutation RegisterJiraSite($input: RegisterJiraSiteInput!) {
    registerJiraSite(input: $input) {
      id
      alias
    }
  }
`;

const REGISTER_PROJECT_MUTATION = gql`
  mutation RegisterJiraProject($input: RegisterJiraProjectInput!) {
    registerJiraProject(input: $input) {
      id
      name
    }
  }
`;

const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      displayName
      phone
      role
    }
  }
`;

const RESET_USER_PASSWORD_MUTATION = gql`
  mutation ResetUserPassword($input: ResetUserPasswordInput!) {
    resetUserPassword(input: $input)
  }
`;

const MAP_USER_MUTATION = gql`
  mutation MapUserToProject($input: MapUserInput!) {
    mapUserToProject(input: $input) {
      id
      jiraAccountId
    }
  }
`;

const UNLINK_MUTATION = gql`
  mutation UnlinkUserFromProject($linkId: ID!) {
    unlinkUserFromProject(linkId: $linkId)
  }
`;

const START_SYNC_MUTATION = gql`
  mutation StartProjectSync($projectId: ID!, $full: Boolean) {
    startProjectSync(projectId: $projectId, full: $full)
  }
`;

const PAUSE_SYNC_MUTATION = gql`
  mutation PauseProjectSync($projectId: ID!) {
    pauseProjectSync(projectId: $projectId)
  }
`;

const RESUME_SYNC_MUTATION = gql`
  mutation ResumeProjectSync($projectId: ID!) {
    resumeProjectSync(projectId: $projectId)
  }
`;

const RESCHEDULE_SYNC_MUTATION = gql`
  mutation RescheduleProjectSync($projectId: ID!, $cron: String!) {
    rescheduleProjectSync(projectId: $projectId, cron: $cron)
  }
`;

const TRIGGER_SYNC_MUTATION = gql`
  mutation TriggerProjectSync($projectId: ID!, $full: Boolean, $accountIds: [String!]) {
    triggerProjectSync(projectId: $projectId, full: $full, accountIds: $accountIds)
  }
`;

const SYNC_LOGS_QUERY = gql`
  query SyncLogs($projectId: ID!, $limit: Int) {
    syncLogs(projectId: $projectId, limit: $limit) {
      id
      level
      message
      details
      createdAt
    }
  }
`;

const PROJECT_OPTIONS_QUERY = gql`
  query JiraProjectOptions($siteId: ID!) {
    jiraProjectOptions(siteId: $siteId) {
      id
      key
      name
      projectTypeKey
      lead
    }
  }
`;

const PROJECT_USERS_OPTIONS_QUERY = gql`
  query JiraProjectUserOptions($siteId: ID!, $projectKey: String!, $forceRefresh: Boolean) {
    jiraProjectUserOptions(siteId: $siteId, projectKey: $projectKey, forceRefresh: $forceRefresh) {
      accountId
      displayName
      email
      avatarUrl
    }
  }
`;

const TRACKED_USERS_QUERY = gql`
  query ProjectTrackedUsers($projectId: ID!) {
    projectTrackedUsers(projectId: $projectId) {
      id
      jiraAccountId
      displayName
      email
      avatarUrl
      isTracked
    }
  }
`;

const SET_TRACKED_USERS_MUTATION = gql`
  mutation SetProjectTrackedUsers($input: SetProjectTrackedUsersInput!) {
    setProjectTrackedUsers(input: $input) {
      id
      jiraAccountId
      displayName
      email
      avatarUrl
      isTracked
    }
  }
`;

type ProjectUserDetail = {
  accountId: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
};

type TrackedUserPayload = {
  jiraAccountId: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  isTracked: boolean;
};

type ImportUserRow = {
  accountId: string;
  displayName: string;
  email: string;
  phone: string;
  role: "ADMIN" | "MANAGER" | "USER";
};

type AdminConsoleData = {
  users: Array<{
    id: string;
    email: string;
    displayName: string;
    phone?: string | null;
    role: string;
    createdAt: string;
  }>;
  jiraSites: Array<{
    id: string;
    alias: string;
    baseUrl: string;
    adminEmail: string;
    createdAt: string;
    projects: Array<{
      id: string;
      jiraId: string;
      key: string;
      name: string;
      isActive: boolean;
      createdAt: string;
      trackedUsers: Array<{
        id: string;
        jiraAccountId: string;
        displayName: string;
        email: string | null;
        avatarUrl: string | null;
        isTracked: boolean;
      }>;
      syncJob: {
        id: string;
        status: string;
        cronSchedule: string;
        lastRunAt: string | null;
        nextRunAt: string | null;
      } | null;
      syncStates: Array<{
        id: string;
        entity: string;
        status: string;
        lastSyncTime: string | null;
      }>;
    }>;
  }>;
};

type UserProjectLinksData = {
  userProjectLinks: Array<{
    id: string;
    jiraAccountId: string;
    createdAt: string;
    project: {
      id: string;
      key: string;
      name: string;
      site: {
        id: string;
        alias: string;
      };
    };
  }>;
};

type ProjectOptionsData = {
  jiraProjectOptions: Array<{
    id: string;
    key: string;
    name: string;
    projectTypeKey?: string | null;
    lead?: string | null;
  }>;
};

type ProjectUserOptionsData = {
  jiraProjectUserOptions: Array<ProjectUserDetail>;
};

type TrackedUsersData = {
  projectTrackedUsers: Array<{
    id: string;
    jiraAccountId: string;
    displayName: string;
    email: string | null;
    avatarUrl: string | null;
    isTracked: boolean;
  }>;
};

type SyncLogsData = {
  syncLogs: Array<{
    id: string;
    level: string;
    message: string;
    details: unknown;
    createdAt: string;
  }>;
};

type ModalType = "site" | "user" | "project" | "mapping" | null;

const sidebarSections = [
  { id: "overview", label: "Overview", icon: <ShieldCheck className="h-4 w-4" /> },
  { id: "sites", label: "Jira Sites", icon: <ServerCog className="h-4 w-4" /> },
  { id: "projects", label: "Projects", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "users", label: "Directory", icon: <Users className="h-4 w-4" /> },
  { id: "mappings", label: "Account Mapping", icon: <Link2 className="h-4 w-4" /> },
] as const;

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const formatDate = (value: string) => {
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return value;
  }
};

export function AdminConsolePage() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useQuery<AdminConsoleData>(ADMIN_CONSOLE_QUERY);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [projectUsersModal, setProjectUsersModal] = useState<
    | {
        projectId: string;
        projectKey: string;
        projectName: string;
        siteId: string;
        siteAlias: string;
      }
    | null
  >(null);
  const [projectSyncModal, setProjectSyncModal] = useState<
    | {
        projectId: string;
        projectKey: string;
        projectName: string;
        siteAlias: string;
        job: (
          | {
              id: string;
              status: string;
              cronSchedule: string;
              lastRunAt: string | null;
              nextRunAt: string | null;
            }
          | null
        );
        syncStates: Array<{
          id: string;
          entity: string;
          status: string;
          lastSyncTime: string | null;
        }>;
      }
    | null
  >(null);
  const [resetUserPasswordMutation] = useMutation(RESET_USER_PASSWORD_MUTATION);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [userActionMessage, setUserActionMessage] = useState<string | null>(null);
  const [userActionError, setUserActionError] = useState<string | null>(null);

  const [fetchLinks, { data: linkData, loading: linksLoading, refetch: refetchLinks }] =
    useLazyQuery<UserProjectLinksData>(USER_LINKS_QUERY);

  useEffect(() => {
    if (selectedUserId) {
      void fetchLinks({ variables: { userId: selectedUserId } });
    }
  }, [fetchLinks, selectedUserId]);

  const sites = data?.jiraSites ?? ([] as AdminConsoleData["jiraSites"]);
  const users = data?.users ?? ([] as AdminConsoleData["users"]);
  const projects = useMemo(
    () =>
      (data?.jiraSites ?? []).flatMap((site) =>
        site.projects.map((project) => ({
          ...project,
          siteId: site.id,
          siteAlias: site.alias,
          trackedUsers: project.trackedUsers ?? [],
          syncJob: project.syncJob ?? null,
          syncStates: project.syncStates ?? [],
        })),
      ),
    [data?.jiraSites],
  );

  const selectedUser = selectedUserId
    ? users.find((candidate) => candidate.id === selectedUserId) ?? null
    : null;

  const stats = [
    { label: "Jira Sites", value: sites.length, caption: "Connected sources" },
    { label: "Projects", value: projects.length, caption: "Curated workstreams" },
    { label: "Platform Users", value: users.length, caption: "Provisioned teammates" },
  ];

  const handleResetPassword = async (userId: string, email: string) => {
    setUserActionMessage(null);
    setUserActionError(null);
    setResettingUserId(userId);
    try {
      await resetUserPasswordMutation({
        variables: { input: { userId } },
      });
      setUserActionMessage(`Password reset email sent to ${email}.`);
    } catch (mutationError) {
      const message =
        mutationError instanceof Error ? mutationError.message : "Failed to reset password.";
      setUserActionError(message);
    } finally {
      setResettingUserId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <aside className="hidden w-56 flex-shrink-0 lg:block">
        <nav className="sticky top-28 flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/60">
          {sidebarSections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="inline-flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300">
                {section.icon}
              </span>
              {section.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="flex-1 space-y-12">
        <section
          id="overview"
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/70"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Admin Console
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Connect Jira sites, curate projects, and manage platform access with enterprise-grade
                controls.
              </p>
              <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                Signed in as{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {user?.displayName}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <OverviewCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                caption={stat.caption}
              />
            ))}
          </div>
        </section>

        <section
          id="sites"
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/70"
        >
          <SectionHeader
            title="Jira sites"
            description="Register Jira Cloud or Server instances, encrypted with AES-256-GCM before storage."
            action={
              <Button onClick={() => setActiveModal("site")}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Jira site
              </Button>
            }
          />
          {loading ? (
            <EmptyState message="Loading sites..." />
          ) : sites.length === 0 ? (
            <EmptyState message="No Jira sites registered yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Alias</th>
                    <th className="px-4 py-3 font-semibold">Base URL</th>
                    <th className="px-4 py-3 font-semibold">Admin email</th>
                    <th className="px-4 py-3 font-semibold">Projects</th>
                    <th className="px-4 py-3 font-semibold">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {sites.map((site) => (
                    <tr key={site.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {site.alias}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          className="text-slate-600 underline transition hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
                          href={site.baseUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {site.baseUrl}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {site.adminEmail}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {site.projects.length}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {formatDate(site.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          id="projects"
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/70"
        >
          <SectionHeader
            title="Projects"
            description="Curate the Jira projects Jira++ should sync. Disable unused projects to reduce noise."
            action={
              <Button onClick={() => setActiveModal("project")} disabled={sites.length === 0}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Register project
              </Button>
            }
          />
          {sites.length === 0 ? (
            <EmptyState message="Connect a Jira site before registering projects." />
          ) : projects.length === 0 ? (
            <EmptyState message="No projects registered yet. Bring in the first one to unlock boards." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Project</th>
                    <th className="px-4 py-3 font-semibold">Site</th>
                    <th className="px-4 py-3 font-semibold">Key</th>
                    <th className="px-4 py-3 font-semibold">Jira ID</th>
                    <th className="px-4 py-3 font-semibold">Tracked users</th>
                    <th className="px-4 py-3 font-semibold">Added</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {project.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {project.siteAlias}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {project.key}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {project.jiraId}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {project.trackedUsers.filter((user) => user.isTracked).length}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {formatDate(project.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setProjectSyncModal({
                                projectId: project.id,
                                projectKey: project.key,
                                projectName: project.name,
                                siteAlias: project.siteAlias,
                                job: project.syncJob ?? null,
                                syncStates: project.syncStates ?? [],
                              })
                            }
                          >
                            Manage sync
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setProjectUsersModal({
                                projectId: project.id,
                                projectKey: project.key,
                                projectName: project.name,
                                siteId: project.siteId,
                                siteAlias: project.siteAlias,
                              })
                            }
                          >
                            Manage Jira users
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          id="users"
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/70"
        >
          <SectionHeader
            title="Directory"
            description="Provision teammates with scoped access. Only admins can invite or elevate users."
            action={
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setImportModalOpen(true)} variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Import Jira users
                </Button>
                <Button onClick={() => setActiveModal("user")}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Invite user
                </Button>
              </div>
            }
          />
          {userActionError ? <InlineMessage tone="error">{userActionError}</InlineMessage> : null}
          {userActionMessage ? <InlineMessage>{userActionMessage}</InlineMessage> : null}
          {loading ? (
            <EmptyState message="Loading users..." />
          ) : users.length === 0 ? (
            <EmptyState message="No users yet. Invite your delivery leads and developers." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {users.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {entry.displayName}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{entry.email}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {entry.role.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {entry.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={resettingUserId === entry.id}
                          onClick={() => {
                            void handleResetPassword(entry.id, entry.email);
                          }}
                        >
                          {resettingUserId === entry.id ? "Sending…" : "Reset password"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          id="mappings"
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/70"
        >
          <SectionHeader
            title="Account mapping"
            description="Map Jira accounts to Jira++ users, enabling unified analytics across multiple sites."
            action={
              <Button
                onClick={() => setActiveModal("mapping")}
                disabled={!selectedUserId || projects.length === 0}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Map Jira account
              </Button>
            }
          />
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <label className="flex flex-1 flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                Choose a platform user
              </span>
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
                value={selectedUserId ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedUserId(value || null);
                  if (value) {
                    void fetchLinks({ variables: { userId: value } });
                  }
                }}
              >
                <option value="">Select user</option>
                {users.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.displayName} ({entry.email})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedUserId ? (
            linksLoading ? (
              <EmptyState message="Loading mappings..." />
            ) : linkData?.userProjectLinks?.length ? (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Project</th>
                      <th className="px-4 py-3 font-semibold">Site</th>
                      <th className="px-4 py-3 font-semibold">Jira account</th>
                      <th className="px-4 py-3 font-semibold">Mapped</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {linkData.userProjectLinks.map((link) => (
                      <tr key={link.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {link.project.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {link.project.site.alias}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {link.jiraAccountId}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {formatDate(link.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <UnlinkButton
                            linkId={link.id}
                            onSuccess={async () => {
                              if (selectedUserId) {
                                await fetchLinks({ variables: { userId: selectedUserId } });
                              }
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="No mappings yet for this user." />
            )
          ) : (
            <EmptyState message="Select a user to review mappings." />
          )}
        </section>
      </div>

      <RegisterSiteModal
        open={activeModal === "site"}
        onClose={() => setActiveModal(null)}
        onCompleted={() => {
          setActiveModal(null);
          void refetch();
        }}
      />
      <RegisterProjectModal
        open={activeModal === "project"}
        onClose={() => setActiveModal(null)}
        sites={sites}
        onCompleted={() => {
          setActiveModal(null);
          void refetch();
        }}
      />
      <CreateUserModal
        open={activeModal === "user"}
        onClose={() => setActiveModal(null)}
        onCompleted={() => {
          setActiveModal(null);
          void refetch();
        }}
      />
      <ImportUsersModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        sites={sites}
        projects={projects}
        onCompleted={async () => {
          setImportModalOpen(false);
          await refetch();
        }}
      />
      <MapUserModal
        open={activeModal === "mapping"}
        onClose={() => setActiveModal(null)}
        selectedUser={selectedUser}
        projects={projects}
        onCompleted={async () => {
          setActiveModal(null);
          void refetch();
          if (selectedUserId) {
            await refetchLinks?.({ userId: selectedUserId });
          }
        }}
      />
      <ProjectUsersModal
        open={projectUsersModal !== null}
        project={projectUsersModal}
        onClose={() => setProjectUsersModal(null)}
        onCompleted={async () => {
          setProjectUsersModal(null);
          await refetch();
        }}
      />
      <ProjectSyncModal
        project={projectSyncModal}
        onClose={() => setProjectSyncModal(null)}
        onSuccess={async () => {
          await refetch();
        }}
      />
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error.message}
        </div>
      ) : null}
    </div>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {action}
    </div>
  );
}

function OverviewCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: number;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/60">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-2 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {caption}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
      {message}
    </div>
  );
}

function RegisterSiteModal({
  open,
  onClose,
  onCompleted,
}: {
  open: boolean;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [alias, setAlias] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [registerSite, { loading }] = useMutation(REGISTER_SITE_MUTATION);

  useEffect(() => {
    if (!open) {
      setAlias("");
      setBaseUrl("");
      setAdminEmail("");
      setApiToken("");
      setMessage(null);
    }
  }, [open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    void registerSite({
      variables: { input: { alias, baseUrl, adminEmail, apiToken } },
      onCompleted,
      onError: (mutationError) => {
        setMessage(mutationError.message);
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register Jira site"
      description="Jira++ will encrypt API credentials before persisting them. Test connections are on the roadmap."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input label="Alias" value={alias} onChange={setAlias} placeholder="Acme Cloud Jira" required />
        <Input
          label="Base URL"
          value={baseUrl}
          onChange={setBaseUrl}
          placeholder="https://acme.atlassian.net"
          required
        />
        <Input
          label="Admin email"
          value={adminEmail}
          onChange={setAdminEmail}
          placeholder="admin@acme.com"
          type="email"
          required
        />
        <Input
          label="API token"
          value={apiToken}
          onChange={setApiToken}
          placeholder="••••••••"
          type="password"
          required
        />
        {message ? <InlineMessage tone="error">{message}</InlineMessage> : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Register site"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RegisterProjectModal({
  open,
  onClose,
  onCompleted,
  sites,
}: {
  open: boolean;
  onClose: () => void;
  onCompleted: () => void;
  sites: Array<{
    id: string;
    alias: string;
  }>;
}) {
  const [siteId, setSiteId] = useState<string>("");
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [jiraId, setJiraId] = useState("");
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [registerProject, { loading }] = useMutation(REGISTER_PROJECT_MUTATION);
  const [loadOptions, { data: optionsData, loading: optionsLoading, error: optionsError }] =
    useLazyQuery<ProjectOptionsData>(PROJECT_OPTIONS_QUERY);
  const projectOptions = optionsData?.jiraProjectOptions ?? ([] as ProjectOptionsData["jiraProjectOptions"]);

  useEffect(() => {
    if (!open) {
      setSiteId("");
      setSelectedOptionId("");
      setJiraId("");
      setKey("");
      setName("");
      setMessage(null);
      return;
    }

    const defaultSite = sites[0];
    if (defaultSite) {
      setSiteId(defaultSite.id);
    void loadOptions({ variables: { siteId: defaultSite.id, forceRefresh: false } });
    }
  }, [loadOptions, open, sites]);

  useEffect(() => {
    if (!open || !siteId) {
      return;
    }
    setSelectedOptionId("");
    setJiraId("");
    setKey("");
    setName("");
    void loadOptions({ variables: { siteId, forceRefresh: false } });
  }, [loadOptions, open, siteId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!siteId) {
      setMessage("Select a Jira site.");
      return;
    }
    void registerProject({
      variables: { input: { siteId, jiraId, key, name } },
      onCompleted,
      onError: (mutationError) => {
        setMessage(mutationError.message);
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register Jira project"
      description="Limit intake to the projects you want surfaced in Jira++. Auto-discovery arrives in a future release."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-700 dark:text-slate-200">Jira site</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
            value={siteId}
            onChange={(event) => setSiteId(event.target.value)}
          >
            {sites.length === 0 ? (
              <option value="">No sites available</option>
            ) : (
              sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.alias}
                </option>
              ))
            )}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-700 dark:text-slate-200">Jira project</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
            value={selectedOptionId}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedOptionId(value);
              if (!value) {
                setJiraId("");
                setKey("");
                setName("");
                return;
              }
              const selected = projectOptions.find((option) => option.id === value);
              if (selected) {
                setJiraId(selected.id);
                setKey(selected.key);
                setName(selected.name);
              }
            }}
          >
            <option value="">Manual entry</option>
            {projectOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} ({option.key})
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {optionsLoading
              ? "Loading projects from Jira..."
              : optionsError
                ? optionsError.message
                : "Pick a project discovered via the Jira API or stay on manual entry."}
          </p>
        </label>
        <Input
          label="Jira project ID"
          value={jiraId}
          onChange={setJiraId}
          placeholder="10001"
          required
        />
        <Input label="Key" value={key} onChange={setKey} placeholder="PROJ" required />
        <Input
          label="Name"
          value={name}
          onChange={setName}
          placeholder="Project Mars"
          required
        />
        {message ? <InlineMessage tone="error">{message}</InlineMessage> : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading || sites.length === 0}>
            {loading ? "Saving…" : "Register project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CreateUserModal({
  open,
  onClose,
  onCompleted,
}: {
  open: boolean;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "USER">("USER");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [createUser, { loading }] = useMutation(CREATE_USER_MUTATION);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setDisplayName("");
      setRole("USER");
      setPhone("");
      setMessage(null);
    }
  }, [open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    void createUser({
      variables: {
        input: {
          email,
          displayName,
          role,
          phone: phone || null,
          sendInvite: true,
        },
      },
      onCompleted,
      onError: (mutationError) => {
        setMessage(mutationError.message);
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite platform user"
      description="An invitation email with a temporary password will be sent automatically."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          placeholder="teammate@acme.com"
          required
        />
        <Input
          label="Display name"
          value={displayName}
          onChange={setDisplayName}
          placeholder="Taylor Jenkins"
          required
        />
        <Input
          label="Phone (optional)"
          value={phone}
          onChange={setPhone}
          placeholder="+1 555 0100"
          type="tel"
        />
        <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-700 dark:text-slate-200">Role</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
            value={role}
            onChange={(event) => setRole(event.target.value as "ADMIN" | "MANAGER" | "USER")}
          >
            <option value="USER">User</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        {message ? <InlineMessage tone="error">{message}</InlineMessage> : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create user"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ImportUsersModal({
  open,
  onClose,
  onCompleted,
  sites,
  projects,
}: {
  open: boolean;
  onClose: () => void;
  onCompleted: () => Promise<void> | void;
  sites: Array<{ id: string; alias: string }>;
  projects: Array<{
    id: string;
    siteId: string;
    siteAlias: string;
    key: string;
    name: string;
  }>;
}) {
  const [siteId, setSiteId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sendEmails, setSendEmails] = useState(true);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<Record<string, ImportUserRow>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<ProjectUserDetail[]>([]);
  const [assignableCache, setAssignableCache] = useState<Record<string, ProjectUserDetail[]>>({});

  const [loadOptions, { data: optionsData, loading: optionsLoading, error: optionsError }] =
    useLazyQuery<ProjectUserOptionsData>(PROJECT_USERS_OPTIONS_QUERY);
  const [createUser] = useMutation(CREATE_USER_MUTATION);
  const [mapUser] = useMutation(MAP_USER_MUTATION);

  const projectOptionsForSite = useMemo(
    () => projects.filter((project) => project.siteId === siteId),
    [projects, siteId],
  );

  useEffect(() => {
    if (!open) {
      setSiteId("");
      setProjectId("");
      setSelectedAccounts(new Set());
      setRows({});
      setSearch("");
      setMessage(null);
      setAssignableUsers([]);
      return;
    }
    const defaultSite = sites[0];
    if (defaultSite) {
      setSiteId(defaultSite.id);
    }
  }, [open, sites]);

  useEffect(() => {
    if (!open || !siteId) {
      return;
    }
    const firstProject = projects.find((project) => project.siteId === siteId);
    if (firstProject) {
      setProjectId(firstProject.id);
    }
  }, [open, siteId, projects]);

  useEffect(() => {
    if (!open || !projectId) {
      return;
    }
    setSelectedAccounts(new Set());
    setRows({});
    setSearch("");
    const project = projects.find((entry) => entry.id === projectId);
    if (!project) {
      setAssignableUsers([]);
      return;
    }
    const cacheKey = `${project.siteId}:${project.id}`;
    const cached = assignableCache[cacheKey];
    if (cached) {
      setAssignableUsers(cached);
    } else {
      setAssignableUsers([]);
      void loadOptions({
        variables: { siteId: project.siteId, projectKey: project.key },
        fetchPolicy: "network-only",
      });
    }
  }, [open, projectId, projects, assignableCache, loadOptions]);

  useEffect(() => {
    if (!open || !projectId) {
      return;
    }
    const project = projects.find((entry) => entry.id === projectId);
    if (!project) {
      return;
    }
    if (optionsData?.jiraProjectUserOptions) {
      const key = `${project.siteId}:${project.id}`;
      setAssignableUsers(optionsData.jiraProjectUserOptions);
      setAssignableCache((previous) => ({
        ...previous,
        [key]: optionsData.jiraProjectUserOptions ?? [],
      }));
    }
  }, [open, optionsData?.jiraProjectUserOptions, projectId, projects]);

  useEffect(() => {
    if (!open || assignableUsers.length === 0) {
      return;
    }
    setRows((previous) => {
      const next = { ...previous };
      for (const candidate of assignableUsers) {
        const key = candidate.accountId;
        if (!next[key]) {
          next[key] = {
            accountId: key,
            displayName: candidate.displayName || key,
            email: candidate.email ?? "",
            phone: "",
            role: "USER",
          };
        }
      }
      return next;
    });
    setSelectedAccounts((prev) => {
      if (prev.size > 0) {
        return prev;
      }
      return new Set(assignableUsers.map((user) => user.accountId));
    });
  }, [assignableUsers, open]);

  const filteredCandidates = useMemo(() => {
    if (!search.trim()) {
      return assignableUsers;
    }
    const term = search.trim().toLowerCase();
    return assignableUsers.filter((candidate) => {
      const haystack = [candidate.displayName ?? "", candidate.email ?? "", candidate.accountId]
        .join("\n")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [assignableUsers, search]);

  const toggleSelection = (accountId: string) => {
    setSelectedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const updateRow = (accountId: string, patch: Partial<ImportUserRow>) => {
    setRows((prev) => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        ...patch,
      },
    }));
  };

  const handleImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId) {
      setMessage("Select a Jira project before importing.");
      return;
    }
    if (selectedAccounts.size === 0) {
      setMessage("Select at least one Jira user to import.");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    const errors: string[] = [];

    for (const accountId of selectedAccounts) {
      const row = rows[accountId];
      if (!row) {
        continue;
      }
      if (!row.email.trim()) {
        errors.push(`${row.displayName} requires an email address.`);
        continue;
      }
      let createdUserId: string | null = null;
      try {
        const response = await createUser({
          variables: {
            input: {
              email: row.email.trim(),
              displayName: row.displayName.trim() || accountId,
              phone: row.phone.trim() ? row.phone.trim() : null,
              role: row.role,
              sendInvite: sendEmails,
            },
          },
        });
        createdUserId = response.data?.createUser?.id ?? null;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to import user.";
        errors.push(`${row.displayName || accountId}: ${message}`);
        continue;
      }

      if (createdUserId) {
        try {
          await mapUser({
            variables: {
              input: {
                userId: createdUserId,
                projectId,
                jiraAccountId: row.accountId,
              },
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to map user to project.";
          errors.push(`${row.displayName || accountId}: ${message}`);
        }
      }
    }

    setSubmitting(false);

    if (errors.length) {
      setMessage(errors.join("\n"));
      return;
    }

    await onCompleted();
  };

  const activeSite = sites.find((site) => site.id === siteId);
  const activeProject = projects.find((project) => project.id === projectId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import Jira users"
      description="Select Jira accounts to create platform users. Details can be adjusted before import."
      contentClassName="w-full max-w-6xl xl:max-w-7xl"
      primaryAction={
        <Button type="submit" form="import-users-form" disabled={submitting || selectedAccounts.size === 0}>
          {submitting
            ? "Importing…"
            : selectedAccounts.size === 0
              ? "Import"
              : `Import ${selectedAccounts.size} user${selectedAccounts.size === 1 ? "" : "s"}`}
        </Button>
      }
    >
      <form id="import-users-form" className="space-y-4" onSubmit={handleImport}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-700 dark:text-slate-200">Jira site</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
              value={siteId}
              onChange={(event) => setSiteId(event.target.value)}
            >
              {sites.length === 0 ? <option value="">No Jira sites</option> : null}
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.alias}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-700 dark:text-slate-200">Jira project</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            >
              {projectOptionsForSite.length === 0 ? <option value="">No projects</option> : null}
              {projectOptionsForSite.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.key})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Importing from {activeProject?.name ?? "selected project"} · {activeSite?.alias ?? ""}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Jira users…"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-400 dark:focus:ring-slate-700"
            />
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900"
                checked={sendEmails}
                onChange={(event) => setSendEmails(event.target.checked)}
              />
              Send invite emails
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!projectId) {
                  return;
                }
                const project = projects.find((entry) => entry.id === projectId);
                if (!project) {
                  return;
                }
                const key = `${project.siteId}:${project.id}`;
                setAssignableCache((prev) => {
                  const next = { ...prev };
                  delete next[key];
                  return next;
                });
                setAssignableUsers([]);
                void loadOptions({
                  variables: { siteId: project.siteId, projectKey: project.key },
                  fetchPolicy: "network-only",
                });
              }}
            >
              Refresh list
            </Button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          {optionsLoading ? (
            <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading Jira users…</p>
          ) : filteredCandidates.length === 0 ? (
            <p className="p-4 text-sm text-slate-500 dark:text-slate-400">
              No assignable users found for this project.
            </p>
          ) : (
            <table className="min-w-[1100px] divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900"
                      checked={selectedAccounts.size > 0 && filteredCandidates.every((candidate) => selectedAccounts.has(candidate.accountId))}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedAccounts(new Set(filteredCandidates.map((candidate) => candidate.accountId)));
                        } else {
                          setSelectedAccounts(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="px-3 py-2 font-semibold">Jira account</th>
                  <th className="px-3 py-2 font-semibold">Display name</th>
                  <th className="px-3 py-2 font-semibold">Email</th>
                  <th className="px-3 py-2 font-semibold">Phone</th>
                  <th className="px-3 py-2 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredCandidates.map((candidate) => {
                  const row = rows[candidate.accountId];
                  if (!row) {
                    return null;
                  }
                  const selected = selectedAccounts.has(candidate.accountId);
                  return (
                    <tr key={candidate.accountId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                      <td className="px-3 py-3 align-top">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900"
                          checked={selected}
                          onChange={() => toggleSelection(candidate.accountId)}
                        />
                      </td>
                      <td className="px-3 py-3 align-top text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col text-xs">
                          <span className="font-mono">{candidate.accountId}</span>
                          {candidate.email ? <span>{candidate.email}</span> : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          type="text"
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-400 dark:focus:ring-slate-700"
                          value={row.displayName}
                          onChange={(event) => updateRow(candidate.accountId, { displayName: event.target.value })}
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          type="email"
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-400 dark:focus:ring-slate-700"
                          value={row.email}
                          onChange={(event) => updateRow(candidate.accountId, { email: event.target.value })}
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          type="tel"
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-400 dark:focus:ring-slate-700"
                          value={row.phone}
                          onChange={(event) => updateRow(candidate.accountId, { phone: event.target.value })}
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <select
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-400 dark:focus:ring-slate-700"
                          value={row.role}
                          onChange={(event) =>
                            updateRow(candidate.accountId, {
                              role: event.target.value as "ADMIN" | "MANAGER" | "USER",
                            })
                          }
                        >
                          <option value="USER">User</option>
                          <option value="MANAGER">Manager</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {optionsError ? <InlineMessage tone="error">{optionsError.message}</InlineMessage> : null}
        {message ? <InlineMessage tone="error">{message.split("\n").map((line, index) => (
          <span key={index} className="block">
            {line}
          </span>
        ))}</InlineMessage> : null}
      </form>
    </Modal>
  );
}

function MapUserModal({
  open,
  onClose,
  onCompleted,
  selectedUser,
  projects,
}: {
  open: boolean;
  onClose: () => void;
  onCompleted: () => Promise<void> | void;
  selectedUser: { id: string; displayName: string; email: string } | null;
  projects: Array<{
    id: string;
    name: string;
    key: string;
    siteAlias: string;
    trackedUsers: Array<{
      jiraAccountId: string;
      displayName: string;
      email?: string | null;
      avatarUrl?: string | null;
      isTracked: boolean;
    }>;
  }>;
}) {
  const [projectId, setProjectId] = useState<string>("");
  const [jiraAccountId, setJiraAccountId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [mapUser, { loading }] = useMutation(MAP_USER_MUTATION);
  const selectedProject = useMemo(
    () => projects.find((entry) => entry.id === projectId) ?? null,
    [projectId, projects],
  );
  const trackedUsers = useMemo(
    () => selectedProject?.trackedUsers.filter((user) => user.isTracked) ?? [],
    [selectedProject],
  );

  useEffect(() => {
    if (!open) {
      setProjectId("");
      setJiraAccountId("");
      setMessage(null);
    } else if (projects.length > 0) {
      const defaultProject = projects[0];
      setProjectId(defaultProject.id);
      const tracked = defaultProject.trackedUsers.filter((user) => user.isTracked);
      if (tracked.length > 0) {
        setJiraAccountId(tracked[0].jiraAccountId);
      }
    }
  }, [open, projects]);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    const project = projects.find((entry) => entry.id === projectId);
    const tracked = project?.trackedUsers.filter((user) => user.isTracked) ?? [];
    if (tracked.length > 0 && (!jiraAccountId || !tracked.some((user) => user.jiraAccountId === jiraAccountId))) {
      setJiraAccountId(tracked[0].jiraAccountId);
    }
  }, [jiraAccountId, projectId, projects]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!selectedUser) {
      setMessage("Select a user from the mapping section before adding links.");
      return;
    }
    void mapUser({
      variables: {
        input: {
          userId: selectedUser.id,
          projectId,
          jiraAccountId,
        },
      },
      onCompleted,
      onError: (mutationError) => {
        setMessage(mutationError.message);
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Map Jira account"
      description="Associate Jira account IDs to merge worklogs, comments, and sprint insights for this teammate."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          {selectedUser ? (
            <p>
              Mapping for <strong>{selectedUser.displayName}</strong> ({selectedUser.email})
            </p>
          ) : (
            <p>Select a user in the Account Mapping section first.</p>
          )}
        </div>
        <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-700 dark:text-slate-200">Jira project</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            {projects.length === 0 ? (
              <option value="">No projects available</option>
            ) : (
              projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.siteAlias} · {project.key}
                </option>
              ))
            )}
          </select>
        </label>
        {trackedUsers.length > 0 ? (
          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Tracked Jira users
            </span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-slate-600"
              value={trackedUsers.some((user) => user.jiraAccountId === jiraAccountId) ? jiraAccountId : ""}
              onChange={(event) => setJiraAccountId(event.target.value)}
            >
              <option value="">Select tracked user</option>
              {trackedUsers.map((user) => (
                <option key={user.jiraAccountId} value={user.jiraAccountId}>
                  {user.displayName}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Choose from tracked Jira accounts or enter an ID manually below.
            </span>
          </label>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No tracked Jira users yet. Use “Manage Jira users” within the Projects section to configure
            the watchlist.
          </p>
        )}
        <Input
          label="Jira account ID"
          value={jiraAccountId}
          onChange={setJiraAccountId}
          placeholder="557058:abcd-1234"
          required
        />
        {message ? <InlineMessage tone="error">{message}</InlineMessage> : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading || !selectedUser || projects.length === 0}>
            {loading ? "Saving…" : "Save mapping"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ProjectUsersModal({
  open,
  onClose,
  onCompleted,
  project,
}: {
  open: boolean;
  onClose: () => void;
  onCompleted: () => Promise<void> | void;
  project:
    | {
        projectId: string;
        projectKey: string;
        projectName: string;
        siteId: string;
        siteAlias: string;
      }
    | null;
}) {
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadOptions, { data: optionsData, loading: optionsLoading, error: optionsError }] =
    useLazyQuery<ProjectUserOptionsData>(PROJECT_USERS_OPTIONS_QUERY);
  const { data: trackedData, loading: trackedLoading, refetch: refetchTracked } = useQuery<TrackedUsersData>(
    TRACKED_USERS_QUERY,
    {
      variables: { projectId: project?.projectId ?? "" },
      skip: !open || !project?.projectId,
    },
  );
  const [setTrackedUsers, { loading: saving }] = useMutation(SET_TRACKED_USERS_MUTATION);

  useEffect(() => {
    if (!open || !project) {
      return;
    }
    void loadOptions({
      variables: { siteId: project.siteId, projectKey: project.projectKey, forceRefresh: false },
      fetchPolicy: "network-only",
    });
  }, [loadOptions, open, project]);

  useEffect(() => {
    if (!open) {
      setSelectedAccounts(new Set());
      setSearchTerm("");
      return;
    }
    const tracked = trackedData?.projectTrackedUsers ?? [];
    setSelectedAccounts(
      new Set(tracked.filter((user) => user.isTracked).map((user) => user.jiraAccountId)),
    );
  }, [open, trackedData]);

  const suggestions = useMemo(
    () => optionsData?.jiraProjectUserOptions ?? ([] as ProjectUserOptionsData["jiraProjectUserOptions"]),
    [optionsData?.jiraProjectUserOptions],
  );
  const trackedUsers = useMemo(
    () => trackedData?.projectTrackedUsers ?? ([] as TrackedUsersData["projectTrackedUsers"]),
    [trackedData?.projectTrackedUsers],
  );

  const combined = useMemo(() => {
    const map = new Map<string, ProjectUserDetail>();

    for (const user of trackedUsers) {
      map.set(user.jiraAccountId, {
        accountId: user.jiraAccountId,
        displayName: user.displayName,
        email: user.email ?? null,
        avatarUrl: user.avatarUrl ?? null,
      });
    }

    for (const user of suggestions) {
      const existing = map.get(user.accountId);
      map.set(user.accountId, {
        accountId: user.accountId,
        displayName: user.displayName || existing?.displayName || user.accountId,
        email: user.email ?? existing?.email ?? null,
        avatarUrl: user.avatarUrl ?? existing?.avatarUrl ?? null,
      });
    }

    return Array.from(map.values()).sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }),
    );
  }, [suggestions, trackedUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return combined;
    }
    const term = searchTerm.trim().toLowerCase();
    return combined.filter((user) => {
      const haystack = [user.displayName, user.email ?? "", user.accountId]
        .join("\n")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [combined, searchTerm]);

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) {
      return;
    }
    setMessage(null);
    const payload: TrackedUserPayload[] = Array.from(selectedAccounts).reduce<
      TrackedUserPayload[]
    >((acc, accountId) => {
      const detail = combined.find((user) => user.accountId === accountId);
      if (!detail) {
        return acc;
      }
      acc.push({
        jiraAccountId: detail.accountId,
        displayName: detail.displayName,
        email: detail.email ?? null,
        avatarUrl: detail.avatarUrl ?? null,
        isTracked: true,
      });
      return acc;
    }, []);

    try {
      await setTrackedUsers({
        variables: {
          input: {
            projectId: project.projectId,
            users: payload,
          },
        },
      });
      await refetchTracked();
      await onCompleted();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Failed to update tracked users.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage Jira users"
      description="Toggle which Jira accounts Jira++ should track for this project."
      primaryAction={
        <Button type="submit" form="project-users-form" disabled={saving}>
          {saving ? "Saving…" : "Save selection"}
        </Button>
      }
    >
      <form id="project-users-form" className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          {project ? (
            <p>
              <strong>{project.projectName}</strong> ({project.projectKey}) · {project.siteAlias}
            </p>
          ) : (
            <p>Select a project to manage tracked Jira users.</p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Jira data refreshes live from your site. Accounts toggled on are eligible for boards and
            analytics.
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search Jira users…"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-400 dark:focus:ring-slate-700"
            />
            <div className="flex items-center gap-2">
              {searchTerm ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setSearchTerm("")}>
                  Clear
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (project) {
                    void loadOptions({
                      variables: { siteId: project.siteId, projectKey: project.projectKey, forceRefresh: true },
                      fetchPolicy: "network-only",
                    });
                  }
                }}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          {optionsLoading || trackedLoading ? (
            <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading Jira users…</p>
          ) : filteredUsers.length === 0 ? (
            <p className="p-4 text-sm text-slate-500 dark:text-slate-400">
              No assignable users were returned for this project. Ensure the Jira API token has access to
              view members.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
              {filteredUsers.map((user) => {
                const checked = selectedAccounts.has(user.accountId);
                return (
                  <li key={user.accountId} className="flex items-center gap-4 px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900"
                      checked={checked}
                      onChange={() => toggleAccount(user.accountId)}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {user.accountId}
                        {user.email ? ` · ${user.email}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {optionsError ? (
          <InlineMessage tone="error">{optionsError.message}</InlineMessage>
        ) : null}
        {message ? <InlineMessage tone="error">{message}</InlineMessage> : null}
      </form>
    </Modal>
  );
}

function ProjectSyncModal({
  project,
  onClose,
  onSuccess,
}: {
  project:
    | {
        projectId: string;
        projectKey: string;
        projectName: string;
        siteAlias: string;
        job:
          | {
              id: string;
              status: string;
              cronSchedule: string;
              lastRunAt: string | null;
              nextRunAt: string | null;
            }
          | null;
        syncStates: Array<{
          id: string;
          entity: string;
          status: string;
          lastSyncTime: string | null;
        }>;
      }
    | null;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [cronValue, setCronValue] = useState("*/15 * * * *");
  const [fetchLogs, { data: logsData, loading: logsLoading, refetch: refetchLogs }] =
    useLazyQuery<SyncLogsData>(SYNC_LOGS_QUERY);
  const [startSync, { loading: startLoading }] = useMutation(START_SYNC_MUTATION);
  const [pauseSync, { loading: pauseLoading }] = useMutation(PAUSE_SYNC_MUTATION);
  const [resumeSync, { loading: resumeLoading }] = useMutation(RESUME_SYNC_MUTATION);
  const [rescheduleSync, { loading: rescheduleLoading }] = useMutation(RESCHEDULE_SYNC_MUTATION);
  const [triggerSync, { loading: triggerLoading }] = useMutation(TRIGGER_SYNC_MUTATION);

  useEffect(() => {
    if (project) {
      setCronValue(project.job?.cronSchedule ?? "*/15 * * * *");
      void fetchLogs({ variables: { projectId: project.projectId, limit: 20 } });
    }
  }, [project, fetchLogs]);

  if (!project) {
    return null;
  }

  const logs = logsData?.syncLogs ?? [];
  const isPaused = project.job?.status === "PAUSED";

  const formatOptionalDate = (value: string | null | undefined) =>
    value ? formatDate(value) : "—";

  const handleAction = async (action: () => Promise<unknown>) => {
    await action();
    await onSuccess();
    onClose();
  };

  return (
    <Modal
      open={Boolean(project)}
      onClose={onClose}
      title="Manage sync"
      description={`Temporal schedule for ${project.projectName} (${project.projectKey})`}
    >
      <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Status: {project.job?.status ?? "PENDING"}</span>
            <span>Last run: {formatOptionalDate(project.job?.lastRunAt)}</span>
            <span>Next run: {formatOptionalDate(project.job?.nextRunAt)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={startLoading}
            onClick={() => handleAction(() => startSync({ variables: { projectId: project.projectId } }))}
          >
            {startLoading ? "Starting…" : "Start schedule & run"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={triggerLoading}
            onClick={() => handleAction(() => triggerSync({ variables: { projectId: project.projectId } }))}
          >
            {triggerLoading ? "Triggering…" : "Trigger incremental"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={triggerLoading}
            onClick={() => handleAction(() => triggerSync({ variables: { projectId: project.projectId, full: true } }))}
          >
            {triggerLoading ? "Triggering…" : "Trigger full resync"}
          </Button>
          {isPaused ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={resumeLoading}
              onClick={() => handleAction(() => resumeSync({ variables: { projectId: project.projectId } }))}
            >
              {resumeLoading ? "Resuming…" : "Resume schedule"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pauseLoading}
              onClick={() => handleAction(() => pauseSync({ variables: { projectId: project.projectId } }))}
            >
              {pauseLoading ? "Pausing…" : "Pause schedule"}
            </Button>
          )}
        </div>

        <form
          className="space-y-2"
          onSubmit={async (event) => {
            event.preventDefault();
            await handleAction(() =>
              rescheduleSync({ variables: { projectId: project.projectId, cron: cronValue } }),
            );
          }}
        >
          <Input
            label="Cron schedule"
            value={cronValue}
            onChange={setCronValue}
            placeholder="*/15 * * * *"
            required
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" variant="outline" disabled={rescheduleLoading}>
              {rescheduleLoading ? "Updating…" : "Update"}
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Entities</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs dark:divide-slate-800">
              <thead className="bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Entity</th>
                  <th className="px-3 py-2 text-left font-semibold">Status</th>
                  <th className="px-3 py-2 text-left font-semibold">Last sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {project.syncStates.map((state) => (
                  <tr key={state.id}>
                    <td className="px-3 py-2 capitalize text-slate-600 dark:text-slate-300">
                      {state.entity}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{state.status}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                      {formatOptionalDate(state.lastSyncTime)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Recent logs</h4>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetchLogs?.()}>
              Refresh
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            {logsLoading ? (
              <p className="p-4 text-xs text-slate-500 dark:text-slate-400">Loading logs…</p>
            ) : logs.length === 0 ? (
              <p className="p-4 text-xs text-slate-500 dark:text-slate-400">No log entries yet.</p>
            ) : (
              <ul className="divide-y divide-slate-200 text-xs dark:divide-slate-800">
                {logs.map((log) => (
                  <li key={log.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {log.level}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {formatOptionalDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{log.message}</p>
                    {log.details ? (
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-100 p-2 text-[11px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function UnlinkButton({ linkId, onSuccess }: { linkId: string; onSuccess: () => void }) {
  const [unlink, { loading }] = useMutation(UNLINK_MUTATION);

  const handleClick = () => {
    void unlink({
      variables: { linkId },
      onCompleted: onSuccess,
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-900/20"
      onClick={handleClick}
      disabled={loading}
    >
      Remove
    </Button>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
      <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <input
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-slate-600"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
      />
    </label>
  );
}

function InlineMessage({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "error";
}) {
  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
      : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300";
  return (
    <p className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>
      {children}
    </p>
  );
}
