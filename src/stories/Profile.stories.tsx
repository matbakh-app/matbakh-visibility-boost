import React from 'react'
import { MyProfile } from '../components/Profile/MyProfile'
import { CompanyProfile } from '../components/Profile/CompanyProfile'

// Simple story structure without Storybook dependencies for now
export default {
  title: 'Profile Components',
}

// Mock data for stories
const mockUserProfile = {
  id: '123',
  first_name: 'Max',
  last_name: 'Mustermann', 
  email: 'max.mustermann@restaurant.de',
  phone: '+49 89 1234 5678',
  role: 'Restaurant Manager',
  avatar_url: '',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T14:30:00Z',
}

const mockCompanyProfile = {
  id: '456',
  user_id: '123',
  company_name: 'Beispiel Restaurant GmbH',
  email: 'kontakt@beispiel-restaurant.de',
  phone: '+49 89 1234 5678',
  address: 'Maximilianstraße 1, 80539 München',
  website: 'www.beispiel-restaurant.de',
  description: 'Authentische bayerische Küche im Herzen Münchens. Seit 1995 verwöhnen wir unsere Gäste mit traditionellen Gerichten und modernen Interpretationen.',
  categories: ['Restaurant', 'Bayerische Küche', 'Biergarten'],
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-20T14:30:00Z',
}

// Story components for manual testing
export const UserProfileStory = () => (
  <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
    <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
      MyProfile Component Demo
    </h1>
    <MyProfile
      onNavigateToCompanyProfile={() => alert('Navigiere zum Company Profile')}
      onBack={() => alert('Zurück zum Dashboard')}
    />
  </div>
)

export const CompanyProfileStory = () => (
  <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
    <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
      CompanyProfile Component Demo
    </h1>
    <CompanyProfile
      onSave={(data) => {
        console.log('Speichern mit:', data)
        alert('Profil gespeichert!')
      }}
      onBack={() => alert('Zurück zum User Profile')}
      initialData={mockCompanyProfile}
    />
  </div>
)

export const CompanyProfileEmptyStory = () => (
  <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
    <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
      CompanyProfile Component Demo (Empty State)
    </h1>
    <CompanyProfile
      onSave={(data) => {
        console.log('Speichern mit:', data)
        alert('Profil gespeichert!')
      }}
      onBack={() => alert('Zurück zum User Profile')}
      initialData={{
        id: '',
        user_id: '',
        company_name: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        description: '',
        categories: [],
      }}
    />
  </div>
)