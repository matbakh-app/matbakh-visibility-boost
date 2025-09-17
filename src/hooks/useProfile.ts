import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
// MIGRATED: Supabase removed - use AWS services

interface UserProfile {
  id: string
  name?: string
  language?: string
  role?: string
  private_email?: string
  phone?: string
  address?: string
  allergies?: string[]
  granted_features?: any
  feature_access_until?: string
  subscription_status?: string
  created_at?: string
  updated_at?: string
}

export function useProfile() {
  const { user } = useAuth()
  const [data, setData] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    setIsError(false)
    
    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id as any)
          .maybeSingle()
        
        if (error) {
          console.error('Error loading profile:', error)
          setIsError(true)
        } else {
          setData(data as any)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProfile()
  }, [user])

  const save = async (updates: Partial<UserProfile>) => {
    if (!user) return false
    
    setIsLoading(true)
    setIsError(false)
    
    const { error } = await supabase
      .from('profiles')
      .update(updates as any)
      .eq('id', user.id as any)
    
    if (error) {
      console.error('Error saving profile:', error)
      setIsError(true)
      setIsLoading(false)
      return false
    }
    
    // Refresh data after save
    const { data: updatedData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id as any)
      .maybeSingle()
    
    if (updatedData) {
      setData(updatedData as any)
    }
    
    setIsLoading(false)
    return true
  }

  return { data, isLoading, isError, save }
}