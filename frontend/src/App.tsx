import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { Process } from './components/Process';
import { Testimonials } from './components/Testimonials';
import { Work } from "./components/Work";
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { Login } from './components/admin/Login';
import { Dashboard } from './components/admin/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';

function MainContent({ season, toggleSeason }: { season: 'summer' | 'winter'; toggleSeason: () => void }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={season}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen"
      >
        <Header season={season} onSeasonToggle={toggleSeason} />
        <Hero season={season} />
        <Services season={season} />
        <Work season={season} />
        <Process season={season} />
        <Testimonials season={season} />
        <Contact season={season} />
        <Footer season={season} />
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const [season, setSeason] = useState<'summer' | 'winter'>('summer');

  const toggleSeason = () => {
    setSeason(season === 'summer' ? 'winter' : 'summer');
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainContent season={season} toggleSeason={toggleSeason} />} />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/login" 
          element={
            <Login 
              season={season} 
              onSeasonToggle={toggleSeason} 
            />
          } 
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
        
        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}