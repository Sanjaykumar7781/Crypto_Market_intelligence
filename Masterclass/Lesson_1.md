# 🎓 Crypto Market Intelligence Masterclass - Lesson 1

Welcome to your Senior-Level deep dive into the **Crypto Market Intelligence** project! In this lesson, we will cover **Phase 1 (Project Overview)** and **Phase 2 (Project Structure)**. 

---

## 📈 PHASE 1 – PROJECT OVERVIEW

### 1. The Core Explanation
**What problem this project solves:**
Navigating cryptocurrency markets is overwhelming. Traders have to use multiple apps for news, price tracking, portfolio management, and market analysis. This project centralizes all these needs and integrates **AI (Generative AI via Llama 3.3)** to interpret the data, providing actionable insights instead of just raw numbers.

**Why it was created:**
To demonstrate full-stack architectural competence (MERN stack + AI + WebSockets). It bridges the gap between traditional portfolio trackers (like CoinMarketCap) and modern AI-driven advisory tools. 

**Who will use it:**
- **Retail Crypto Investors:** People holding a diverse portfolio who want AI-driven advice on rebalancing.
- **Day Traders:** Users relying on the real-time WebSocket telemetry for immediate price action.
- **Enthusiasts:** Users who want curated news and sentiment analysis in one dashboard.

**Real-world applications:**
This is an enterprise-grade prototype for a Fintech SaaS platform. Real-world applications include robo-advisory platforms, crypto brokerage dashboards, and personal finance management tools.

### 2. Overall Architecture & Workflow
The architecture follows a standard client-server model but is enhanced with real-time bidirectional communication and an external AI inference engine.

**Workflow:**
1. **User Action:** The user logs in via the React frontend.
2. **API Request:** An HTTP request goes to the Express API.
3. **Authentication:** The JWT middleware verifies the user's identity.
4. **Data Retrieval:** The Express backend pulls portfolio data from MongoDB.
5. **Real-time Feed:** The frontend establishes a WebSocket connection to receive live price pulses.
6. **AI Analysis:** When requested, the backend bundles the user's portfolio data and sends it to the Groq API (Llama 3.3), receiving a JSON response with trade signals.
7. **Display:** The frontend consumes these responses and renders interactive charts (Recharts) and AI advice.

### 3. Architecture Diagram (ASCII)

```text
       [User / Browser]
              │
              ▼
    [React Frontend (Vite)] ──────(WebSockets)──────┐
              │                                     │
         (REST HTTPS)                               │
              │                                     │
              ▼                                     ▼
 [Express API Gateway (Node.js)] ◄──────► [Socket.io Server]
              │
  ┌───────────┼────────────┐
  ▼           ▼            ▼
[MongoDB]   [Groq API]  [CoinGecko API]
(Data)     (Llama 3.3)   (Market Data)
```

---

## 📁 PHASE 2 – PROJECT STRUCTURE

Let's dissect the repository structure. This is a monorepo setup containing both the frontend (`src/`) and backend (`server/`).

### Root Directory
- **`package.json`**: The central orchestrator. Uses `concurrently` to run both the Vite frontend and Node backend simultaneously during development.
- **`README.md`**: The technical manifesto of the project. 
- **`vite.config.js`**: Configuration for the frontend bundler (Vite). Often contains a proxy setup to route `/api` calls to the local Express server.

### `/src` - The Frontend (React)
This folder holds the UI layer. It's built with React 19 and styled with Tailwind CSS.

- **`components/`**: Reusable UI blocks.
  - *Why it exists:* To keep code DRY (Don't Repeat Yourself). Contains buttons, charts, and layout wrappers.
- **`pages/`**: Top-level route components.
  - *Why it exists:* Each file here typically corresponds to a URL route (e.g., `/dashboard`, `/portfolio`).
- **`context/`**: React Context providers.
  - *Why it exists:* For global state management without prop-drilling (e.g., AuthContext for user login state, ThemeContext).
- **`hooks/`**: Custom React hooks.
  - *Why it exists:* To encapsulate reusable logic.
  - *Important File:* `useSocketMarket.js` - Manages the WebSocket connection to the backend.
- **`services/`**: API abstraction.
  - *Why it exists:* Centralizes all `axios` calls to the backend, making it easier to manage headers (like JWT tokens).

### `/server` - The Backend (Node.js/Express)
This folder is the brain of the application.

- **`index.js`**: The entry point. Initializes Express, sets up middleware (Helmet, CORS), connects to the DB, and starts the server.
- **`config/`**: Configuration loaders. Usually loads `.env` variables.
- **`db.js`**: Handles the Mongoose connection to MongoDB Atlas.
- **`models/`**: Mongoose Schemas defining the database structure.
  - *Important Files:* `User.js` (Auth credentials), `Portfolio.js` (User holdings), `Watchlist.js`.
- **`controllers/`**: The business logic layer.
  - *Why it exists:* Keeps routes clean. A route calls a controller function, and the controller handles the DB interaction and response.
  - *Important File:* `portfolioController.js` - Where the AI analysis logic is likely orchestrated.
- **`routes/`**: API endpoints definition.
  - *Why it exists:* Maps URLs (e.g., `POST /api/auth/login`) to specific controller functions.
- **`middleware/`**: Request interceptors.
  - *Important Files:* `auth.js` (Validates JWT tokens before allowing access to protected routes).
- **`services/`**: External API integrations.
  - *Why it exists:* Separates internal logic from third-party logic.
  - *Important Files:* `groqService.js` (Talks to the AI) and `coinGeckoService.js` (Fetches market data).

---
### 🧠 Lesson 1 Quiz

1. Why does the project use WebSockets alongside REST APIs?
2. What role does the `Groq API` play in this architecture?
3. Where in the folder structure would you look to find the database schema for a User's portfolio?

*(Answers will be provided in your ongoing studies!)*
