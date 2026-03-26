import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { Accounts } from './views/Accounts';
import { Hooks } from './views/Hooks';

function App() {
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState('');

  const fetchAccounts = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/accounts');
      if (!res.ok) return;
      const data = await res.json();
      setAccounts(data);
      if (data.length > 0 && !activeAccount) {
        setActiveAccount(data[0].igAccountId);
      } else if (data.length === 0) {
        setActiveAccount('');
      }
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <Router>
      <Routes>
        <Route element={
          <Layout 
            activeAccount={activeAccount} 
            onAccountChange={setActiveAccount} 
            accounts={accounts} 
          />
        }>
          <Route path="/" element={<Dashboard activeAccount={activeAccount} />} />
          <Route path="/accounts" element={<Accounts accounts={accounts} fetchAccounts={fetchAccounts} />} />
          <Route path="/hooks" element={<Hooks />} />
          <Route path="/settings" element={<div className="p-8 text-white">Settings coming soon...</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
