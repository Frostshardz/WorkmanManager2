import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateWorkman, useUpdateWorkman } from '../hooks/useWorkmen'
import { Database } from '../lib/database.types'
import { useNavigate } from 'react-router-dom'

type Workman = Database['public']['Tables']['workmen']['Row']

const workmanSchema = z.object({
  trn: z.string().min(1, 'TRN is required'),
  name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().min(1, 'Location is required'),
})

type WorkmanFormData = z.infer<typeof workmanSchema>

interface WorkmanFormProps {
  workman?: Workman
  onSuccess?: () => void
}

export function WorkmanForm({ workman, onSuccess }: WorkmanFormProps) {
  const navigate = useNavigate()
  const createMutation = useCreateWorkman()
  const updateMutation = useUpdateWorkman()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkmanFormData>({
    resolver: zodResolver(workmanSchema),
    defaultValues: workman ? {
      trn: workman.trn,
      name: workman.name,
      company: workman.company,
      location: workman.location,
    } : undefined,
  })

  const onSubmit = async (data: WorkmanFormData) => {
    try {
      if (workman) {
        await updateMutation.mutateAsync({
          trn: workman.trn,
          updates: {
            name: data.name,
            company: data.company,
            location: data.location,
            updated_at: new Date().toISOString(),
          },
        })
      } else {
        await createMutation.mutateAsync({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
      
      if (onSuccess) {
        onSuccess()
      } else {
        navigate('/')
      }
    } catch (error) {
      console.error('Form submission failed:', error)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="trn" className="block text-sm font-medium text-gray-700 mb-2">
          TRN (Tax Registration Number)
        </label>
        <input
          {...register('trn')}
          type="text"
          disabled={!!workman}
          className="input"
          placeholder="Enter TRN"
        />
        {errors.trn && (
          <p className="mt-1 text-sm text-error-600">{errors.trn.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Full Name
        </label>
        <input
          {...register('name')}
          type="text"
          className="input"
          placeholder="Enter full name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
          Company
        </label>
        <input
          {...register('company')}
          type="text"
          className="input"
          placeholder="Enter company name"
        />
        {errors.company && (
          <p className="mt-1 text-sm text-error-600">{errors.company.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          {...register('location')}
          type="text"
          className="input"
          placeholder="Enter work location"
        />
        {errors.location && (
          <p className="mt-1 text-sm text-error-600">{errors.location.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? 'Saving...' : workman ? 'Update Workman' : 'Register Workman'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}