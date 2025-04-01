# Student Performance Tracker - Deployment Guide

This guide provides step-by-step instructions for deploying the Student Performance Tracker application to Render.com.

## Prerequisites

Before you begin, make sure you have:

1. A Render.com account
2. A Supabase account with the following configured:
   - Two storage buckets: `profiles` and `files`
   - Appropriate bucket policies (public read access recommended)
3. Your application code in a Git repository (GitHub, GitLab, etc.)

## Deployment Steps

### 1. Set Up Supabase Storage

1. Log in to your Supabase dashboard
2. Navigate to Storage and create two buckets:
   - `profiles` - For storing user profile images
   - `files` - For storing assignments, notes, and past papers
3. Configure appropriate permissions for each bucket:
   - Public read access recommended
   - Authenticated-only write access

### 2. Deploy to Render.com Using Blueprint

#### Option 1: Using the Render Dashboard (Manual Setup)

1. Log in to your Render dashboard
2. Create a new PostgreSQL database:
   - Click "New +" → "PostgreSQL"
   - Name: `student-tracker-db` (or your preferred name)
   - Select an appropriate plan
   - Click "Create Database"
   - Note the connection string which will be used later

3. Create a new Web Service:
   - Click "New +" → "Web Service"
   - Connect your Git repository
   - Name: `student-performance-tracker`
   - Build Command: `npm install`
   - Start Command: `bash production-deploy.sh`
   - Select the appropriate plan
   - Add the following environment variables:
     - `NODE_ENV`: `production`
     - `SESSION_SECRET`: (generate a random string using `openssl rand -hex 32`)
     - `DATABASE_URL`: (use the connection string from the PostgreSQL database created earlier)
     - `SUPABASE_URL`: (your Supabase project URL)
     - `SUPABASE_KEY`: (your Supabase anon key)
   - Click "Create Web Service"

#### Option 2: Using Render Blueprint (Automated Setup)

1. Connect your repository to Render
2. Use the `render.yaml` file included in the repository for automated setup
3. Follow the prompts to complete setup
4. Add required environment variables when prompted:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

### 3. Verify Deployment

1. Once deployment is complete, click on the generated URL to access your application
2. Verify that the application is running correctly
3. Test the login functionality using the default credentials:
   - Username: Any of the admission numbers (e.g., `SDS001` for a student or `SDS-T001` for a teacher)
   - Default password: `sds#website`

### 4. Post-Deployment Tasks

1. Change default passwords for security
2. Set up automatic database backups in the Render dashboard:
   - Go to your database settings
   - Under "Backups", configure your backup frequency
3. Consider setting up a custom domain (optional):
   - In your Web Service settings, navigate to "Custom Domain"
   - Follow the instructions to add your domain

## Troubleshooting

### Database Connection Issues

If you're experiencing database connection issues:

1. Verify that your `DATABASE_URL` environment variable is correct
2. Check the database logs in the Render dashboard
3. Ensure your database service is running

### File Upload Issues

If file uploads are not working:

1. Verify your Supabase configuration:
   - Check that both `profiles` and `files` buckets exist
   - Verify bucket permissions
2. Check that `SUPABASE_URL` and `SUPABASE_KEY` environment variables are set correctly
3. Look for any errors in the application logs

### Login Issues

If users cannot log in:

1. Reset the database to ensure the default accounts are properly set up:
   - Connect to your database using the Render shell or PostgreSQL client
   - Run the reset script: `node StudentPerformanceTracker006/server/reset-data.js`
2. Verify that the sessions table is properly created in the database

## Maintenance

### Updating Your Application

To update your application:

1. Push changes to your Git repository
2. Render will automatically deploy the changes

### Database Migrations

For database schema changes:

1. Modify the schema in `shared/schema.ts`
2. Update `storage.ts` accordingly
3. Push changes to deploy automatically

## Support

For additional help:

- Review the application's README and documentation
- Consult the Render documentation at https://render.com/docs
- Consult the Supabase documentation at https://supabase.com/docs

---

© Student Performance Tracker