import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sun, Snowflake, Eye, LogOut, Edit3, Save } from 'lucide-react';
import { contentApi, resolveAssetUrl } from '../../services/api';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';

interface DashboardContextType {
  season: 'summer' | 'winter';
  onSeasonToggle: () => void;
  onLogout: () => void;
  onPreview: () => void;
}

interface AdminLayoutProps {
  children?: React.ReactNode;
}

// Create a context for admin layout
export const AdminContext = React.createContext<{
  season: 'summer' | 'winter';
  onSeasonToggle: () => void;
  onLogout: () => void;
  onPreview: () => void;
  // Header controls
  hasUnsavedChanges?: boolean;
  onSave?: () => void;
  setHeaderControls?: (controls: { hasUnsavedChanges?: boolean; onSave?: () => void }) => void;
} | null>(null);

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [season, setSeason] = useState<'summer' | 'winter'>('summer');
  // Header control state provided by children (e.g., Dashboard)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [onSave, setOnSave] = useState<(() => void) | undefined>(undefined);
  const [branding, setBranding] = useState<{ name?: string; logoUrl?: string }>({});
  const [isLaptop, setIsLaptop] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  const toggleSeason = () => {
    setSeason(prev => prev === 'summer' ? 'winter' : 'summer');
  };

  // Load branding and subscribe to updates
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
    const refreshFromCache = () => {
      try {
        const cached = localStorage.getItem('cache:branding');
        if (cached) setBranding(JSON.parse(cached));
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

  // Enforce laptop/desktop screens for admin dashboard
  useEffect(() => {
    const onResize = () => setIsLaptop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const handlePreview = () => {
    // Open the main site in a new tab for preview
    window.open('/', '_blank');
  };

  const setHeaderControls = (controls: { hasUnsavedChanges?: boolean; onSave?: () => void }) => {
    if (typeof controls.hasUnsavedChanges !== 'undefined') {
      setHasUnsavedChanges(!!controls.hasUnsavedChanges);
    }
    if (typeof controls.onSave !== 'undefined') {
      setOnSave(() => controls.onSave);
    }
  };

  // Context value to be passed to child routes
  const contextValue = {
    season,
    onSeasonToggle: toggleSeason,
    onLogout: handleLogout,
    onPreview: handlePreview,
    hasUnsavedChanges,
    onSave,
    setHeaderControls
  };

  if (!isLaptop) {
    return (
      <AdminContext.Provider value={contextValue}>
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="bg-white text-black rounded-xl p-6 max-w-md w-[90%] text-center shadow-2xl">
            <h2 className="text-xl font-semibold mb-2">Admin available on larger screens</h2>
            <p className="text-sm text-gray-700">
              The admin dashboard is optimized for laptop/desktop screens. Please use a larger device to continue.
            </p>
          </div>
        </div>
      </AdminContext.Provider>
    );
  }

  return (
    <AdminContext.Provider value={contextValue}>
      <div className="min-h-screen bg-background">
        {/* Top Navigation */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
                    {branding.logoUrl ? (
                      <img src={resolveAssetUrl(branding.logoUrl)} alt={branding.name || 'Logo'} className="w-8 h-8 object-contain bg-white" />
                    ) : (
                      <Edit3 className="w-5 h-5 text-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-xl tracking-tight">{branding.name || 'Admin'} Admin</h1>
                    <p className="text-sm text-muted-foreground">Content Management System</p>
                  </div>
                </div>
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="animate-pulse">Unsaved Changes</Badge>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Season Toggle */}
                <div className="flex items-center space-x-3 text-sm">
                  <Sun className={`h-4 w-4 transition-colors duration-300 ${season === 'summer' ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <Switch 
                    checked={season === 'winter'} 
                    onCheckedChange={toggleSeason}
                    className="data-[state=checked]:bg-blue-500"
                  />
                  <Snowflake className={`h-4 w-4 transition-colors duration-300 ${season === 'winter' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                </div>

                {/* Preview always visible */}
                <Button variant="outline" onClick={handlePreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Site
                </Button>

                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, contextValue);
            }
            return child;
          })}
          <Outlet context={contextValue} />
        </div>
      </div>
    </AdminContext.Provider>
  );
};

export default AdminLayout;
