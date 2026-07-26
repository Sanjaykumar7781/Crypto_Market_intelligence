import { Github, GitPullRequest, GitMerge, FileCode, Users } from 'lucide-react';
import { number } from '../../utils/format.js';

export default function CoinDeveloper({ coin }) {
  // Generate realistic mock data for Github activity
  const dev = {
    score: coin.developerScore || Math.floor(Math.random() * 30) + 70,
    commits: Math.floor(Math.random() * 5000) + 1000,
    prs: Math.floor(Math.random() * 800) + 200,
    issues: Math.floor(Math.random() * 1200) + 300,
    contributors: Math.floor(Math.random() * 300) + 50,
    stars: Math.floor(Math.random() * 10000) + 2000,
    lastCommit: `${Math.floor(Math.random() * 24) + 1} hours ago`
  };

  return (
    <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Github className="text-gray-900 size-5" />
          <h2 className="text-lg font-bold text-gray-900">Developer Activity</h2>
        </div>
        <span className="bg-gray-100 text-gray-900 px-2.5 py-1 rounded-lg text-xs font-black">
          Score: {Number(dev.score).toFixed(0)}/100
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <DevStat icon={<FileCode size={14} className="text-blue-500" />} label="Commits" value={number(dev.commits)} />
        <DevStat icon={<Users size={14} className="text-purple-500" />} label="Contributors" value={number(dev.contributors)} />
        <DevStat icon={<GitPullRequest size={14} className="text-green-500" />} label="Merged PRs" value={number(dev.prs)} />
        <DevStat icon={<Github size={14} className="text-gray-500" />} label="Stars" value={number(dev.stars)} />
      </div>
      
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase">Last Commit</span>
        <span className="text-sm font-bold text-gray-900 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success"></span> {dev.lastCommit}
        </span>
      </div>
    </div>
  );
}

function DevStat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="size-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide leading-none">{label}</span>
        <span className="text-sm font-black text-gray-900 leading-tight mt-0.5">{value}</span>
      </div>
    </div>
  );
}
