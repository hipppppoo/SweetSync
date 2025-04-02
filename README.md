# SweetSync

A comprehensive relationship management application that helps couples track important moments, preferences, and milestones in their relationship.

## Features

- 🎉 **Anniversary Tracker:** Keep track of important dates and milestones.
- 📅 **Period Tracker:** Monitor menstrual cycles.
- 🌸 **Flower Tracker:** Log when flowers were last received or given.
- 🎭 **Date Nights:** Plan and record date night details and ratings.
- 😊 **Wellness Tracker:** Log daily mood, energy, stress, health, sleep, and view trends over time with a longitudinal graph.
- ❤️ **Favorite Things:** Keep a list of favorite items, places, etc., with ratings and categories.
- 🎯 **Shared Goals:** Track progress towards shared couple goals.
- 🌺 **Seasonal Events:** Manage recurring seasonal events or activities.
- 🤖 **AI Advice Module:** Get relationship advice powered by AI.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB
- **AI Integration:** OpenAI API

## Getting Started

### Prerequisites

- Node.js (v16 or higher suggested)
- npm (v7 or higher suggested)
- MongoDB (running locally or connection string for Atlas/other provider)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/sweetsync.git # Replace with your repo URL
    cd sweetsync
    ```

2.  **Install dependencies:** (Installs for root, frontend, and backend)
    ```bash
    npm run install:all
    ```

3.  **Create Environment Files:**
    *   **Backend:**
        *   Navigate to the `backend` directory: `cd backend`
        *   Copy `.env.example` to `.env`: `cp .env.example .env` (or copy manually)
        *   Edit `.env` and fill in your:
            *   `MONGODB_URI` (connection string for your MongoDB database)
            *   `JWT_SECRET` (a secure random string for session management)
            *   `OPENAI_API_KEY` (required for the AI Advice feature)
            *   Optionally adjust `PORT` or `NODE_ENV`.
        *   Navigate back to the root directory: `cd ..`
    *   **Frontend:**
        *   The frontend may have its own `.env` file or rely on the backend's environment setup depending on configuration (e.g., for API URLs). Check the `frontend` directory for a `.env.example` if needed.

4.  **Start Development Servers:** (Runs both frontend and backend concurrently from the root directory)
    ```bash
    npm run dev
    ```
    This will typically start the backend on `http://localhost:3000` (or your configured PORT) and the frontend on `http://localhost:5173` (Vite's default).

## Project Structure

```
sweetsync/
├── frontend/          # React (Vite + TypeScript) frontend application
│   ├── src/
│   └── ...
├── backend/           # Node.js/Express (TypeScript) backend
│   ├── src/
│   └── .env.example   # Backend environment variables template
├── node_modules/      # Root dependencies (like concurrently)
├── package.json       # Root package.json for workspace management & scripts
├── package-lock.json
└── README.md          # Project documentation
```

## Contributing

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

This project is licensed under the ISC License. 