# Google OAuth Setup Guide for Belto Authentication

This guide will help you resolve the "Access denied" error when trying to log in with Google.

## Issue Analysis
The "Access denied" error typically occurs due to:
1. Incorrect Google OAuth configuration in Google Console
2. Mismatched redirect URIs
3. Environment variable issues
4. Domain verification problems

## Step 1: Google Cloud Console Configuration

### 1.1 Create/Update OAuth Client
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID" (or edit existing)
5. Select "Web application"

### 1.2 Configure Authorized Origins
Add these authorized JavaScript origins:
```
https://belto-user-side.vercel.app
http://localhost:3000
```

### 1.3 Configure Redirect URIs
Add these authorized redirect URIs:
```
https://belto-user-side.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

### 1.4 Get Your Credentials
- Copy the "Client ID" and "Client secret"
- Update your .env.local file with these values

## Step 2: Environment Configuration (Already Fixed)

Your .env.local file has been updated with the correct URLs:
```env
NEXTAUTH_URL=https://belto-user-side.vercel.app
NEXT_PUBLIC_APP_URL=https://belto-user-side.vercel.app
GOOGLE_CLIENT_ID=122580096237-9312jkesk3inqhhikg6qasnjpjharrop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## Step 3: Code Improvements (Already Applied)

The following improvements have been made:

### 3.1 NextAuth Configuration Enhanced
- Added proper authorization parameters for Google OAuth
- Improved error handling and logging
- Added session configuration
- Enhanced cookie settings

### 3.2 Login Page Error Handling
- Better error message mapping
- Improved user feedback
- Enhanced debugging information
- Better state management for loading states

### 3.3 Database Integration
- Added googleAuth flag to Student model
- Improved user creation and linking logic
- Better error logging for debugging

## Step 4: Testing and Deployment

### 4.1 Local Testing
1. Ensure all environment variables are set correctly
2. Run the development server: `npm run dev`
3. Test Google login at http://localhost:3000/login

### 4.2 Production Deployment
1. Deploy to Vercel with updated environment variables
2. Ensure the domain matches the one in Google Console
3. Test production Google login

## Step 5: Common Issues and Solutions

### Issue: "Access denied" still appears
**Solution:** 
1. Double-check redirect URIs in Google Console
2. Ensure the domain exactly matches (no trailing slashes)
3. Wait 5-10 minutes for Google changes to propagate

### Issue: "Configuration error"
**Solution:**
1. Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
2. Check that NEXTAUTH_SECRET is set
3. Ensure NEXTAUTH_URL matches your domain

### Issue: "OAuthCallback error"
**Solution:**
1. Check browser network tab for failed requests
2. Verify the callback URL is exactly: `/api/auth/callback/google`
3. Ensure your domain is verified in Google Console

### Issue: User not syncing with backend
**Solution:**
1. Check the `/api/auth/google-sync` endpoint
2. Verify database connection
3. Check console logs for sync errors

## Step 6: Debugging Tips

### Enable Debug Mode
The NextAuth debug mode is enabled in development. Check console logs for detailed error information.

### Check Network Requests
1. Open browser developer tools
2. Go to Network tab
3. Attempt Google login
4. Look for failed requests to identify the exact issue

### Verify Environment Variables
Run this command to check if variables are loaded:
```bash
node -e "console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...')"
```

## What Has Been Fixed

✅ Updated NEXTAUTH_URL to match current domain
✅ Enhanced NextAuth configuration with better error handling
✅ Improved login page error messages and user feedback
✅ Added comprehensive logging for debugging
✅ Enhanced Google OAuth flow with proper parameters
✅ Better session and cookie management
✅ Improved database integration for Google users

## Next Steps

1. **Update Google Console** with the correct redirect URIs (most important)
2. **Deploy the changes** to your production environment
3. **Test thoroughly** with both development and production environments
4. **Monitor logs** for any remaining issues

The main fix needed is updating your Google OAuth client configuration in Google Cloud Console to use the correct redirect URIs for your current domain.
