# Multi-Role Task Management System

**Live Link **   https://task-ebon-three.vercel.app


A MERN task manager with three roles (Admin,Manager and User), JWT cookie auth,  real-time updates over Socket.io and email notifications via Nodemailer.

**Stack:** MongoDB · Express · React (Vite) · Tailwind CSS · Socket.io · Nodemailer

```
task/
├── server/   # Express API + Socket.io
└── client/   # React + Vite + Tailwind
```

## Features
- Register / login with JWT stored in an httpOnly cookie; role-based route protection (user, manager, admin)
- Create, edit, delete and assign tasks; status `pending | in progress | completed`, priority `low | medium | high`, due date
- Email notifications when a task is assigned
- Dashboards: Admin (all tasks + user management), Manager (tasks they created/assigned), User (tasks assigned to them/created by them)
- Pagination and filtering (status, priority), createdAt & updatedAt timestamps
- Responsive UI with dark mode


## Setup

### Server
```bash
cd server
npm install
cp config/config.env.example config/config.env   # then fill in your values
npm run dev
```
`config/config.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://...
JWT_SECRET=changeit
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173      
# Optional – email notifications 
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM="Task Manager <no-reply@example.com>"

```

### Client
```bash
cd client
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:5000
npm run dev
```

### Creating an admin
Self-registration only allows the `user` and `manager` roles. Create (or promote) an admin with the seed script,
run from the `server` folder:
```bash
# PowerShell
$env:ADMIN_EMAIL="admin@example.com"; $env:ADMIN_PASSWORD="YourPassword"; node seedAdmin.js
```
If the email already exists, that account is promoted to `admin`. Log in again afterwards so the new role is picked up.



## Live links
- Frontend (Vercel): https://task-ebon-three.vercel.app
- Repository: https://github.com/thehzn/task
