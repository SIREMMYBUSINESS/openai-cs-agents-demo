import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'patient' | 'admin'
          hospital_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'patient' | 'admin'
          hospital_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'patient' | 'admin'
          hospital_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hospitals: {
        Row: {
          id: string
          name: string
          address: string | null
          contact_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          contact_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          contact_email?: string | null
          created_at?: string
        }
      }
      research_projects: {
        Row: {
          id: string
          title: string
          description: string
          principal_investigator: string
          institution: string
          data_types: string[]
          purpose: string
          duration_months: number
          status: 'active' | 'completed' | 'paused'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          principal_investigator: string
          institution: string
          data_types: string[]
          purpose: string
          duration_months: number
          status?: 'active' | 'completed' | 'paused'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          principal_investigator?: string
          institution?: string
          data_types?: string[]
          purpose?: string
          duration_months?: number
          status?: 'active' | 'completed' | 'paused'
          created_at?: string
          updated_at?: string
        }
      }
      consent_records: {
        Row: {
          id: string
          patient_id: string
          project_id: string
          consent_given: boolean
          consent_date: string
          withdrawal_date: string | null
          data_retention_period: number
          specific_permissions: Record<string, any>
          gdpr_compliant: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          project_id: string
          consent_given: boolean
          consent_date: string
          withdrawal_date?: string | null
          data_retention_period: number
          specific_permissions?: Record<string, any>
          gdpr_compliant?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          project_id?: string
          consent_given?: boolean
          consent_date?: string
          withdrawal_date?: string | null
          data_retention_period?: number
          specific_permissions?: Record<string, any>
          gdpr_compliant?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string
          details: Record<string, any>
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string
          details?: Record<string, any>
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          resource_type?: string
          resource_id?: string
          details?: Record<string, any>
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
  }
}