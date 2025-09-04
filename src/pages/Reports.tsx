import { useState } from 'react'
import { BarChart3, Download, Filter } from 'lucide-react'
import { useWorkmen, useWorkmanTimeEntries } from '../hooks/useWorkmen'
import { Layout } from '../components/Layout'
import { formatDate, calculateDuration } from '../lib/utils'

export function Reports() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedWorkman, setSelectedWorkman] = useState('')
  
  const { data: workmen = [] } = useWorkmen()

  // Get time entries for all workmen
  const workmenWithEntries = workmen.map(workman => {
    const { data: timeEntries = [] } = useWorkmanTimeEntries(workman.trn)
    
    // Filter entries by date range
    let filteredEntries = timeEntries
    if (startDate) {
      filteredEntries = filteredEntries.filter(entry => 
        new Date(entry.clock_in) >= new Date(startDate)
      )
    }
    if (endDate) {
      filteredEntries = filteredEntries.filter(entry => 
        new Date(entry.clock_in) <= new Date(endDate + 'T23:59:59')
      )
    }

    const completedEntries = filteredEntries.filter(entry => entry.clock_out)
    const totalHours = completedEntries.reduce((sum, entry) => {
      const duration = calculateDuration(entry.clock_in, entry.clock_out)
      return sum + (duration?.total || 0)
    }, 0)

    return {
      workman,
      timeEntries: filteredEntries,
      completedSessions: completedEntries.length,
      activeSessions: filteredEntries.filter(entry => !entry.clock_out).length,
      totalHours
    }
  })

  // Filter by selected workman
  const filteredData = selectedWorkman 
    ? workmenWithEntries.filter(item => item.workman.trn === selectedWorkman)
    : workmenWithEntries

  const totalStats = filteredData.reduce(
    (acc, item) => ({
      totalHours: acc.totalHours + item.totalHours,
      completedSessions: acc.completedSessions + item.completedSessions,
      activeSessions: acc.activeSessions + item.activeSessions,
    }),
    { totalHours: 0, completedSessions: 0, activeSessions: 0 }
  )

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Time Reports</h1>
              <p className="text-gray-600">Track workforce productivity and hours</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workman
              </label>
              <select
                value={selectedWorkman}
                onChange={(e) => setSelectedWorkman(e.target.value)}
                className="input"
              >
                <option value="">All Workmen</option>
                {workmen.map(workman => (
                  <option key={workman.trn} value={workman.trn}>
                    {workman.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                  setSelectedWorkman('')
                }}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">{totalStats.totalHours.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Total Hours</p>
            </div>
          </div>
          <div className="card">
            <div className="text-center">
              <p className="text-3xl font-bold text-success-600">{totalStats.completedSessions}</p>
              <p className="text-sm text-gray-600">Completed Sessions</p>
            </div>
          </div>
          <div className="card">
            <div className="text-center">
              <p className="text-3xl font-bold text-warning-600">{totalStats.activeSessions}</p>
              <p className="text-sm text-gray-600">Active Sessions</p>
            </div>
          </div>
        </div>

        {/* Workman Summary */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Workman Summary</h2>
            <button className="btn-secondary">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workman
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.workman.trn} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.workman.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          TRN: {item.workman.trn}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.workman.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.totalHours.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.completedSessions}
                      {item.activeSessions > 0 && (
                        <span className="text-warning-600 ml-1">
                          (+{item.activeSessions} active)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={item.activeSessions > 0 ? 'status-clocked-in' : 'status-clocked-out'}>
                        {item.activeSessions > 0 ? 'Clocked In' : 'Clocked Out'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}