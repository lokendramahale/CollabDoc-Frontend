import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedDocId, setSelectedDocId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleAuthSuccess = (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActivePage('dashboard');
    setSelectedDocId(null);
  };

  const handleOpenDocument = (docId) => {
    setSelectedDocId(docId);
    setActivePage('editor');
  };

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {activePage === 'dashboard' && (
        <Dashboard 
          currentUser={currentUser} 
          onLogout={handleLogout}
          onOpenDocument={handleOpenDocument}
        />
      )}
      {activePage === 'editor' && selectedDocId && (
        <EditorPage 
          currentUser={currentUser}
          docId={selectedDocId}
          onLogout={handleLogout}
          onBack={() => setActivePage('dashboard')}
        />
      )}
    </div>
  );
}