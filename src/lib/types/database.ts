export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    graphql_public: {
        Tables: {
            [_ in never]: never
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            graphql: {
                Args: {
                    operationName?: string
                    query?: string
                    variables?: Json
                    extensions?: Json
                }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
    public: {
        Tables: {
            deployment: {
                Row: {
                    created_at: string
                    created_by: string
                    deleted_at: string | null
                    environment: string
                    id: string
                    redeployed_from: string | null
                    ref: string
                    repo_id: string
                    sha: string
                    status: string
                    url: string
                }
                Insert: {
                    created_at?: string
                    created_by: string
                    deleted_at?: string | null
                    environment: string
                    id?: string
                    redeployed_from?: string | null
                    ref: string
                    repo_id: string
                    sha: string
                    status: string
                    url: string
                }
                Update: {
                    created_at?: string
                    created_by?: string
                    deleted_at?: string | null
                    environment?: string
                    id?: string
                    redeployed_from?: string | null
                    ref?: string
                    repo_id?: string
                    sha?: string
                    status?: string
                    url?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'deployment_created_by_fkey'
                        columns: ['created_by']
                        referencedRelation: 'user'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'deployment_redeployed_from_fkey'
                        columns: ['redeployed_from']
                        referencedRelation: 'deployment'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'deployment_repo_id_fkey'
                        columns: ['repo_id']
                        referencedRelation: 'repo'
                        referencedColumns: ['id']
                    },
                ]
            }
            github_installation: {
                Row: {
                    created_at: string
                    deleted_at: string | null
                    id: string
                    installation_id: number
                    team_id: string
                }
                Insert: {
                    created_at?: string
                    deleted_at?: string | null
                    id?: string
                    installation_id: number
                    team_id: string
                }
                Update: {
                    created_at?: string
                    deleted_at?: string | null
                    id?: string
                    installation_id?: number
                    team_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'github_installation_team_id_fkey'
                        columns: ['team_id']
                        referencedRelation: 'team'
                        referencedColumns: ['id']
                    },
                ]
            }
            project: {
                Row: {
                    avatar_url: string | null
                    created_at: string
                    created_by: string
                    deleted_at: string | null
                    description: string | null
                    id: string
                    name: string
                    team_id: string
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    created_by: string
                    deleted_at?: string | null
                    description?: string | null
                    id?: string
                    name: string
                    team_id: string
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    created_by?: string
                    deleted_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                    team_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'project_created_by_fkey'
                        columns: ['created_by']
                        referencedRelation: 'user'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'project_team_id_fkey'
                        columns: ['team_id']
                        referencedRelation: 'team'
                        referencedColumns: ['id']
                    },
                ]
            }
            repo: {
                Row: {
                    created_at: string
                    deleted_at: string | null
                    full_name: string
                    git_provider: Database['public']['Enums']['git_provider']
                    id: string
                    name: string
                    project_id: string
                    provider_repo_id: string
                }
                Insert: {
                    created_at?: string
                    deleted_at?: string | null
                    full_name: string
                    git_provider: Database['public']['Enums']['git_provider']
                    id?: string
                    name: string
                    project_id: string
                    provider_repo_id: string
                }
                Update: {
                    created_at?: string
                    deleted_at?: string | null
                    full_name?: string
                    git_provider?: Database['public']['Enums']['git_provider']
                    id?: string
                    name?: string
                    project_id?: string
                    provider_repo_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'repo_project_id_fkey'
                        columns: ['project_id']
                        referencedRelation: 'project'
                        referencedColumns: ['id']
                    },
                ]
            }
            team: {
                Row: {
                    avatar_url: string | null
                    created_at: string
                    deleted_at: string | null
                    id: string
                    name: string
                    type: Database['public']['Enums']['team_type']
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    deleted_at?: string | null
                    id?: string
                    name: string
                    type: Database['public']['Enums']['team_type']
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    deleted_at?: string | null
                    id?: string
                    name?: string
                    type?: Database['public']['Enums']['team_type']
                }
                Relationships: []
            }
            team_user: {
                Row: {
                    created_at: string
                    deleted_at: string | null
                    role: Database['public']['Enums']['user_role']
                    team_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    deleted_at?: string | null
                    role?: Database['public']['Enums']['user_role']
                    team_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    deleted_at?: string | null
                    role?: Database['public']['Enums']['user_role']
                    team_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'team_user_team_id_fkey'
                        columns: ['team_id']
                        referencedRelation: 'team'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'team_user_user_id_fkey'
                        columns: ['user_id']
                        referencedRelation: 'user'
                        referencedColumns: ['id']
                    },
                ]
            }
            user: {
                Row: {
                    avatar_url: string | null
                    created_at: string
                    deleted_at: string | null
                    email: string
                    first_name: string | null
                    id: string
                    last_name: string | null
                    user_id: string
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    deleted_at?: string | null
                    email: string
                    first_name?: string | null
                    id?: string
                    last_name?: string | null
                    user_id: string
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    deleted_at?: string | null
                    email?: string
                    first_name?: string | null
                    id?: string
                    last_name?: string | null
                    user_id?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            can_insert_github_installation_with_check: {
                Args: {
                    gi: unknown
                }
                Returns: boolean
            }
            can_insert_project_with_check: {
                Args: {
                    p: unknown
                }
                Returns: boolean
            }
            can_insert_repo_with_check: {
                Args: {
                    r: unknown
                }
                Returns: boolean
            }
            can_insert_team_user_with_check: {
                Args: {
                    tu: unknown
                }
                Returns: boolean
            }
            can_insert_team_with_check: {
                Args: {
                    t: unknown
                }
                Returns: boolean
            }
            can_read_deployment_using: {
                Args: {
                    d: unknown
                }
                Returns: boolean
            }
            can_read_github_installation_using: {
                Args: {
                    gi: unknown
                }
                Returns: boolean
            }
            can_read_project_using: {
                Args: {
                    p: unknown
                }
                Returns: boolean
            }
            can_read_repo_using: {
                Args: {
                    r: unknown
                }
                Returns: boolean
            }
            can_read_team_user_using: {
                Args: {
                    tu: unknown
                }
                Returns: boolean
            }
            can_read_team_using: {
                Args: {
                    t: unknown
                }
                Returns: boolean
            }
            can_read_user_using: {
                Args: {
                    u: unknown
                }
                Returns: boolean
            }
            can_update_github_installation_using: {
                Args: {
                    gi: unknown
                }
                Returns: boolean
            }
            can_update_github_installation_with_check: {
                Args: {
                    gi: unknown
                }
                Returns: boolean
            }
            can_update_project_using: {
                Args: {
                    p: unknown
                }
                Returns: boolean
            }
            can_update_project_with_check: {
                Args: {
                    p: unknown
                }
                Returns: boolean
            }
            can_update_repo_using: {
                Args: {
                    r: unknown
                }
                Returns: boolean
            }
            can_update_repo_with_check: {
                Args: {
                    r: unknown
                }
                Returns: boolean
            }
            can_update_team_user_using: {
                Args: {
                    tu: unknown
                }
                Returns: boolean
            }
            can_update_team_user_with_check: {
                Args: {
                    tu: unknown
                }
                Returns: boolean
            }
            can_update_team_using: {
                Args: {
                    t: unknown
                }
                Returns: boolean
            }
            can_update_team_with_check: {
                Args: {
                    t: unknown
                }
                Returns: boolean
            }
            can_update_user_using: {
                Args: {
                    u: unknown
                }
                Returns: boolean
            }
            can_update_user_with_check: {
                Args: {
                    u: unknown
                }
                Returns: boolean
            }
            from_b64u: {
                Args: {
                    val: string
                }
                Returns: string
            }
            is_deleted: {
                Args: {
                    ts: string
                }
                Returns: boolean
            }
            stuid: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
            stuid_from_compact: {
                Args: {
                    compact: string
                }
                Returns: string
            }
            stuid_to_compact: {
                Args: {
                    stuid: string
                }
                Returns: string
            }
            stuid_tz: {
                Args: {
                    stuid: string
                }
                Returns: string
            }
            team_ids: {
                Args: Record<PropertyKey, never>
                Returns: string[]
            }
            to_b64u: {
                Args: {
                    val: string
                }
                Returns: string
            }
            tuid_zero: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
            tuid6: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
            tuid6_from_compact: {
                Args: {
                    compact: string
                }
                Returns: string
            }
            tuid6_from_tz: {
                Args: {
                    tz: string
                }
                Returns: string
            }
            tuid6_to_compact: {
                Args: {
                    tuid: string
                }
                Returns: string
            }
            tuid6_tz: {
                Args: {
                    tuid: string
                }
                Returns: string
            }
            tz_to_iso: {
                Args: {
                    tz: string
                }
                Returns: string
            }
            user_id: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
            user_is_team_admin: {
                Args: {
                    check_team_id: string
                    check_user_id?: string
                }
                Returns: boolean
            }
        }
        Enums: {
            git_provider: 'github'
            team_type: 'personal' | 'organization'
            user_role: 'admin' | 'member'
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
    storage: {
        Tables: {
            buckets: {
                Row: {
                    allowed_mime_types: string[] | null
                    avif_autodetection: boolean | null
                    created_at: string | null
                    file_size_limit: number | null
                    id: string
                    name: string
                    owner: string | null
                    public: boolean | null
                    updated_at: string | null
                }
                Insert: {
                    allowed_mime_types?: string[] | null
                    avif_autodetection?: boolean | null
                    created_at?: string | null
                    file_size_limit?: number | null
                    id: string
                    name: string
                    owner?: string | null
                    public?: boolean | null
                    updated_at?: string | null
                }
                Update: {
                    allowed_mime_types?: string[] | null
                    avif_autodetection?: boolean | null
                    created_at?: string | null
                    file_size_limit?: number | null
                    id?: string
                    name?: string
                    owner?: string | null
                    public?: boolean | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'buckets_owner_fkey'
                        columns: ['owner']
                        referencedRelation: 'users'
                        referencedColumns: ['id']
                    },
                ]
            }
            migrations: {
                Row: {
                    executed_at: string | null
                    hash: string
                    id: number
                    name: string
                }
                Insert: {
                    executed_at?: string | null
                    hash: string
                    id: number
                    name: string
                }
                Update: {
                    executed_at?: string | null
                    hash?: string
                    id?: number
                    name?: string
                }
                Relationships: []
            }
            objects: {
                Row: {
                    bucket_id: string | null
                    created_at: string | null
                    id: string
                    last_accessed_at: string | null
                    metadata: Json | null
                    name: string | null
                    owner: string | null
                    path_tokens: string[] | null
                    updated_at: string | null
                    version: string | null
                }
                Insert: {
                    bucket_id?: string | null
                    created_at?: string | null
                    id?: string
                    last_accessed_at?: string | null
                    metadata?: Json | null
                    name?: string | null
                    owner?: string | null
                    path_tokens?: string[] | null
                    updated_at?: string | null
                    version?: string | null
                }
                Update: {
                    bucket_id?: string | null
                    created_at?: string | null
                    id?: string
                    last_accessed_at?: string | null
                    metadata?: Json | null
                    name?: string | null
                    owner?: string | null
                    path_tokens?: string[] | null
                    updated_at?: string | null
                    version?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'objects_bucketId_fkey'
                        columns: ['bucket_id']
                        referencedRelation: 'buckets'
                        referencedColumns: ['id']
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            can_insert_object: {
                Args: {
                    bucketid: string
                    name: string
                    owner: string
                    metadata: Json
                }
                Returns: undefined
            }
            extension: {
                Args: {
                    name: string
                }
                Returns: string
            }
            filename: {
                Args: {
                    name: string
                }
                Returns: string
            }
            foldername: {
                Args: {
                    name: string
                }
                Returns: unknown
            }
            get_size_by_bucket: {
                Args: Record<PropertyKey, never>
                Returns: {
                    size: number
                    bucket_id: string
                }[]
            }
            search: {
                Args: {
                    prefix: string
                    bucketname: string
                    limits?: number
                    levels?: number
                    offsets?: number
                    search?: string
                    sortcolumn?: string
                    sortorder?: string
                }
                Returns: {
                    name: string
                    id: string
                    updated_at: string
                    created_at: string
                    last_accessed_at: string
                    metadata: Json
                }[]
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
