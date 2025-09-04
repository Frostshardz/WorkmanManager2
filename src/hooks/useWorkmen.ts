import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Database } from '../lib/database.types'

type Workman = Database['public']['Tables']['workmen']['Row']
type WorkmanInsert = Database['public']['Tables']['workmen']['Insert']
type WorkmanUpdate = Database['public']['Tables']['workmen']['Update']
type TimeEntry = Database['public']['Tables']['time_entries']['Row']

export function useWorkmen(search?: string) {
  return useQuery({
    queryKey: ['workmen', search],
    queryFn: async () => {
      let query = supabase
        .from('workmen')
        .select('*')
        .order('name')

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Workman[]
    },
  })
}

export function useWorkman(trn: string) {
  return useQuery({
    queryKey: ['workman', trn],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workmen')
        .select('*')
        .eq('trn', trn)
        .single()

      if (error) throw error
      return data as Workman
    },
    enabled: !!trn,
  })
}

export function useWorkmanTimeEntries(trn: string) {
  return useQuery({
    queryKey: ['time-entries', trn],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('workman_trn', trn)
        .order('clock_in', { ascending: false })

      if (error) throw error
      return data as TimeEntry[]
    },
    enabled: !!trn,
  })
}

export function useCreateWorkman() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (workman: WorkmanInsert) => {
      const { data, error } = await supabase
        .from('workmen')
        .insert(workman)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workmen'] })
    },
  })
}

export function useUpdateWorkman() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ trn, updates }: { trn: string; updates: WorkmanUpdate }) => {
      const { data, error } = await supabase
        .from('workmen')
        .update(updates)
        .eq('trn', trn)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workmen'] })
      queryClient.invalidateQueries({ queryKey: ['workman', data.trn] })
    },
  })
}

export function useDeleteWorkman() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (trn: string) => {
      const { error } = await supabase
        .from('workmen')
        .delete()
        .eq('trn', trn)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workmen'] })
    },
  })
}

export function useClockIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ trn, notes }: { trn: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          workman_trn: trn,
          clock_in: new Date().toISOString(),
          notes,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workmen'] })
      queryClient.invalidateQueries({ queryKey: ['workman', data.workman_trn] })
      queryClient.invalidateQueries({ queryKey: ['time-entries', data.workman_trn] })
    },
  })
}

export function useClockOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ trn, notes }: { trn: string; notes?: string }) => {
      // First get the active entry
      const { data: activeEntry, error: fetchError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('workman_trn', trn)
        .is('clock_out', null)
        .single()

      if (fetchError) throw fetchError

      // Update with clock out time
      const { data, error } = await supabase
        .from('time_entries')
        .update({
          clock_out: new Date().toISOString(),
          notes: notes ? (activeEntry.notes ? `${activeEntry.notes} | ${notes}` : notes) : activeEntry.notes,
        })
        .eq('id', activeEntry.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workmen'] })
      queryClient.invalidateQueries({ queryKey: ['workman', data.workman_trn] })
      queryClient.invalidateQueries({ queryKey: ['time-entries', data.workman_trn] })
    },
  })
}