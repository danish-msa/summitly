# Local Logic API Setup Guide

## Overview
This guide explains how to set up Local Logic API for real-time demographic data in the Demographics section.

## Step 1: Get Local Logic API Credentials

1. **Book a Demo with Local Logic**
   - Visit: https://docs.locallogic.co
   - Contact Local Logic to get API access
   - You'll receive:
     - `client_id` (Client ID)
     - `client_secret` (Client Secret)

## Step 2: Add Environment Variables

Add the following to your `.env.local` file:

```env
# Local Logic API
LOCAL_LOGIC_CLIENT_ID="your_client_id_here"
LOCAL_LOGIC_CLIENT_SECRET="your_client_secret_here"
```

**For Vercel Production:**
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add both variables:
   - `LOCAL_LOGIC_CLIENT_ID`
   - `LOCAL_LOGIC_CLIENT_SECRET`

## Step 3: API Endpoints

The integration uses the following Local Logic API endpoints:

- **Authentication**: `https://api.locallogic.co/oauth/token`
- **Demographics**: `https://api.locallogic.co/v1/demographics` or `/v1/location/demographics`

## Step 4: How It Works

1. **Authentication**: The API automatically obtains an access token using your credentials
2. **Data Fetching**: When a user views a property, the system:
   - Takes the property's latitude and longitude
   - Fetches demographic data from Local Logic API
   - Transforms the data into the expected format
   - Displays it in the Demographics section

## Step 5: Data Transformation

The Local Logic API response is automatically transformed to match our component structure:

- **Statistics**: Population, average age, income, renters, etc.
- **Charts**: Income distribution, age groups, occupation, ethnicity, language, year built, property types, commute methods

## Troubleshooting

### Error: "Local Logic API credentials not configured"
- **Solution**: Make sure `LOCAL_LOGIC_CLIENT_ID` and `LOCAL_LOGIC_CLIENT_SECRET` are set in your environment variables

### Error: "Failed to fetch demographic data from Local Logic API"
- **Possible causes**:
  - Invalid credentials
  - API endpoint changed
  - Network issues
  - Rate limiting

### API Endpoint Issues
If the default endpoints don't work, you may need to:
1. Check Local Logic's latest API documentation
2. Update the endpoint URLs in `src/app/api/demographics/route.ts`
3. Adjust the data transformation logic if the response structure differs

## API Documentation

For the latest API documentation, visit:
- https://docs.locallogic.co
- https://docs.locallogic.co/docs/api/getting-started

## Notes

- The API automatically handles token refresh
- Data is fetched on-demand when users view properties
- The system gracefully handles API errors and displays user-friendly messages

