import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, Video, Database } from 'lucide-react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'IG Accounts', icon: Users, path: '/accounts' },
    { label: 'Hook Bank', icon: Database, path: '/hooks' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full flex-shrink-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Video className="w-6 h-6 text-indigo-500 mr-3" />
        <span className="text-white font-bold text-lg tracking-wide">Celebify<span className="text-indigo-400">Pipe</span></span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      {/* User Area Footer (Optional) */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-slate-500">Local Environment</p>
          </div>
        </div>
      </div>
    </div>
  );
}
