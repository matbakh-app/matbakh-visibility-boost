import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

interface UserProfile {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  avatar_url?: string
  role?: string
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
          .eq('id', user.id)
          .maybeSingle()
        
        if (error) {
          console.error('Error loading profile:', error)
          setIsError(true)
        } else {
          setData(data)
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
      .update(updates)
      .eq('id', user.id)
    
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
      .eq('id', user.id)
      .maybeSingle()
    
    if (updatedData) {
      setData(updatedData)
    }
    
    setIsLoading(false)
    return true
  }

  return { data, isLoading, isError, save }
}