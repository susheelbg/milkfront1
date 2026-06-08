import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer, BottomNavigation } from './components';
import { routes } from './routes/index.jsx';
import { authApi } from './services/api/authApi';

function AppContent() {
  const location = useLocation();

  // Pages where we show the bottom footer navigation for user experience
  const userPages = [
    '/home',
    '/sante',
    '/feeds',
    '/orders',
    '/profile',
    '/nandini-ai',
    '/order-summary'
  ];

  // Render bottom navigation footer only for authenticated users on user-facing pages
  const showFooter = authApi.isAuthenticated() && userPages.some(page => 
    location.pathname === page || location.pathname.startsWith(page + '/')
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Content wrapper with bottom padding if footer is visible to prevent overlap */}
      <main className={`flex-1 ${showFooter ? 'pb-20 md:pb-24' : ''} transition-all duration-300`}>
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Routes>
      </main>
      
      {showFooter && <BottomNavigation />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <ToastContainer />
      <AppContent />
    </Router>
  );
}

export default App;
