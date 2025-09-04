import { Layout } from '../components/Layout'
import { WorkmanForm } from '../components/WorkmanForm'
import { UserPlus } from 'lucide-react'

export function RegisterWorkman() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Register New Workman</h1>
              <p className="text-gray-600">Add a new workman to the system</p>
            </div>
          </div>
        </div>

        <div className="card">
          <WorkmanForm />
        </div>
      </div>
    </Layout>
  )
}