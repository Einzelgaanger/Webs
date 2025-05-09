# Student Performance Tracker

A comprehensive academic tracker for students to manage assignments, notes, past papers, and track academic performance.

## Features

- **Interactive Dashboard**: View your academic statistics, upcoming deadlines, and recent activities
- **Assignment Management**: Track assignments with due dates, completion status, and other details
- **Note Organization**: Organize class notes by unit and access them quickly
- **Past Paper Archive**: Store and access past exam papers for better exam preparation
- **Unit-Specific Content**: All content is organized by course units for easier navigation
- **Search Functionality**: Filter and search through your assignments, notes, and past papers
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **File Storage**: Support for Supabase storage for profile images and document files

## Getting Started

### To run the application locally:

1. Run the launcher script by executing:
   ```
   ./start_app.sh
   ```
   
   This script will:
   - Check database connection and initialize if needed
   - Set up Supabase storage buckets if configured
   - Start the application server

2. When the tracker is running, access it at:
   ```
   http://localhost:3000
   ```

### Login Credentials

#### Student Login
- **Name**: Samsam Abdul Nassir
- **Admission Number**: 163336
- **Password**: sds#website

#### Alternative Student
- **Name**: Alfred Mulinge
- **Admission Number**: 163321
- **Password**: sds#website

#### Teacher Login
- **Name**: Dr. Joyce Wangari
- **Admission Number**: SDS/0001/22
- **Password**: sds#website

## Application Structure

- **Dashboard**: Central hub showing statistics, recent activities, and upcoming deadlines
- **Units**: Course units with tabs for Notes, Assignments, and Past Papers
- **Profile**: User profile with image upload and password change functionality

## Deployment

This application can be deployed to services like Render.com:

1. Push your code to a Git repository
2. Connect your Render.com account to your repository
3. Create a new Web Service with the following configuration:
   - **Build Command**: `npm install`
   - **Start Command**: `bash production-deploy.sh`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `SESSION_SECRET`: Generate a random string
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `SUPABASE_URL`: Your Supabase URL
     - `SUPABASE_KEY`: Your Supabase service key

### Path-to-regexp Fix

If you encounter routing errors with the message `TypeError: Missing parameter name at 1:`, use one of these solutions:

1. Run `node fix-path-to-regexp.js` which patches the path-to-regexp library to handle URLs with protocols.
2. The `production-deploy.sh` script will automatically apply this fix during deployment.

## Technical Details

- **Frontend**: React + TypeScript with Shadcn UI components
- **Backend**: Express.js server with session management
- **Database**: PostgreSQL for data persistence
- **Authentication**: Passport.js for secure user authentication
- **Storage**: Supabase Storage for file uploads with local filesystem fallback
- **UI Design**: Theme customization with unit-specific colors

## Troubleshooting

If you encounter any issues with the application:

1. **Server Start Issues**: Try running `node app.cjs` if the TypeScript version fails to start
2. **Path-to-regexp Errors**: Run `node fix-path-to-regexp.js` to fix URL routing issues
3. **Database Connectivity**: Ensure your PostgreSQL server is running and credentials are correct
4. **Storage Issues**: Check that Supabase buckets ('profiles' and 'files') exist and are accessible
5. **Login Problems**: Try using the default credentials listed above

## Environment Setup

For production deployment, set these environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase service key (or anon key for limited operations)
- `SESSION_SECRET`: Random string for securing sessions

## Credits

Developed by 𝐌𝐚𝐯𝐞𝐫𝐢𝐜𝐤#   W e b s  
 