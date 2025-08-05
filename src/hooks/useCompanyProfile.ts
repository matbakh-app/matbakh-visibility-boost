import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'

interface CompanyProfile {
  id: string
  user_id: string
  company_name: string
  email?: string
  phone?: string
  address?: string
  website?: string
  description?: string
  categories?: string[]
  tax_id?: string
  legal_entity?: string
  commercial_register?: string
  bank_account?: string
  owner_name?: string
  business_license?: string
  created_at?: string
  updated_at?: string
}

export function useCompanyProfile() {
  const { user } = useAuth()
  const [data, setData] = useState<CompanyProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    setIsError(false)
    
    const loadCompanyProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (error) {
          console.error('Error loading company profile:', error)
          setIsError(true)
        } else {
          setData(data)
        }
      } catch (error) {
        console.error('Error loading company profile:', error)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadCompanyProfile()
  }, [user])

  const save = async (updates: Partial<CompanyProfile>) => {
    if (!user) return false
    
    setIsLoading(true)
    setIsError(false)
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    let result
    if (existingProfile) {
      // Update existing profile
      result = await supabase
        .from('business_profiles')
        .update(updates)
        .eq('user_id', user.id)
    } else {
      // Create new profile - ensure company_name is provided
      if (!updates.company_name) {
        setIsError(true)
        setIsLoading(false)
        return false
      }
      
      result = await supabase
        .from('business_profiles')
        .insert({
          user_id: user.id,
          company_name: updates.company_name,
          ...updates
        })
    }
    
    if (result.error) {
      console.error('Error saving company profile:', result.error)
      setIsError(true)
      setIsLoading(false)
      return false
    }
    
    // Refresh data after save
    const { data: updatedData } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (updatedData) {
      setData(updatedData)
    }
    
    setIsLoading(false)
    return true
  }

  return { data, isLoading, isError, save }
}