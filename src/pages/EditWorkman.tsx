import { useParams, useNavigate } from 'react-router-dom'
import { Edit } from 'lucide-react'
import { useWorkman } from '../hooks/useWorkmen'
import { Layout } from '../components/Layout'
import { WorkmanForm } from '../components/WorkmanForm'

export function EditWorkman() {
  const { trn } = useParams<{ trn: string }>()
  const navigate = useNavigate()
  const { data: workman, isLoading } = useWorkman(trn!)

  if (isLoading) {
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
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Edit className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Workman</h1>
              <p className="text-gray-600">Update {workman.name}'s information</p>
            </div>
          </div>
        </div>

        <div className="card">
          <WorkmanForm 
            workman={workman} 
            onSuccess={() => navigate(`/workman/${workman.trn}`)}
          />
        </div>
      </div>
    </Layout>
  )
}