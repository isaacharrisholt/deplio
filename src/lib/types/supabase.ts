import type { Database } from './database'

type TableName = keyof Database['public']['Tables']
type Select<Table extends TableName> = Database['public']['Tables'][Table]['Row']
type Insert<Table extends TableName> = Database['public']['Tables'][Table]['Insert']
type Update<Table extends TableName> = Database['public']['Tables'][Table]['Update']

type EnumName = keyof Database['public']['Enums']
type Enum<E extends EnumName> = Database['public']['Enums'][E]

/*
 * Tables
 */
// user
export type User = Select<'user'>
export type UserInsert = Insert<'user'>
export type UserUpdate = Update<'user'>

// team
export type Team = Select<'team'>
export type TeamInsert = Insert<'team'>
export type TeamUpdate = Update<'team'>

// team_user
export type TeamUser = Select<'team_user'>
export type TeamUserInsert = Insert<'team_user'>
export type TeamUserUpdate = Update<'team_user'>

// github_installation
export type GitHubInstallation = Select<'github_installation'>
export type GitHubInstallationInsert = Insert<'github_installation'>
export type GitHubInstallationUpdate = Update<'github_installation'>

// project
export type Project = Select<'project'>
export type ProjectInsert = Insert<'project'>
export type ProjectUpdate = Update<'project'>

// repo
export type Repo = Select<'repo'>
export type RepoInsert = Insert<'repo'>
export type RepoUpdate = Update<'repo'>

/*
 * Enums
 */
export type UserRole = Enum<'user_role'>
export type GitProvider = Enum<'git_provider'>
export type TeamType = Enum<'team_type'>

/*
 * Composite types
 */
export type TeamWithRole = Team & { role: UserRole }
export type UserWithTeams = User & {
  teams: TeamWithRole[]
  currentTeamId: Team['id']
}
