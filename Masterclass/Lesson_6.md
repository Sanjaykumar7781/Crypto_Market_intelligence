# 🎓 Crypto Market Intelligence Masterclass - Lesson 6

Welcome to Lesson 6! In this module, we are covering **Phase 10 (Prototype)**. We will map out the visual structure, navigation, and user journey of the Crypto Market Intelligence platform.

---

## 🗺️ 1. Navigation Flow

This represents the Sitemap and how the application is structured hierarchically.

```mermaid
graph TD
    A[Landing Page / Login] --> B{Authenticated?}
    B -- No --> C[Register Page]
    C --> A
    B -- Yes --> D[Dashboard (Home)]
    
    D --> E[Portfolio Page]
    D --> F[Market Explorer]
    D --> G[News & Sentiment]
    D --> H[User Profile]
    
    E --> E1[Add/Edit Holdings]
    E --> E2[AI Portfolio Analysis]
    E --> E3[Export PDF Report]
    
    F --> F1[Coin Details View]
    F1 --> F2[Interactive Price Chart]
```

---

## 🚶‍♂️ 2. User Journey

Let's walk through a standard "Happy Path" user journey for a new investor looking to optimize their crypto holdings.

1. **Onboarding:** 
   - User arrives at the landing page and is greeted by a modern, dark-themed UI.
   - User clicks "Get Started" and registers with an email and password.
2. **Dashboard Initialization:** 
   - User is routed to the Dashboard. It is mostly empty but shows live Bitcoin/Ethereum prices.
   - A call-to-action prompts them to "Build Your Portfolio".
3. **Data Entry:** 
   - User navigates to the Portfolio page. 
   - User clicks "Add Asset", searches for "Solana", enters amount `50` and average buy price `$20`.
   - The UI immediately updates with a pie chart showing their allocation.
4. **AI Consultation:** 
   - User clicks the glowing "Ask AI Advisor" button.
   - The system bundles their portfolio and sends it to the Groq API.
   - A modal pops up returning a Health Score of `65/100` and advises taking some profits on Solana due to high concentration risk.
5. **Action & Export:** 
   - The user adjusts their holdings accordingly.
   - They click "Export Report" to generate a PDF of their current portfolio standing.

---

## 📱 3. UI Wireframes (Low-Fidelity)

Here are ASCII representations of the core UI layouts, demonstrating where components sit on the screen.

### Screen 1: The Main Dashboard
*Purpose: A quick glance at the market and the user's top tracked assets.*

```text
+-------------------------------------------------------------+
|  [Logo] Crypto-AI      Dashboard  Portfolio  News   [User]  |
+-------------------------------------------------------------+
|                                                             |
|  [ Global Market Cap: $2.4T ]      [ Fear & Greed: 74 ]     |
|                                                             |
|  +-----------------------+   +--------------------------+   |
|  | ⭐ Watchlist          |   | 📈 Trending Now          |   |
|  |-----------------------|   |--------------------------|   |
|  | BTC  $64,000  [+2%]   |   | PEPE  $0.003    [+15%]   |   |
|  | ETH  $3,400   [-1%]   |   | SHIB  $0.02     [+10%]   |   |
|  | SOL  $145     [+4%]   |   | RNDR  $10.20    [-2%]    |   |
|  +-----------------------+   +--------------------------+   |
|                                                             |
|  +------------------------------------------------------+   |
|  | 📊 Main Market Chart (BTC/USD - 24h)                 |   |
|  |                                                      |   |
|  |       /\                                             |   |
|  |   ___/  \__      /\                                  |   |
|  |  /         \____/  \___                              |   |
|  +------------------------------------------------------+   |
+-------------------------------------------------------------+
```

### Screen 2: The Portfolio & AI Advisor
*Purpose: Managing holdings and interacting with the LLM.*

```text
+-------------------------------------------------------------+
|  [Logo] Crypto-AI      Dashboard  Portfolio  News   [User]  |
+-------------------------------------------------------------+
|                                                             |
|  Total Balance: $14,500.00         [+ Add Asset Button]     |
|  24h Profit: +$450.00 (3.2%)                                |
|                                                             |
|  +-------------------------+  +-------------------------+   |
|  | 🍩 Asset Allocation     |  | 🤖 AI Portfolio Advisor |   |
|  |    (Recharts Pie)       |  |-------------------------|   |
|  |        ***              |  | Health Score: 85/100    |   |
|  |      *     *   BTC 60%  |  |                         |   |
|  |      *     *   ETH 30%  |  | "Your portfolio is well |   |
|  |        ***     SOL 10%  |  | diversified. Consider   |   |
|  |                         |  | adding stablecoins."    |   |
|  +-------------------------+  |                         |   |
|                               |  [ Generate New Advice ]|   |
|                               +-------------------------+   |
|                                                             |
|  +------------------------------------------------------+   |
|  | Your Holdings                                        |   |
|  |------------------------------------------------------|   |
|  | Asset  | Amount | Avg Buy | Current | P/L      | Act |   |
|  | Bitcoin| 0.15   | $40,000 | $64,000 | +$3,600  | [x] |   |
|  | Ethere | 1.5    | $2,000  | $3,400  | +$2,100  | [x] |   |
|  +------------------------------------------------------+   |
+-------------------------------------------------------------+
```

### Screen 3: The News & Sentiment Feed
*Purpose: Gathering context from the outside world without leaving the app.*

```text
+-------------------------------------------------------------+
|  [Logo] Crypto-AI      Dashboard  Portfolio  News   [User]  |
+-------------------------------------------------------------+
|                                                             |
|  📰 Live Market News & AI Sentiment                         |
|                                                             |
|  +------------------------------------------------------+   |
|  | "SEC Approves New Ethereum ETFs"                     |   |
|  | Source: CoinDesk | 10 mins ago                       |   |
|  |                                                      |   |
|  | 🤖 AI Sentiment: [ BULLISH ]                         |   |
|  | *Summary: Institutional inflows expected to surge...*|   |
|  +------------------------------------------------------+   |
|                                                             |
|  +------------------------------------------------------+   |
|  | "Inflation Data Comes in Hotter Than Expected"       |   |
|  | Source: Bloomberg | 1 hour ago                       |   |
|  |                                                      |   |
|  | 🤖 AI Sentiment: [ BEARISH ]                         |   |
|  | *Summary: High interest rates may pressure risk...*  |   |
|  +------------------------------------------------------+   |
+-------------------------------------------------------------+
```

---

## 🔄 4. Screen Flow

**State Management Transitions:**
1. **Unauthenticated State:** If the JWT is missing or expired, the React Router intercepts routes like `/portfolio` and redirects to `/login`.
2. **Loading State:** When a user clicks "Generate New Advice", a React state `isAnalyzing` is set to `true`. The AI Advisor panel replaces its text with a shimmering Tailwind Skeleton loader while the API request processes.
3. **Modal State:** Clicking `[+ Add Asset Button]` triggers a React Portal modal overlaid on the screen with a darkened backdrop (`bg-black/50 backdrop-blur`), ensuring the user focuses solely on entering their buy price and amount without leaving the page context.
