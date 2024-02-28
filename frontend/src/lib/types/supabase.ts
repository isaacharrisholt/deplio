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

// api_key
export type APIKey = Select<'api_key'>

// q_request
export type QRequest = Select<'q_request'>

// q_response
export type QResponse = Select<'q_response'>

/*
 * Enums
 */
export type UserRole = Enum<'user_role'>
export type TeamType = Enum<'team_type'>

/*
 * Composite types
 */
export type TeamWithRole = Team & { role: UserRole }
export type UserWithTeams = User & {
  teams: TeamWithRole[]
  current_team_id: Team['id']
}
