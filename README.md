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

## Getting Started

### To run the application:

1. Run the launcher script by executing:
   ```
   ./launcher.sh
   ```

2. Once the launcher is running, visit:
   ```
   http://localhost:3001
   ```

3. From the launcher page, click the "Launch Tracker" button to start the application

4. When the tracker is running, access it at:
   ```
   http://localhost:3000
   ```

### Login Credentials

#### Student Login
- **Name**: Samsam Abdul Nassir
- **Admission Number**: SDS/0020/19
- **Password**: sds#website

#### Alternative Student
- **Name**: Alfred Mulinge
- **Admission Number**: SDS/0034/19
- **Password**: sds#website

#### Teacher Login
- **Name**: Dr. Joyce Wangari
- **Admission Number**: SDS/0001/22
- **Password**: sds#website

## Application Structure

- **Dashboard**: Central hub showing statistics, recent activities, and upcoming deadlines
- **Units**: Course units with tabs for Notes, Assignments, and Past Papers
- **Profile**: User profile with image upload and password change functionality

## Technical Details

- Frontend: React + TypeScript with Shadcn UI components
- Backend: Express.js server with session management
- Database: PostgreSQL for data persistence
- Authentication: Passport.js for secure user authentication
- UI Design: Theme customization with unit-specific colors

## Troubleshooting

If you encounter any issues with the application:

1. Ensure all application servers are stopped before starting the launcher
2. If the database connection fails, the application will fall back to in-memory storage
3. For login issues, try using the default credentials provided above

## Credits

Developed by 𝐌𝐚𝐯𝐞𝐫𝐢𝐜𝐤