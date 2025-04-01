# Student Performance Tracker - Deployment Guide

This guide provides instructions for deploying the Student Performance Tracker application to [Render.com](https://render.com), a modern cloud platform that makes it easy to deploy applications without the complexity of managing infrastructure.

## Prerequisites

1. A [Render.com](https://render.com) account
2. A [Supabase](https://supabase.com) account for database and file storage
3. The Student Performance Tracker codebase

## Step 1: Set Up Supabase

### Create a Supabase Project

1. Log in to your Supabase account at [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Provide a name for your project (e.g., "student-tracker")
4. Choose a strong database password and save it securely
5. Select the region closest to your users
6. Click "Create new project"

### Set Up Storage Buckets

1. Once your project is created, go to "Storage" in the left sidebar
2. Create two new buckets:
   - `profiles` - For user profile images
   - `files` - For assignments, notes, and other documents
3. Configure bucket policies to control access:
   - For basic setup, you can set both buckets to "Public" for testing

### Get Supabase Credentials

1. Go to "Settings" > "API" in the left sidebar
2. Copy the following values:
   - **URL**: Your Supabase project URL
   - **anon/public key**: For client-side operations
   
These values will be needed for your environment variables.

## Step 2: Deploy to Render

### Using the Blueprint (Recommended)

Render blueprints allow you to define your entire infrastructure in a single file. The Student Performance Tracker includes a `render.yaml` file that automates the deployment process.

1. Log in to [Render.com](https://render.com)
2. Go to the "Blueprints" section
3. Click "New Blueprint Instance"
4. Connect your Git repository containing the Student Performance Tracker code
5. Render will detect the `render.yaml` file and set up the required services
6. Fill in the required environment variables when prompted:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase anon/public key

### Manual Deployment

If you prefer to set up your application manually:

1. Log in to [Render.com](https://render.com)
2. Go to "Web Services" and click "New Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name**: student-performance-tracker
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `bash production-deploy.sh`
5. Add the following environment variables:
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: Generate a secure random string
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase anon/public key

## Step 3: Set Up the Database

### Using Render PostgreSQL (Recommended)

1. In your Render dashboard, go to "PostgreSQL" and click "New PostgreSQL Database"
2. Configure the database:
   - **Name**: student-tracker-db
   - **Database**: student_tracker
   - **User**: student_tracker_user
3. After creation, copy the "Internal Database URL" for use in your web service
4. In your web service's environment variables, set:
   - `DATABASE_URL`: The internal database URL from Render

The application will automatically initialize the database schema on the first run using the `production-deploy.sh` script.

## Step 4: Verify Deployment

1. After deployment is complete, visit your application's URL (provided by Render)
2. You should see the login page
3. Log in with the default credentials:
   - **Admission Number**: Any of the 49 accounts (e.g., "SDS001" for a student or "SDS-T001" for the teacher)
   - **Password**: "sds#website" (default for all accounts)

## Troubleshooting

### Authentication Issues

If users cannot log in:

1. Check the server logs in the Render dashboard
2. Verify that your database is properly initialized
3. Ensure the `SESSION_SECRET` is properly set

### Database Connection Errors

If you see database connection errors:

1. Verify the `DATABASE_URL` environment variable
2. Check if the database is running in the Render dashboard
3. Look for any migration errors in the logs

### File Upload Problems

If file uploads are not working:

1. Verify the Supabase credentials (`SUPABASE_URL` and `SUPABASE_KEY`)
2. Check if the storage buckets were properly created
3. Ensure bucket permissions allow uploads

## Maintenance and Updates

### Database Migrations

When updating the application schema:

1. Make the necessary changes to the schema files
2. Deploy the updated code to Render
3. The application will handle migrations automatically using Drizzle ORM

### Application Updates

To update the application:

1. Push changes to your Git repository
2. Render will automatically detect the changes and rebuild the application

## Security Considerations

1. Change the default password for all accounts after initial setup
2. Use strong, unique passwords for all administrative accounts
3. Consider implementing additional security measures for production environments
4. Regularly back up your database

## Support

If you encounter issues with the deployment, check the following resources:

1. Render documentation: [docs.render.com](https://docs.render.com)
2. Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
3. Project-specific documentation in the code repository