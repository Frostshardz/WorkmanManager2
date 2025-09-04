import { MapPin, Users } from 'lucide-react'
import { useWorkmen, useWorkmanTimeEntries } from '../hooks/useWorkmen'
import { Layout } from '../components/Layout'
import { WorkmanCard } from '../components/WorkmanCard'

export function Locations() {
  const { data: workmen = [], isLoading } = useWorkmen()

  // Group workmen by location
  const workmenByLocation = workmen.reduce((acc, workman) => {
    const location = workman.location
    if (!acc[location]) {
      acc[location] = []
    }
    acc[location].push(workman)
    return acc
  }, {} as Record<string, typeof workmen>)

  // Get status for each workman
  const workmenWithStatus = Object.entries(workmenByLocation).map(([location, locationWorkmen]) => {
    const workmenWithStatusData = locationWorkmen.map(workman => {
      const { data: timeEntries = [] } = useWorkmanTimeEntries(workman.trn)
      const latestEntry = timeEntries[0]
      const status = latestEntry && !latestEntry.clock_out ? 'clocked_in' : 'clocked_out'
      
      return {
        ...workman,
        status,
        latestClockIn: latestEntry?.clock_in || null
      }
    })

    return {
      location,
      workmen: workmenWithStatusData,
      clockedInCount: workmenWithStatusData.filter(w => w.status === 'clocked_in').length
    }
  })

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
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
            <p className="text-gray-600">Workmen organized by work location</p>
          </div>
        </div>

        {/* Location Groups */}
        {workmenWithStatus.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No locations found</h3>
            <p className="mt-1 text-sm text-gray-500">Register workmen to see location groups.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {workmenWithStatus.map(({ location, workmen, clockedInCount }) => (
              <div key={location} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-semibold text-gray-900">{location}</h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{workmen.length} total</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                        <span>{clockedInCount} clocked in</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {workmen.map((workman) => (
                    <WorkmanCard
                      key={workman.trn}
                      workman={workman}
                      status={workman.status as 'clocked_in' | 'clocked_out'}
                      latestClockIn={workman.latestClockIn}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}