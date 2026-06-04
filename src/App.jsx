import { Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar.jsx';
import MarketTicker from './components/MarketTicker.jsx';
import ChatBot from './components/ChatBot.jsx';
import Home from './pages/Home.jsx';
import CoinDetails from './pages/CoinDetails.jsx';
import News from './pages/News.jsx';
import Articles from './pages/Articles.jsx';
import ArticleDetails from './pages/ArticleDetails.jsx';
import Watchlist from './pages/Watchlist.jsx';
import Portfolio from './pages/Portfolio.jsx';
import Auth from './pages/Auth.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    <div className="relative min-h-svh w-full overflow-x-hidden bg-[#050505] text-slate-100">
      <Navbar />
      <MarketTicker />
      <main className="relative z-10 min-w-0 w-full px-3 pb-12 pt-32 sm:px-5 lg:px-8">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/coin/:id" element={<CoinDetails />} />
            <Route path="/news" element={<News />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slug" element={<ArticleDetails />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </AnimatePresence>
      </main>
      <ChatBot />
    </div>
  );
}
