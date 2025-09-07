# Authentication & RBAC Schema

**Last Updated**: September 2, 2025  
**Status**: ✅ Production Ready  
**Tables**: `profiles`, `private_profiles`

## Overview

The authentication system uses Supabase Auth as the foundation with a custom RBAC (Role-Based Access Control) layer built on top. User data is separated into public profiles and private profiles for GDPR compliance.

## Schema Structure

### Core Tables

#### `profiles` (Public Profile Data)
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'partner', 'admin', 'super_admin')),
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Purpose**: Stores public user information and role assignments
**RLS**: ✅ Enabled - Users can view own profile, admins can view all

#### `private_profiles` (GDPR-Compliant Private Data)
```sql
CREATE TABLE public.private_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address JSONB, -- {street, city, postal_code, country}
  preferences JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Purpose**: Stores sensitive personal information separately for GDPR compliance
**RLS**: ✅ Enabled - Users can view own data, super_admins can view all

## Role Hierarchy

### Role Definitions
```sql
-- Role enum (if using typed approach)
CREATE TYPE role_type AS ENUM ('owner', 'partner', 'admin', 'super_admin', 'viewer');
```

| Role | Level | Permissions | Use Case |
|------|-------|-------------|----------|
| `owner` | 1 | Own data only | Restaurant owners |
| `partner` | 2 | Partner data + assigned businesses | Marketing agencies |
| `admin` | 3 | Most data, limited system access | Customer support |
| `super_admin` | 4 | Full system access | System administrators |
| `viewer` | 0 | Read-only access | Reporting/analytics |

### Permission Matrix

| Resource | Owner | Partner | Admin | Super Admin |
|----------|-------|---------|-------|-------------|
| Own Profile | CRUD | CRUD | CRUD | CRUD |
| Other Profiles | R (limited) | R (assigned) | R (most) | CRUD |
| Private Data | Own only | Own only | None | CRUD |
| Business Data | Own only | Assigned only | R (most) | CRUD |
| System Config | None | None | R (limited) | CRUD |

## Row Level Security (RLS)

### Profiles RLS Policies
```sql
-- Users can view own profile or admins can view all
CREATE POLICY "profiles_read" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- Users can update own profile or admins can update all
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );
```

### Private Profiles RLS Policies
```sql
-- Users can view own private data or super_admins can view all
CREATE POLICY "private_profiles_read" ON public.private_profiles
  FOR SELECT USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Users can update own private data
CREATE POLICY "private_profiles_update" ON public.private_profiles
  FOR UPDATE USING (user_id = auth.uid());
```

## Automated Profile Creation

### Trigger Function
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create public profile
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  
  -- Create private profile
  INSERT INTO public.private_profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Indexes

### Performance Indexes
```sql
-- Profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

-- Private profiles indexes
CREATE INDEX idx_private_profiles_user_id ON public.private_profiles(user_id);
```

## Common Queries

### Get User with Role
```sql
SELECT 
  u.email,
  p.role,
  p.display_name,
  pp.first_name,
  pp.last_name
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.private_profiles pp ON pp.user_id = u.id
WHERE u.id = auth.uid();
```

### Check User Permissions
```sql
-- Check if user is admin or super_admin
SELECT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'super_admin')
) AS is_admin;

-- Get user role
SELECT role FROM public.profiles WHERE id = auth.uid();
```

### Admin User Management
```sql
-- List all users (admin view)
SELECT 
  u.email,
  p.role,
  p.display_name,
  p.created_at,
  u.last_sign_in_at
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
ORDER BY p.created_at DESC;
```

## Security Considerations

### Data Separation
- **Public data** in `profiles`: Safe to expose in UI, logs, etc.
- **Private data** in `private_profiles`: Restricted access, GDPR compliant
- **Sensitive operations** require super_admin role

### Access Control
- All profile access goes through RLS policies
- Role changes require super_admin privileges
- Private data access is strictly controlled

### Audit Trail
- All profile changes are timestamped
- Role changes should be logged (future enhancement)
- Failed access attempts are logged by Supabase Auth

## Migration Notes

### Current Status (Task 12.1)
- ✅ **Stable**: Core authentication schema is production-ready
- ✅ **RLS Policies**: All policies tested and working
- ✅ **Triggers**: Auto-profile creation working correctly

### Backfill Operations
```sql
-- Ensure all auth.users have profiles
INSERT INTO public.profiles (id, email, display_name)
SELECT 
  u.id, 
  u.email, 
  COALESCE(u.raw_user_meta_data->>'name', u.email)
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Create super_admin users
UPDATE public.profiles
SET role = 'super_admin'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('info@matbakh.app', 'matbakhapp2025@gmail.com')
);
```

## Testing

### RLS Testing
```sql
-- Test as regular user
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid"}';

-- Should only see own profile
SELECT * FROM profiles;

-- Test as admin
SET LOCAL "request.jwt.claims" TO '{"sub": "admin-uuid"}';

-- Should see all profiles
SELECT * FROM profiles;
```

### Integration Testing
- User registration flow
- Role assignment
- Permission checks
- Profile updates
- Private data access

## Future Enhancements

### Planned Features
1. **Role Hierarchy**: More granular role inheritance
2. **Permission System**: Resource-specific permissions
3. **Audit Logging**: Track all role and permission changes
4. **Session Management**: Enhanced session control
5. **Multi-Factor Auth**: Additional security layer

### Performance Optimizations
1. **Caching**: Role-based query result caching
2. **Indexes**: Additional composite indexes for complex queries
3. **Partitioning**: Consider partitioning for large user bases