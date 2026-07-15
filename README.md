<<<<<<< HEAD
# AccessGate — System Identity & Access Control Console

AccessGate is a full-stack Identity & Access Management (IAM) platform built end-to-end. It centralizes user authentication, authorization, and role-based access control (RBAC). 

Unlike a generic consumer platform, the vocabulary, user flows, and aesthetic values are aligned around a **physical security clearance console** — precise, high-density, and clinical.

---

## 1. Architectural Blueprint

The console uses JWT authentication with refresh token rotation. For maximum security, the client stores short-lived access tokens strictly in memory, while rotation refresh tokens are secured in `httpOnly` secure cookies.

```mermaid
sequenceDiagram
    autonumber
    actor Operator
    participant Client as React SPA (In-Memory AccessToken)
    participant Server as Node Express API
    participant DB as MongoDB (Mongoose)

    Operator->>Client: Input credentials
    Client->>Server: POST /auth/login
    Server->>DB: Check email & verify password hash
    DB-->>Server: User record + roles
    Server->>Server: Generate AccessToken & Rotation RefreshToken
    Server->>DB: Save Session hash (refreshToken, device, IP)
    Server-->>Client: httpOnly Cookie (refreshToken) + JSON response (accessToken)
    Client-->>Operator: Login successful, load Overview
    
    note over Client, Server: Ongoing Requests (Clearance Enforced)
    Client->>Server: GET /users (Header: Bearer AccessToken)
    Server->>DB: Lookup user & resolve populated roles + clearances live
    DB-->>Server: Live privileges resolved
    Server->>Server: Verify requirePermission("users:read")
    Server-->>Client: 200 OK (User register data)

    note over Client, Server: Token Rotation Sequence (Access token expiry)
    Client->>Server: GET /users (Header: Bearer ExpiredAccessToken)
    Server-->>Client: 401 Unauthorized (TOKEN_EXPIRED)
    Client->>Server: POST /auth/refresh (Cookie: RefreshToken)
    Server->>DB: Verify session hash is not revoked/expired
    DB-->>Server: Active session confirmed
    Server->>Server: Generate new AccessToken & Rotated RefreshToken
    Server->>DB: Update Session with new RefreshToken hash
    Server-->>Client: httpOnly Cookie (Rotated RefreshToken) + JSON (New AccessToken)
    Client->>Server: Retry GET /users (Header: Bearer NewAccessToken)
    Server-->>Client: 200 OK
=======
# AccessGate

### Secure identity. Simplified access management.

AccessGate is a full-stack Identity & Access Management (IAM) platform that centralizes user authentication, authorization, and access control across enterprise applications. It enables organizations to securely manage users, roles, permissions, and application access through a unified administration portal.

---

## Project Status

🚧 Under Development

---

## Problem Statement

Managing user identities and permissions across multiple enterprise applications can become complex and difficult to maintain. Organizations require a centralized solution to enforce secure authentication, role-based authorization, and access governance.

AccessGate provides a single platform for managing users, permissions, authentication, and audit logs.

---

## Key Features

- Secure User Authentication
- JWT Authentication
- Role-Based Access Control (RBAC)
- User Management
- Role & Permission Management
- Protected Routes
- Admin Dashboard
- Audit Logs
- Password Reset
- Search & Filtering
- Session Management

---

## Tech Stack

### Frontend
- React.js
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Authentication
- JWT
- bcrypt

### Others
- REST APIs
- Docker
- Git
- GitHub

---

## System Architecture

```
React Frontend
        │
 REST APIs
        │
Express Backend
        │
JWT Authentication
        │
Role-Based Access Control
        │
MongoDB Database
>>>>>>> bc45236fa1764f3d04d9f1aba0635c3ea9453461
```

---

<<<<<<< HEAD
## 2. Design System and Visual Stance

AccessGate deliberately rejects generic "AI-designed admin dashboard templates" (no soft rounded cards, no blue/purple gradients, no glowing blobs, no decorative empty spaces). Instead, it implements a strict, industrial theme:

*   **Colors**: "Clearance" theme (`#14171C` base, `#1B1F26` surface, `#2A2F3A` dividers). Visual accents (`--clearance-amber`) are used sparingly for key action prompts or state indicators. Success (`#3FB27F`) and error/denial (`#E5484D`) colors are used purely for functional status reports.
*   **Typography**: condensed grotesque headings (`IBM Plex Sans Condensed` / `Archivo`) suggest stencil labelling, paired with highly readable sans-serif body text (`Inter`), and monospace text (`IBM Plex Mono`) for system logs, token fragments, and IPs.
*   **Layout**: Densified grids, sharp margins, and thin 1px hairline divisions. Page layouts mimic a control terminal or workstation panel.
*   **Signature Element**: The bottom console panel streams live security log notifications (logins, logouts, session revocations, authorization checks) directly from the immutable audit engine in a monospace terminal printout.

---

## 3. Directory Layout

```
accessgate/
├── docker-compose.yml     # Multi-container orchestration config
├── .env.example           # Server & security keys template
├── README.md              # Documentation
├── server/                # Backend API Core Node + TypeScript
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app.ts         # Express server mapping and configurations
│       ├── server.ts      # Database connection & socket listener
│       ├── config/        # Connection configurations
│       ├── models/        # Database Mongoose Schemas
│       ├── middleware/    # Rate limiters, JWT verifier, dynamic RBAC guards
│       ├── utils/         # JWT generation & SHA-256 token hashing
│       ├── scripts/       # Seed scripts
│       └── modules/       # Modular features: auth, users, roles, audit, sessions
└── client/                # React TypeScript Frontend (Vite)
    ├── Dockerfile
    ├── package.json
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx        # Router guards and console shell mounts
        ├── api.ts         # Axios interceptor queueing for JWT rotation
        ├── index.css      # Core styles and clearance CSS variables
        ├── components/    # AuthProvider, ProtectedRoute, DashboardShell
        └── pages/         # Dashboard, Users, Roles, Audits, Sessions panels
```

---

## 4. Setup and Operation Guide

### Option A: Using Docker (Recommended)

1.  **Clone / scaffolding** the directory structure locally.
2.  Create `.env` based on `.env.example`:
    ```bash
    cp .env.example .env
    ```
3.  **Boot the services**:
    ```bash
    docker-compose up --build -d
    ```
    This spins up three services:
    *   MongoDB on `localhost:27017`
    *   Express Server on `localhost:5000`
    *   Vite Client on `localhost:5173`

4.  **Seed the Security Databases**:
    Run the seeder inside the server container to generate standard permissions and role classes:
    ```bash
    docker-compose exec server npm run seed
    ```

### Option B: Local Setup Without Docker

If running databases and environments directly on the host machine:

#### 1. Setup Backend Server
```bash
cd server
npm install
# Set environment variables (Copy .env.example to .env)
# Verify MONGO_URI is pointed to local instance e.g., mongodb://localhost:27017/accessgate
npm run seed     # Seeds permissions & roles
npm run dev      # Boots hot-reloader server
```

#### 2. Setup Client
```bash
cd client
npm install
npm run dev      # Launches dev client server on http://localhost:5173
```

---

## 5. Bootstrapping Clearance Rules

1.  When starting a clean database, there are no operators.
2.  Navigate to the sign-up panel on `http://localhost:5173/register`.
3.  **Bootstrap Rule**: The first registered account on the database is automatically assigned **Super Admin** clearance, immediately unlocking all administrative control modules.
4.  Subsequent registrations default to standard **User** status with zero administrative privileges. Use the Super Admin account to customize and assign roles via the **User Control** console.
=======
## Future Scope

- Multi-Factor Authentication (MFA)
- Single Sign-On (SSO)
- OAuth 2.0 Integration
- LDAP / Active Directory Integration
- Email Verification
- Login Activity Dashboard
- Security Analytics
- Cloud Deployment

---

## Skills Demonstrated

- Authentication & Authorization
- Role-Based Access Control
- REST API Development
- Database Design
- Enterprise Software Development
- Secure Backend Development
- Full Stack Development

---

## Author

Pavankumar Balijireddi
>>>>>>> bc45236fa1764f3d04d9f1aba0635c3ea9453461
