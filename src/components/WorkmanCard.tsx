import { Link } from 'react-router-dom'
import { Clock, MapPin, Building2, User, Play, Square } from 'lucide-react'
import { useClockIn, useClockOut } from '../hooks/useWorkmen'
import { useState } from 'react'
import { Database } from '../lib/database.types'

type Workman = Database['public']['Tables']['workmen']['Row']

interface WorkmanCardProps {
  workman: Workman
  status: 'clocked_in' | 'clocked_out'
  latestClockIn?: string | null
}

export function WorkmanCard({ workman, status, latestClockIn }: WorkmanCardProps) {
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const clockInMutation = useClockIn()
  const clockOutMutation = useClockOut()

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
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <div>
              <Link 
                to={`/workman/${workman.trn}`}
                className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
              >
                {workman.name}
              </Link>
              <p className="text-sm text-gray-500">TRN: {workman.trn}</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Building2 className="h-4 w-4 mr-2 text-gray-400" />
              {workman.company}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              {workman.location}
            </div>
            {latestClockIn && status === 'clocked_in' && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                Clocked in: {new Date(latestClockIn).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          <span className={status === 'clocked_in' ? 'status-clocked-in' : 'status-clocked-out'}>
            {status === 'clocked_in' ? 'Clocked In' : 'Clocked Out'}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex items-center justify-between">
          <Link
            to={`/workman/${workman.trn}`}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View Details →
          </Link>

          <div className="flex items-center space-x-2">
            {!showNotes && (
              <>
                {status === 'clocked_out' ? (
                  <button
                    onClick={() => setShowNotes(true)}
                    disabled={clockInMutation.isPending}
                    className="btn-success"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Clock In
                  </button>
                ) : (
                  <button
                    onClick={() => setShowNotes(true)}
                    disabled={clockOutMutation.isPending}
                    className="btn-warning"
                  >
                    <Square className="h-3 w-3 mr-1" />
                    Clock Out
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {showNotes && (
          <div className="mt-3 space-y-3">
            <input
              type="text"
              placeholder="Add notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input text-sm"
            />
            <div className="flex items-center space-x-2">
              {status === 'clocked_out' ? (
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
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}