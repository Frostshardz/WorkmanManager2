export interface Database {
  public: {
    Tables: {
      workmen: {
        Row: {
          trn: string
          name: string
          company: string
          location: string
          created_at: string
          updated_at: string
        }
        Insert: {
          trn: string
          name: string
          company: string
          location: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          trn?: string
          name?: string
          company?: string
          location?: string
          updated_at?: string
        }
      }
      time_entries: {
        Row: {
          id: number
          workman_trn: string
          clock_in: string
          clock_out: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          workman_trn: string
          clock_in?: string
          clock_out?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          workman_trn?: string
          clock_in?: string
          clock_out?: string | null
          notes?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}