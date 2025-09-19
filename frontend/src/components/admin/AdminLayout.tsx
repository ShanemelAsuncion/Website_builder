import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Sun, Snowflake, Eye, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';

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
} | null>(null);

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [season, setSeason] = useState<'summer' | 'winter'>('summer');

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

  // Context value to be passed to child routes
  const contextValue = {
    season,
    onSeasonToggle: toggleSeason,
    onLogout: handleLogout,
    onPreview: handlePreview
  };

  return (
    <AdminContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Link to="/admin/dashboard" className="text-xl font-bold text-gray-800">
                    Admin Panel
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                  <Link
                    to="/admin/dashboard"
                    className="border-blue-500 text-gray-900 inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm">
                  <Sun className={`h-4 w-4 ${season === 'summer' ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <Switch 
                    checked={season === 'winter'} 
                    onCheckedChange={toggleSeason}
                    className="data-[state=checked]:bg-blue-500"
                  />
                  <Snowflake className={`h-4 w-4 ${season === 'winter' ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePreview}
                  className="flex items-center space-x-1"
                >
                  <Eye className="h-4 w-4" />
                  <span>Preview</span>
                </Button>
                
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleLogout}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, contextValue);
              }
              return child;
            })}
            <Outlet context={contextValue} />
          </div>
        </main>
      </div>
    </AdminContext.Provider>
  );
};

export default AdminLayout;
