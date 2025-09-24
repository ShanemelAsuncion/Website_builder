import React, { useEffect, useState } from 'react';
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
import { contentApi } from './services/api';
import { SeasonalTutorial } from './components/SeasonalTutorial';

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
        {/* Seasonal tutorial: shown once per day on homepage */}
        <SeasonalTutorial season={season} onSeasonToggle={toggleSeason} />
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
  const [branding, setBranding] = useState<{ name?: string; logoUrl?: string }>({});

  const toggleSeason = () => {
    setSeason(season === 'summer' ? 'winter' : 'summer');
  };

  // Browser tab: title + favicon from branding
  useEffect(() => {
    (async () => {
      try {
        const items = (await contentApi.getAll()) as Array<{ key: string; value: string }>;
        const bItem = items.find(i => i.key === 'branding');
        if (bItem?.value) {
          try { setBranding(JSON.parse(bItem.value)); } catch {}
        }
      } catch {}
    })();
    try {
      const cached = localStorage.getItem('cache:branding');
      if (cached) setBranding(JSON.parse(cached));
    } catch {}

    const applyBrandingToTab = (b?: { name?: string; logoUrl?: string }) => {
      if (!b) b = branding;
      if (b?.name) document.title = b.name;
      // Set favicon (fallback to removing if not available)
      let link: HTMLLinkElement | null = document.querySelector("link#dynamic-favicon");
      if (!link) {
        link = document.createElement('link');
        link.id = 'dynamic-favicon';
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      if (b?.logoUrl) {
        link.href = b.logoUrl;
      } else {
        // Remove href to avoid stale icon
        link.href = '';
      }
    };

    applyBrandingToTab();

    const refreshFromCache = () => {
      try {
        const cached = localStorage.getItem('cache:branding');
        if (cached) {
          const parsed = JSON.parse(cached);
          setBranding(parsed);
          applyBrandingToTab(parsed);
        }
      } catch {}
    };
    const onUpdated = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.persisted) refreshFromCache();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cache:branding') refreshFromCache();
    };
    window.addEventListener('content-updated', onUpdated);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('content-updated', onUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Apply branding to tab whenever branding state changes
  useEffect(() => {
    const name = branding?.name;
    if (name) document.title = name;
    let link: HTMLLinkElement | null = document.querySelector('link#dynamic-favicon');
    if (!link) {
      link = document.createElement('link');
      link.id = 'dynamic-favicon';
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (branding?.logoUrl) {
      link.href = branding.logoUrl;
    }
  }, [branding]);

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