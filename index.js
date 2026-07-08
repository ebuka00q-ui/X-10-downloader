import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createRoot } from 'react-dom/client';

// 1. SUPABASE INITIALIZATION
const SUPABASE_URL = "https://gkfivuvtpfetzatz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_T2Sxps8oB5ilNda3IU1SZQ_1LLxmVSE";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. MAIN APP COMPONENT
const X10App = () => {
  const [currentTab, setCurrentTab] = useState('home');
  const [showExitModal, setShowExitModal] = useState(false);
  const [isCreator] = useState(true);

  // Back Button Protocol
  useEffect(() => {
    let backPressCount = 0;
    const handlePopState = () => {
      backPressCount++;
      if (backPressCount >= 2) {
        setShowExitModal(true);
        backPressCount = 0;
      } else {
        window.history.back();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="w-full h-screen bg-black text-white flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto p-4">
        {currentTab === 'home' && <div>Home/FYP Content</div>}
        {currentTab === 'account' && (
          <div>
            <div className="flex justify-between"><h1>Profile</h1>{isCreator && <button>...</button>}</div>
            <div className="text-2xl font-bold">{isCreator ? "100,000,000+ Followers" : "Followers"}</div>
          </div>
        )}
      </main>

      <nav className="flex justify-around py-4 border-t border-gray-800">
        <button onClick={() => setCurrentTab('home')}>Home</button>
        <button onClick={() => setCurrentTab('live')}>Live</button>
        <button onClick={() => setCurrentTab('downloads')}>Downloads</button>
        <button onClick={() => setCurrentTab('account')}>Account</button>
      </nav>

      {showExitModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80">
          <button onClick={() => window.close()}>Exit</button>
          <button onClick={() => setShowExitModal(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

// 3. THE "PAINTER" - This mounts the app to the screen
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<X10App />);
        
