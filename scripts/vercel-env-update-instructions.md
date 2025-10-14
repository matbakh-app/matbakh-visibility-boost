# Vercel Environment Variables Update Instructions

## Task 12.3.1 - Update Vercel with new RDS DATABASE_URL

### Steps to update Vercel environment variables:

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/matbakh-app/matbakh-visibility-boost/settings/environment-variables

2. **Find DATABASE_URL variable:**
   - Look for existing `DATABASE_URL` environment variable
   - Click "Edit" next to it

3. **Update the value:**
   - Replace the current Supabase URL with:
   ```
   postgresql://postgres:Matbakhapp#6x@matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com:5432/matbakh
   ```

4. **Apply to all environments:**
   - Make sure it's applied to: Production, Preview, Development

5. **Save and Redeploy:**
   - Click "Save"
   - Trigger a new deployment to apply the changes

### Alternative: Using Vercel CLI

If you have Vercel CLI installed, you can also update via command line:

```bash
# Set for production
vercel env add DATABASE_URL production
# When prompted, enter: postgresql://postgres:Matbakhapp#6x@matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com:5432/matbakh

# Set for preview
vercel env add DATABASE_URL preview
# When prompted, enter: postgresql://postgres:Matbakhapp#6x@matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com:5432/matbakh

# Set for development
vercel env add DATABASE_URL development
# When prompted, enter: postgresql://postgres:Matbakhapp#6x@matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com:5432/matbakh

# Redeploy
vercel --prod
```

### Verification:
After updating, verify that the new DATABASE_URL is active by checking the deployment logs or testing the application functionality.