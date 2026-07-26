# 🎓 Crypto Market Intelligence Masterclass - Lesson 3

In this lesson, we will cover **Phase 5 (Machine Learning & AI)** and **Phase 6 (Database)**.

---

## 🧠 PHASE 5 – MACHINE LEARNING & AI

This project does not train a Machine Learning model from scratch (like a bespoke Random Forest or PyTorch neural network). Instead, it utilizes **Generative AI** and **Prompt Engineering** via a state-of-the-art Large Language Model (LLM). 

Specifically, it uses **Meta's Llama 3.3 (70B parameter model)** hosted on the **Groq API**.

### How the AI Pipeline Works

1. **Dataset / Context Gathering:**
   The backend collects hard data: The user's current portfolio holdings (coins, amounts, average buy prices), live market prices from CoinGecko, and global market sentiment (Fear & Greed index).

2. **Feature Engineering (Prompt Construction):**
   Instead of feeding a matrix of numbers into a classical ML model, the "features" are engineered into a structured text prompt.
   *Example: "The user holds 0.5 BTC bought at $50k, current price is $65k. The market is in 'Extreme Greed'."*

3. **Inference (Prediction Pipeline):**
   The prompt is sent to the Groq API. We instruct the LLM to act as a Senior Financial Advisor. We also mandate that the LLM responds **only in strict JSON format**.

4. **Output Parsing:**
   The backend receives the response, parses the JSON, and extracts the generated metrics:
   - `health_score` (0-100)
   - `risk_assessment` (Low, Medium, High)
   - `rebalancing_recommendations` (e.g., Sell 10% BTC, Buy 20% ETH)

### Why this approach was chosen:
- **Speed:** Groq's LPU (Language Processing Unit) architecture is incredibly fast, allowing for real-time generative responses.
- **Flexibility:** Traditional ML requires retraining when market paradigms shift. An LLM can reason about novel market conditions (e.g., a sudden regulatory change) if fed the right context (news articles).
- **Explainability:** The LLM can generate human-readable justifications for its trades, whereas traditional models are often "black boxes."

---

## 💾 PHASE 6 – DATABASE

The project uses **MongoDB**, a NoSQL document database, with **Mongoose** as the Object Data Modeling (ODM) library.

### Database Schema Overview

Since it's NoSQL, data is stored in BSON (Binary JSON) documents organized into Collections (tables).

#### Key Collections (Tables)

1. **Users** (`server/models/User.js`)
   - **Fields:** `email`, `password` (hashed), `name`, `createdAt`.
   - **Role:** Handles authentication.

2. **Portfolios** (`server/models/Portfolio.js`)
   - **Fields:** `userId` (reference to User), `coinId` (string identifier from CoinGecko), `amount` (number), `buyPrice` (number).
   - **Relationships:** One-to-Many (One User has Many Portfolio entries).
   - **Keys:** `userId` acts as a foreign key linking back to the `Users` collection.

3. **Watchlists** (`server/models/Watchlist.js`)
   - **Fields:** `userId`, `coins` (Array of strings).
   - **Role:** Stores the specific cryptocurrencies a user wants to track on their dashboard.

4. **InsightsCache** (`server/models/InsightsCache.js`)
   - **Fields:** `coinId`, `ai_analysis`, `createdAt`.
   - **Role:** Performance optimization. AI calls cost money and time. If a user asks for analysis on Bitcoin, the result is cached here with a TTL (Time To Live) index. If another user asks 5 minutes later, it serves the cached result instead of hitting the Groq API again.

### Example CRUD Operations (via Mongoose)

- **Create (Add holding):** 
  `Portfolio.create({ userId: '123', coinId: 'bitcoin', amount: 1.5, buyPrice: 40000 })`
- **Read (Get user holdings):** 
  `Portfolio.find({ userId: '123' })`
- **Update (Modify amount):** 
  `Portfolio.findOneAndUpdate({ userId: '123', coinId: 'bitcoin' }, { amount: 2.0 })`
- **Delete (Remove holding):** 
  `Portfolio.findOneAndDelete({ _id: 'holding_id' })`

---
### 🧠 Lesson 3 Quiz

1. Why does this project use an LLM instead of a traditional trained Machine Learning model for advisory?
2. What is the purpose of the `InsightsCache` collection?
3. How is the relationship between a `User` and their `Portfolio` established in MongoDB?
