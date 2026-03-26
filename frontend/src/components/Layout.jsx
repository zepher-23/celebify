import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Outlet } from 'react-router-dom';

export function Layout({ activeAccount, onAccountChange, accounts }) {
  return (
    <div className="flex h-screen w-full bg-[#0B0F19] overflow-hidden text-slate-300 font-sans selection:bg-indigo-500/30">
      
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        
        {/* Top Navigation */}
        <Navbar 
          activeAccount={activeAccount} 
          onAccountChange={onAccountChange} 
          accounts={accounts} 
        />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
        
      </div>
    </div>
  );
}
