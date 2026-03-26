import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AtSign } from 'lucide-react';

export function Accounts({ accounts, fetchAccounts }) {
  const [name, setName] = useState('');
  const [igAccountId, setIgAccountId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !igAccountId) return;
    
    setLoading(true);
    try {
      await fetch('http://localhost:3000/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, igAccountId })
      });
      setName('');
      setIgAccountId('');
      fetchAccounts(); 
    } catch (err) {
      console.error("Failed to add account", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/accounts/${id}`, { method: 'DELETE' });
      fetchAccounts();
    } catch (err) {
      console.error("Failed to delete account", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Instagram Accounts</h1>
        <p className="text-slate-400 mt-2">Manage the Instagram profiles your automation will publish to.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">Add New Account</h2>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Motivation Daily"
              className="w-full bg-slate-800 border-none rounded-md py-2 px-3 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">IG Account ID</label>
            <input
              type="text"
              value={igAccountId}
              onChange={(e) => setIgAccountId(e.target.value)}
              placeholder="178414..."
              className="w-full bg-slate-800 border-none rounded-md py-2 px-3 text-sm text-white placeholder:text-slate-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="h-9 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <span className="animate-spin mr-2">⟳</span> : <Plus className="w-4 h-4 mr-2" />}
            Add Account
          </button>
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <ul className="divide-y divide-slate-800">
          {accounts.length === 0 ? (
            <li className="p-8 text-center text-slate-500">No accounts added yet.</li>
          ) : (
            accounts.map((acc) => (
              <li key={acc.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
                    <AtSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-white">{acc.name}</p>
                    <p className="text-xs text-slate-500">ID: {acc.igAccountId}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(acc.id)}
                  className="text-slate-500 hover:text-red-400 p-2 rounded-md hover:bg-red-400/10 transition-colors"
                  title="Remove Account"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

    </div>
  );
}
