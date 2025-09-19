import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sun, Snowflake, Eye, LogOut, Edit3, Save } from 'lucide-react';
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

  const toggleSeason = () => {
    setSeason(prev => prev === 'summer' ? 'winter' : 'summer');
  };

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

  return (
    <AdminContext.Provider value={contextValue}>
      <div className="min-h-screen bg-background">
        {/* Top Navigation */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl tracking-tight">BladeSnow Pro Admin</h1>
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

                {/* Save Changes if provided by child */}
                <Button
                  onClick={() => onSave && onSave()}
                  disabled={!hasUnsavedChanges || !onSave}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
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
