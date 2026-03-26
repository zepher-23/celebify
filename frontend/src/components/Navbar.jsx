import React from 'react';
import { Bell, Search } from 'lucide-react';

export function Navbar({ activeAccount, onAccountChange, accounts = [] }) {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
      
      {/* Left side Search (visual only for now) */}
      <div className="flex items-center flex-1">
        <div className="relative w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search videos or accounts..." 
            className="w-full bg-slate-800 border-none rounded-md py-1.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Right side Context */}
      <div className="flex items-center space-x-6">
        
        {/* Active Account Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active IG:</span>
          <select 
            value={activeAccount}
            onChange={(e) => onAccountChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-sm text-white rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            {accounts.length === 0 ? (
              <option value="">No accounts found</option>
            ) : (
              accounts.map(acc => (
                <option key={acc.id} value={acc.igAccountId}>
                  {acc.name} ({acc.igAccountId})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Notifications */}
        <button className="text-slate-400 hover:text-white relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>

      </div>
    </header>
  );
}
