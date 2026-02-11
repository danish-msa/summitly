# Google OAuth Setup Guide

## ✅ What's Been Implemented

- ✅ Google OAuth provider configured in NextAuth
- ✅ Google sign-in buttons added to Login and Register forms
- ✅ Proper callback handling for Google authentication
- ✅ User creation/update on Google sign-in
- ✅ Session management for Google users

## 🔧 Setup Instructions

### Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project** (or select existing)
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter project name (e.g., "Summit Realty")
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click on it and press "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure OAuth consent screen first:
     - Choose "External" (unless you have Google Workspace)
     - Fill in required fields:
       - App name: "Summit Realty"
       - User support email: Your email
       - Developer contact: Your email
     - Click "Save and Continue"
     - Add scopes: `email`, `profile`, `openid`
     - Add test users (optional for development)
     - Click "Save and Continue"
   - Now create OAuth client ID:
     - Application type: "Web application"
     - Name: "Summit Realty Web Client"
     - Authorized JavaScript origins:
       - `http://localhost:3000` (for development)
       - `https://yourdomain.com` (for production)
     - Authorized redirect URIs:
       - `http://localhost:3000/api/auth/callback/google` (for development)
       - `https://yourdomain.com/api/auth/callback/google` (for production)
     - Click "Create"

5. **Copy Your Credentials**
   - You'll see a popup with your Client ID and Client Secret
   - Copy both values

### Step 2: Add Credentials to Environment Variables

Add these to your `.env.local` file:

```env
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

### Step 3: Restart Your Development Server

```bash
npm run dev
```

## 🎯 How It Works

### User Flow

1. User clicks "Sign in with Google" button
2. User is redirected to Google's OAuth consent screen
3. User grants permissions
4. Google redirects back to `/api/auth/callback/google`
5. NextAuth creates/updates user in database
6. User is redirected to `/dashboard` (or callbackUrl)
7. User is logged in with their Google account

### Database Behavior

- **First-time Google sign-in**: Creates a new user account
  - Email: From Google account
  - Name: From Google account
  - Image: Google profile picture
  - Phone: `null` (Google doesn't provide phone)
  - Password: `null` (not needed for OAuth)
  - Role: Defaults to `BUYER`

- **Returning Google sign-in**: Updates existing user
  - Updates name and image if changed
  - Links Google account to existing user

### Security Features

- ✅ Secure token exchange
- ✅ CSRF protection
- ✅ Session management
- ✅ User data validation
- ✅ Account linking (same email = same user)

## 🧪 Testing

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Open the login modal**
   - Click "Login / Signup" in navbar
   - Or click "Save" button on a property (if not logged in)

3. **Test Google Sign-In**
   - Click "Sign in with Google" button
   - You'll be redirected to Google
   - Sign in with your Google account
   - Grant permissions
   - You'll be redirected back and logged in

4. **Verify in Dashboard**
   - Check `/dashboard` to see your account
   - Your Google profile picture should appear in navbar

## 🐛 Troubleshooting

### Issue: "OAuth client not found"
**Solution:** 
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set correctly
- Make sure there are no extra spaces or quotes in `.env.local`

### Issue: "Redirect URI mismatch"
**Solution:**
- Verify redirect URI in Google Console matches exactly:
  - Development: `http://localhost:3000/api/auth/callback/google`
  - Production: `https://yourdomain.com/api/auth/callback/google`
- Make sure protocol (http/https) matches
- No trailing slashes

### Issue: "Access blocked: This app's request is invalid"
**Solution:**
- Make sure OAuth consent screen is configured
- Add your email as a test user (for development)
- Verify scopes include `email`, `profile`, `openid`

### Issue: "User not created in database"
**Solution:**
- Check database connection
- Verify Prisma adapter is working
- Check server logs for errors
- Ensure migrations have been run

### Issue: "Session not persisting"
**Solution:**
- Check `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

## 📝 Production Checklist

Before deploying to production:

- [ ] Update OAuth consent screen to "Published" (after review)
- [ ] Add production domain to authorized origins
- [ ] Add production redirect URI
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Test Google sign-in on production
- [ ] Verify HTTPS is working (required for OAuth)
- [ ] Set up proper error logging

## 🔐 Security Best Practices

1. **Never commit credentials** - Keep `.env.local` in `.gitignore`
2. **Use environment variables** - Never hardcode credentials
3. **Rotate secrets regularly** - Update credentials periodically
4. **Limit redirect URIs** - Only add domains you own
5. **Monitor usage** - Check Google Cloud Console for suspicious activity
6. **Use HTTPS** - Required for OAuth in production

## 📚 Additional Resources

- [NextAuth.js Google Provider Docs](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

