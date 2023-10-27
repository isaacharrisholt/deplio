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
      api_key: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          expires_at: string | null
          id: string
          key_hash: string
          name: string
          revoked_at: string | null
          revoked_by: string | null
          team_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          name: string
          revoked_at?: string | null
          revoked_by?: string | null
          team_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          name?: string
          revoked_at?: string | null
          revoked_by?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_key_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_key_revoked_by_fkey"
            columns: ["revoked_by"]
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_key_team_id_fkey"
            columns: ["team_id"]
            referencedRelation: "team"
            referencedColumns: ["id"]
          }
        ]
      }
      q_request: {
        Row: {
          api_key_id: string
          body: Json | null
          created_at: string
          deleted_at: string | null
          destination: string
          headers: Json | null
          id: string
          method: string
          query_params: Json | null
          team_id: string
        }
        Insert: {
          api_key_id: string
          body?: Json | null
          created_at?: string
          deleted_at?: string | null
          destination: string
          headers?: Json | null
          id?: string
          method: string
          query_params?: Json | null
          team_id: string
        }
        Update: {
          api_key_id?: string
          body?: Json | null
          created_at?: string
          deleted_at?: string | null
          destination?: string
          headers?: Json | null
          id?: string
          method?: string
          query_params?: Json | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "q_request_api_key_id_fkey"
            columns: ["api_key_id"]
            referencedRelation: "api_key"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "q_request_team_id_fkey"
            columns: ["team_id"]
            referencedRelation: "team"
            referencedColumns: ["id"]
          }
        ]
      }
      q_response: {
        Row: {
          body: Json | null
          created_at: string
          deleted_at: string | null
          headers: Json | null
          id: string
          request_id: string
          response_time_ns: number | null
          status_code: number | null
        }
        Insert: {
          body?: Json | null
          created_at?: string
          deleted_at?: string | null
          headers?: Json | null
          id?: string
          request_id: string
          response_time_ns?: number | null
          status_code?: number | null
        }
        Update: {
          body?: Json | null
          created_at?: string
          deleted_at?: string | null
          headers?: Json | null
          id?: string
          request_id?: string
          response_time_ns?: number | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "q_response_request_id_fkey"
            columns: ["request_id"]
            referencedRelation: "q_request"
            referencedColumns: ["id"]
          }
        ]
      }
      team: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["team_type"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["team_type"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["team_type"]
        }
        Relationships: []
      }
      team_user: {
        Row: {
          created_at: string
          deleted_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_user_team_id_fkey"
            columns: ["team_id"]
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_user_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "user"
            referencedColumns: ["id"]
          }
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
      team_type: "personal" | "organization"
      user_role: "admin" | "member"
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
            foreignKeyName: "buckets_owner_fkey"
            columns: ["owner"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          }
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

