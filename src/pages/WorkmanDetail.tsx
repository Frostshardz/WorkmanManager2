import { useParams, Link, useNavigate } from 'react-router-dom'
import { Edit, Trash2, Clock, MapPin, Building2, User, Calendar, Play, Square } from 'lucide-react'
import { useWorkman, useWorkmanTimeEntries, useDeleteWorkman, useClockIn, useClockOut } from '../hooks/useWorkmen'
import { Layout } from '../components/Layout'
import { formatDateTime, calculateDuration } from '../lib/utils'
import { useState } from 'react'

export function WorkmanDetail() {
  const { trn } = useParams<{ trn: string }>()
  const navigate = useNavigate()
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  
  const { data: workman, isLoading: workmanLoading } = useWorkman(trn!)
  const { data: timeEntries = [], isLoading: entriesLoading } = useWorkmanTimeEntries(trn!)
  const deleteMutation = useDeleteWorkman()
  const clockInMutation = useClockIn()
  const clockOutMutation = useClockOut()

  if (workmanLoading || entriesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  if (!workman) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Workman not found</h2>
          <Link to="/" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </Layout>
    )
  }

  const activeEntry = timeEntries.find(entry => !entry.clock_out)
  const isClocked = !!activeEntry
  const completedEntries = timeEntries.filter(entry => entry.clock_out)
  const totalHours = completedEntries.reduce((sum, entry) => {
    const duration = calculateDuration(entry.clock_in, entry.clock_out)
    return sum + (duration?.total || 0)
  }, 0)

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${workman.name}? This action cannot be undone.`)) {
      try {
        await deleteMutation.mutateAsync(workman.trn)
        navigate('/')
      } catch (error) {
        console.error('Delete failed:', error)
      }
    }
  }

  const handleClockIn = async () => {
    try {
      await clockInMutation.mutateAsync({ trn: workman.trn, notes: notes || undefined })
      setNotes('')
      setShowNotes(false)
    } catch (error) {
      console.error('Clock in failed:', error)
    }
  }

  const handleClockOut = async () => {
    try {
      await clockOutMutation.mutateAsync({ trn: workman.trn, notes: notes || undefined })
      setNotes('')
      setShowNotes(false)
    } catch (error) {
      console.error('Clock out failed:', error)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{workman.name}</h1>
              <p className="text-gray-600">TRN: {workman.trn}</p>
              <span className={isClocked ? 'status-clocked-in' : 'status-clocked-out'}>
                {isClocked ? 'Currently Clocked In' : 'Clocked Out'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link to={`/workman/${workman.trn}/edit`} className="btn-secondary">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="btn-error"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Company</p>
                <p className="font-medium text-gray-900">{workman.company}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium text-gray-900">{workman.location}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="font-medium text-gray-900">{totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clock In/Out Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Time Tracking</h2>
          
          {activeEntry && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-4">
              <p className="text-success-800 font-medium">Currently clocked in</p>
              <p className="text-success-700 text-sm">
                Started at {formatDateTime(activeEntry.clock_in)}
              </p>
              {activeEntry.notes && (
                <p className="text-success-700 text-sm mt-1">Notes: {activeEntry.notes}</p>
              )}
            </div>
          )}

          {!showNotes ? (
            <div className="flex items-center space-x-3">
              {!isClocked ? (
                <button
                  onClick={() => setShowNotes(true)}
                  disabled={clockInMutation.isPending}
                  className="btn-success"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Clock In
                </button>
              ) : (
                <button
                  onClick={() => setShowNotes(true)}
                  disabled={clockOutMutation.isPending}
                  className="btn-warning"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Clock Out
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this time entry"
                  className="input"
                />
              </div>
              <div className="flex items-center space-x-3">
                {!isClocked ? (
                  <button
                    onClick={handleClockIn}
                    disabled={clockInMutation.isPending}
                    className="btn-success"
                  >
                    {clockInMutation.isPending ? 'Clocking In...' : 'Confirm Clock In'}
                  </button>
                ) : (
                  <button
                    onClick={handleClockOut}
                    disabled={clockOutMutation.isPending}
                    className="btn-warning"
                  >
                    {clockOutMutation.isPending ? 'Clocking Out...' : 'Confirm Clock Out'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowNotes(false)
                    setNotes('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Time History */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Time History</h2>
            <div className="text-sm text-gray-600">
              {completedEntries.length} completed sessions
            </div>
          </div>

          {timeEntries.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No time entries</h3>
              <p className="mt-1 text-sm text-gray-500">Clock in to start tracking time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timeEntries.map((entry) => {
                const duration = calculateDuration(entry.clock_in, entry.clock_out)
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDateTime(entry.clock_in)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {entry.clock_out ? `Ended: ${formatDateTime(entry.clock_out)}` : 'In Progress'}
                          </p>
                        </div>
                        {entry.notes && (
                          <div className="bg-gray-100 rounded px-2 py-1">
                            <p className="text-xs text-gray-700">{entry.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {duration ? (
                        <p className="font-medium text-gray-900">{duration.formatted}</p>
                      ) : (
                        <span className="status-clocked-in">Active</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}