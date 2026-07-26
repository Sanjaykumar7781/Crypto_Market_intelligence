# 🎓 Crypto Market Intelligence Masterclass - Lesson 2

In this lesson, we will cover **Phase 4 (Complete Data Flow)** and **Phase 8 (Project Execution)**.

---

## 🌊 PHASE 4 – COMPLETE DATA FLOW

Let's trace a single complex action through the entire application stack: **A user requesting AI Portfolio Analysis.**

### Step-by-Step Flow

1. **User Click (Frontend):**
   The user clicks the "Analyze Portfolio" button on the UI.
   
2. **Frontend Service (`src/services/api.js`):**
   The React component calls an API utility function.
   ```javascript
   // The frontend sends a POST request with the user's auth token
   axios.post('/api/portfolio/analyze', {}, {
       headers: { Authorization: `Bearer ${token}` }
   })
   ```

3. **API Gateway / Router (`server/routes/portfolioRoutes.js`):**
   The request hits the Express server. The router directs it through middleware before it reaches the controller.
   ```javascript
   router.post('/analyze', authMiddleware, portfolioController.analyzePortfolio);
   ```

4. **Middleware (`server/middleware/auth.js`):**
   The `authMiddleware` intercepts the request. It extracts the JWT from the headers, verifies it using `jsonwebtoken` and `JWT_SECRET`, and attaches the decoded `userId` to the request object (`req.user = decoded`).

5. **Controller (`server/controllers/portfolioController.js`):**
   The controller handles the business logic.
   - It queries the database for the user's portfolio items using the `userId`.
   - It transforms the database documents into a clean JSON structure suitable for the AI.

6. **External AI Service (`server/services/groqService.js`):**
   The controller passes the portfolio data to the Groq AI service.
   - The service constructs a system prompt for the `Llama-3.3-70b-versatile` model.
   - It sends the request to the Groq API.
   - It parses the response (ensuring it's valid JSON).

7. **Database Update / Cache (`server/models/InsightHistory.js`):**
   *(If applicable)* The controller might save this generated insight to the database for historical tracking.

8. **Response (`server/utils/response.js`):**
   The controller sends the AI's response back to the client with a 200 OK status.

9. **Dashboard (`src/pages/Portfolio.jsx`):**
   The React component receives the JSON data from the API and updates its local state. The UI re-renders, displaying the AI's health score, risk assessment, and rebalancing recommendations using Recharts and Tailwind CSS components.

---

## 🚀 PHASE 8 – PROJECT EXECUTION

What actually happens under the hood when you run `npm run dev` in the terminal?

Let's break down the `package.json` script:
`"dev": "concurrently \"npm:dev:api\" \"npm:dev:web\""`

### Step 1: The Orchestrator (`concurrently`)
The `concurrently` package allows multiple terminal commands to run in parallel within the same terminal window. It spins up two separate processes.

### Step 2: The Backend Process (`npm run dev:api`)
Executes: `nodemon server/index.js`
1. **Nodemon** starts and watches the `/server` directory for any file changes (restarting the server automatically if you edit code).
2. `server/index.js` executes.
3. Express application initializes.
4. `mongoose.connect()` fires, establishing a connection pool to MongoDB Atlas.
5. Middleware (Helmet, CORS, body-parser) are mounted to the Express app.
6. The `Socket.io` server binds to the Express HTTP server.
7. The server begins listening on `PORT` (e.g., 8080). Console logs "Server running on port 8080".

### Step 3: The Frontend Process (`npm run dev:web`)
Executes: `vite --host 0.0.0.0`
1. **Vite** (the build tool) starts its incredibly fast ES Module dev server.
2. It reads `vite.config.js`. It sets up an HTTP proxy (if configured) so that requests to `/api` on the frontend port are seamlessly forwarded to the backend port (8080).
3. It parses `index.html` and finds `<script type="module" src="/src/main.jsx"></script>`.
4. Vite serves the React application. It uses Hot Module Replacement (HMR) to instantly update the UI when you change CSS or React components without a full page reload.
5. The local development URL (e.g., `http://localhost:5173`) is exposed.

### Summary of Execution
When you run `npm run dev`, you are simultaneously starting a Node/Express backend that connects to a database, and a Vite/React dev server that compiles your UI on the fly, with both communicating seamlessly.

---
### 🧠 Lesson 2 Quiz

1. What is the purpose of the `authMiddleware` in the data flow?
2. Why does the project use `concurrently` in the `package.json`?
3. What is the primary difference in how `nodemon` and `vite` handle code changes during development?
