import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Clock } from 'lucide-react'
import { useWorkmen, useWorkmanTimeEntries } from '../hooks/useWorkmen'
import { WorkmanCard } from '../components/WorkmanCard'
import { SearchBar } from '../components/SearchBar'
import { Layout } from '../components/Layout'

export function Dashboard() {
  const [search, setSearch] = useState('')
  const { data: workmen = [], isLoading } = useWorkmen(search)

  // Get status for each workman by checking their latest time entry
  const workmenWithStatus = workmen.map(workman => {
    const { data: timeEntries = [] } = useWorkmanTimeEntries(workman.trn)
    const latestEntry = timeEntries[0]
    const status = latestEntry && !latestEntry.clock_out ? 'clocked_in' : 'clocked_out'
    
    return {
      ...workman,
      status,
      latestClockIn: latestEntry?.clock_in || null
    }
  })

  const clockedInCount = workmenWithStatus.filter(w => w.status === 'clocked_in').length
  const totalWorkmen = workmenWithStatus.length

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workmen Dashboard</h1>
            <p className="text-gray-600">Manage your workforce and track time</p>
          </div>
          <Link to="/register" className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Register Workman
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Workmen</p>
                <p className="text-2xl font-bold text-gray-900">{totalWorkmen}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-success-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Currently Clocked In</p>
                <p className="text-2xl font-bold text-gray-900">{clockedInCount}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{totalWorkmen - clockedInCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* Workmen Grid */}
        {workmenWithStatus.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No workmen found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search ? 'Try adjusting your search terms.' : 'Get started by registering your first workman.'}
            </p>
            {!search && (
              <div className="mt-6">
                <Link to="/register" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Register Workman
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workmenWithStatus.map((workman) => (
              <WorkmanCard
                key={workman.trn}
                workman={workman}
                status={workman.status as 'clocked_in' | 'clocked_out'}
                latestClockIn={workman.latestClockIn}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}