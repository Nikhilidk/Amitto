# Amitto

[![Live Demo](https://img.shields.io/badge/Live-Demo-22c55e?style=for-the-badge)](https://amitto.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)

A community-focused lost and found platform for reporting, discovering, claiming, and discussing misplaced items.

**[View the live site](https://amitto.vercel.app)**

---

## What Makes Amitto Different?

Most lost and found websites act as one-way notice boards: a person posts an item and the finder or owner must rely on informal, disconnected communication. Amitto combines discovery and recovery in one connected experience:

- **Structured lost and found posts** — Report whether an item was lost or found, with category, location, date, descriptions, and supporting images.
- **Verification-focused claims** — Claim attempts and comments help verify ownership instead of exposing personal or item details immediately.
- **Built-in conversations** — Users communicate through real-time private conversations rather than moving to external messaging apps.
- **Community participation** — Comments and status updates keep the recovery process visible and collaborative.
- **Moderation and administration** — Dedicated admin tools help keep listings and users trustworthy.
- **Profile-based organization** — Each account has a clear place to manage posts and activity.
- **Campus-ready design** — Amitto is built around university communities, where shared spaces and faster coordination make a focused platform especially useful.

Amitto is not just a searchable listing page. It is designed as a complete recovery workflow—from reporting and discovery to communication and claim verification.

---

## Features

- 🔐 JWT-based registration and login
- 📝 Create and manage lost or found posts
- 🖼️ Image uploads through Cloudinary
- 🔎 Browse and search community listings
- 📍 Location, date, category, and description-based post details
- 💬 Post comments and real-time private messaging
- 🤝 Claim attempt and ownership verification workflow
- 👤 User profiles and post activity
- 🛡️ Protected student and administrator routes
- 📊 Admin dashboard for community moderation
- ⚡ Socket.IO-powered live communication

## Tech Stack

### Frontend

- React 19
- Vite 5
- React Router DOM
- Tailwind CSS
- Axios
- Socket.IO Client

### Backend

- Node.js
- Express 5
- MongoDB
- Mongoose
- JSON Web Tokens
- bcrypt
- Cloudinary
- Multer
- Socket.IO

## Project Structure

```text
Amitto/
├── client/                 # React and Vite frontend
│   ├── public/             # Public assets
│   └── src/
│       ├── api/            # API request helpers
│       ├── components/     # Reusable UI and route components
│       ├── context/        # Shared application state
│       ├── pages/          # Application screens
│       └── util/           # Frontend utilities
├── server/                 # Express API and real-time server
│   ├── config/             # Server configuration
│   ├── middleware/         # Authentication and validation middleware
│   ├── models/             # Mongoose data models
│   ├── routes/             # REST API routes
│   └── utils/              # Backend helpers
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB database
- Cloudinary account
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Nikhilidk/Amitto.git
cd Amitto
```

### 2. Configure the Backend

```bash
cd server
npm install
cp .env.example .env
```

Update `server/.env` with your own values:

```env
PORT=5000
MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/<app_name>
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret_here
CLIENT_ORIGIN=http://localhost:5173
```

Start the API:

```bash
node index.js
```

The backend runs on `http://localhost:5000` by default.

### 3. Configure the Frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

## Available Scripts

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

### Backend

| Command | Description |
|---|---|
| `node index.js` | Start the Express and Socket.IO server |

## API Overview

The backend exposes grouped REST routes:

| Route group | Purpose |
|---|---|
| `/api/auth` | Registration, login, and authentication |
| `/api/posts` | Lost and found posts and claim-related operations |
| `/api/comments` | Post comments |
| `/api/conversations` | Direct user conversations |
| `/api/admin` | Administrative moderation |
| `/api/test` | Server health check |

API routes may require a valid JSON Web Token. Keep secrets out of version control and use environment variables in every deployed environment.

## Deployment

- The React frontend is compatible with Vercel and can be deployed from the `client` directory.
- The Express server can be deployed to a Node-compatible platform.
- Configure MongoDB, Cloudinary, CORS, and JWT environment variables on the hosting provider.
- Set the frontend API endpoint and `CLIENT_ORIGIN` to match the deployed domains.

## Roadmap

- Advanced search and filtering
- Item category recommendations
- Expanded location and campus-zone filtering
- Claim verification improvements
- Notifications and reporting tools
- Automated moderation support
- Mobile application

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes and test both the frontend and backend.
4. Commit your work:

   ```bash
   git commit -m "Add your feature"
   ```

5. Push the branch and open a pull request.

## Security

Do not publish MongoDB credentials, JWT secrets, Cloudinary secrets, or personal item details. The project uses JWT authentication and role-protected routes, but it should receive an additional security review before production use.

## License

No license has been specified for this project. All rights are retained by the repository owner unless a license is explicitly added.

## Author

Developed by:
1. [Nikhil Negi](https://github.com/Nikhilidk).
2. [Ausaaf Siddiqui](https://github.com/ausaafffff).
3. [Sanyam Baranwal](https://github.com/sanyam-2006)

## Live Demo

Visit **[https://amitto.vercel.app](https://amitto.vercel.app)**.
