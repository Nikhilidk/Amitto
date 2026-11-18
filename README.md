# Amitto

[![Live Demo](https://img.shields.io/badge/Live-Demo-22c55e?style=for-the-badge)](https://amitto.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)

**Amitto is a community lost-and-found platform.** It helps people report lost items, share details about items they have found, and contact one another to help return belongings to their owners. It is designed with university communities in mind, where students and staff often use the same buildings and shared spaces.

With Amitto, a user can create a listing, add details such as the item’s location and date, and include an image. Other users can browse listings, leave comments, and use the platform’s claim and messaging features to discuss an item. Administrator tools support moderation of the community.

**[Visit the live site](https://amitto.vercel.app)**

## Table of Contents

- [Introduction](#introduction)
- [What Makes Amitto Useful?](#what-makes-amitto-useful)
- [Features](#features)
- [How It Works](#how-it-works)
- [Technology](#technology)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [Deployment](#deployment)
- [Limitations](#limitations)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Authors](#authors)
- [Live Demo](#live-demo)

## Introduction

### The problem

When someone loses an item, they may not know where to report it or how to reach the person who found it. Information can end up spread across group chats, social media, and physical notice boards. This makes it difficult to find relevant posts and follow up safely.

### The solution

Amitto brings lost-and-found listings and related conversations together in one web application. Users can describe an item, browse listings, and communicate with other users through the platform. The aim is to make it easier for a community to share useful information and help return items.

Amitto is a university project and is best understood as a community tool—not as a guarantee that an item will be found or returned.

## What Makes Amitto Useful?

- **Clear listings:** Posts can include whether an item was lost or found, a description, category, location, date, and image.
- **A connected recovery process:** Users can browse posts, discuss them, and use claim-related features in the same application.
- **Communication in one place:** Comments and private conversations help users follow up without relying only on outside messaging apps.
- **Community moderation:** Administrator tools are available to help manage listings and users.
- **Designed for shared spaces:** A campus community can use the platform to share reports about places such as classrooms, libraries, and common areas.

## Features

- Create an account and sign in using JWT-based authentication.
- Create and manage posts for lost and found items.
- Add item details such as a description, category, location, date, and image.
- Upload images using Cloudinary.
- Browse and search community listings.
- Comment on listings and discuss item details.
- Use claim-related features to start an ownership discussion.
- Send private messages using Socket.IO-powered communication.
- View user profiles and post activity.
- Protect student and administrator routes.
- Use the administrator dashboard for community moderation.

## How It Works

1. **Create an account or sign in.** Users need an account to access protected parts of the application.
2. **Create a listing.** Choose whether the item was lost or found, then add the details that may help someone recognize it.
3. **Browse listings.** Look through community posts and search for information that matches the item.
4. **Discuss a possible match.** Use comments, claim-related features, or private messaging to ask questions and share information.
5. **Follow up carefully.** Confirm ownership with details that are not already visible in the listing before arranging the return.

Amitto provides tools for communication and claims, but users are responsible for making safe decisions when meeting or sharing information.

## Technology

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
- MongoDB and Mongoose
- JSON Web Tokens (JWT)
- bcrypt
- Cloudinary and Multer
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

Follow these steps to run Amitto on your computer. You will need to set up the frontend and backend in separate terminals.

### Prerequisites

Install or prepare the following before you begin:

- Node.js 18 or newer
- npm (included with Node.js)
- Git
- A MongoDB database
- A Cloudinary account for image uploads

### 1. Clone the repository

```bash
git clone https://github.com/Nikhilidk/Amitto.git
cd Amitto
```

### 2. Install and configure the backend

```bash
cd server
npm install
cp .env.example .env
```

Open `server/.env` and replace the example values with your own configuration:

```env
PORT=5000
MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/<app_name>
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret_here
CLIENT_ORIGIN=http://localhost:5173
```

Use the database connection string and Cloudinary credentials from your own accounts. Keep these values private and do not commit your `.env` file.

Start the backend from the `server` directory:

```bash
node index.js
```

By default, the backend is available at `http://localhost:5000`.

### 3. Install and run the frontend

Open a second terminal at the repository root, then run:

```bash
cd client
npm install
npm run dev
```

By default, the frontend is available at `http://localhost:5173`. Keep both the frontend and backend running while using the local application.

## Available Scripts

Run frontend commands from the `client` directory:

| Command | Description |
|---|---|
| `npm run dev` | Start the frontend development server. |
| `npm run build` | Create a production build of the frontend. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Check frontend code with ESLint. |

Run the backend command from the `server` directory:

| Command | Description |
|---|---|
| `node index.js` | Start the Express API and Socket.IO server. |

## API Overview

The backend groups its REST API routes by purpose:

| Route group | Purpose |
|---|---|
| `/api/auth` | User registration, login, and authentication. |
| `/api/posts` | Lost-and-found posts and claim-related operations. |
| `/api/comments` | Comments on posts. |
| `/api/conversations` | Direct conversations between users. |
| `/api/admin` | Administrative moderation tools. |
| `/api/test` | Server health check. |

Some API routes require a valid JSON Web Token. The required access depends on the route and the user’s role.

## Deployment

- The React frontend can be deployed to Vercel from the `client` directory.
- The Express backend needs a hosting service that supports Node.js.
- Configure the MongoDB connection, Cloudinary credentials, JWT secret, and allowed frontend origin in the hosting provider’s environment settings.
- Make sure the frontend is configured to contact the deployed backend, and that the backend allows requests from the deployed frontend domain.
- Never put private credentials in frontend code or commit them to the repository.

## Limitations

Amitto can help a community share information, but it has limits that users should understand:

- **A listing does not guarantee recovery.** An item may not be found, reported, or returned.
- **Claims need human judgment.** The platform’s claim and messaging features support discussion; they do not prove that a person owns an item.
- **Users must protect private information.** Do not include passwords, full addresses, financial details, or other sensitive information in a post or message.
- **Meet safely.** Arrange returns in a public place and involve campus staff or another trusted person when appropriate. Do not meet someone if you feel unsafe.
- **Service availability depends on external services.** The application uses MongoDB, Cloudinary, and hosting providers. Problems or outages with those services can affect the site or image uploads.
- **The project is focused on a community use case.** Its features and setup are intended for a university-style community and may not meet the needs of a large public service without further work.
- **Production readiness needs review.** Before using Amitto for a larger or sensitive deployment, review its security, privacy, accessibility, backup, and moderation processes.
- **Mobile support may vary.** Amitto is a web application; this repository does not describe a separate native mobile application.

## Roadmap

Possible future improvements include:

- More advanced search and filtering.
- Recommendations based on item categories.
- More detailed campus and location filters.
- Improvements to claim verification.
- Notifications and reporting tools.
- More automated moderation support.
- A mobile application.

## Contributing

Contributions are welcome. To suggest a change:

1. Fork the repository.
2. Create a branch for your work:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes and test the frontend and backend.
4. Commit your changes:

   ```bash
   git commit -m "Add your feature"
   ```

5. Push your branch and open a pull request with a clear explanation of the change.

## Security

Do not publish MongoDB credentials, JWT secrets, Cloudinary secrets, or sensitive personal information about an item or its owner. Store secrets in environment variables. Amitto includes JWT authentication and role-protected routes, but those features do not replace a full security review before production use.

## License

No license has been specified for this project. Unless a license is added, all rights are retained by the repository owner.

## Authors

Developed by:

- [Nikhil Negi](https://github.com/Nikhilidk)
- [Ausaaf Siddiqui](https://github.com/ausaafffff)
- [Sanyam Baranwal](https://github.com/sanyam-2006)

## Live Demo

Visit **[https://amitto.vercel.app](https://amitto.vercel.app)**.
