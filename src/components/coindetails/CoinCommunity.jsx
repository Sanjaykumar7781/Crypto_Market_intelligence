import { Users, MessagesSquare, MessageCircle, Github, Heart } from 'lucide-react';
import { number } from '../../utils/format.js';

export default function CoinCommunity({ coin }) {
  // Generate mock data safely scaled to the coin's market cap rank or a fallback
  const rankMultiplier = Math.max(1, 100 - (coin.marketCapRank || 50));
  
  const community = {
    twitter: coin.twitterFollowers || Math.floor(Math.random() * 500000) + (rankMultiplier * 10000),
    reddit: coin.redditSubscribers || Math.floor(Math.random() * 100000) + (rankMultiplier * 2000),
    telegram: coin.telegramMembers || Math.floor(Math.random() * 80000) + (rankMultiplier * 1500),
    discord: coin.discordMembers || Math.floor(Math.random() * 60000) + (rankMultiplier * 1000),
    score: coin.communityScore || Math.floor(Math.random() * 40) + 60,
  };

  return (
    <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="text-indigo-500 size-5" />
          <h2 className="text-lg font-bold text-gray-900">Community</h2>
        </div>
        <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-xs font-black">
          Score: {Number(community.score).toFixed(0)}/100
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CommunityItem icon={<MessageCircle size={14} className="text-[#1DA1F2]" />} label="Twitter" value={number(community.twitter)} />
        <CommunityItem icon={<MessagesSquare size={14} className="text-[#FF4500]" />} label="Reddit" value={number(community.reddit)} />
        <CommunityItem icon={<MessagesSquare size={14} className="text-[#0088cc]" />} label="Telegram" value={number(community.telegram)} />
        <CommunityItem icon={<MessageCircle size={14} className="text-[#5865F2]" />} label="Discord" value={number(community.discord)} />
      </div>
    </div>
  );
}

function CommunityItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div className="size-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-black text-gray-900">{value}</div>
      </div>
    </div>
  );
}
