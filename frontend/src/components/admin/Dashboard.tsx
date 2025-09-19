import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { contentApi } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { motion } from 'framer-motion';
import { 
  LogOut, 
  Save, 
  Eye, 
  Settings, 
  FileText, 
  Image as ImageIcon, 
  Users, 
  Phone, 
  Briefcase,
  Star,
  Plus,
  Trash2,
  Edit3,
  Snowflake,
  Sun
} from 'lucide-react';

interface ContentItem {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'image' | 'html';
  createdAt: string;
  updatedAt: string;
}

interface DashboardContextType {
  season: 'summer' | 'winter';
  onSeasonToggle: () => void;
  onLogout: () => void;
  onPreview: () => void;
}

export const Dashboard = () => {
  // Get context from AdminLayout
  const context = useOutletContext<DashboardContextType>();
  const { 
    season = 'summer', 
    onSeasonToggle = () => console.log('Season toggle clicked'), 
    onLogout = () => console.log('Logout clicked'), 
    onPreview = () => console.log('Preview clicked') 
  } = context || {};
  
  console.log('Dashboard context:', { season, onSeasonToggle, onLogout, onPreview });
  
  // Show loading state if context is not available yet
  if (!context) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  const navigate = useNavigate();
  
  // Sample content state - will be replaced with API data
  const [uiContent, setUiContent] = useState<{
    hero: {
      summer: { title: string; subtitle: string; ctaText: string };
      winter: { title: string; subtitle: string; ctaText: string };
    };
    services: {
      summer: Array<{ id: string; title: string; description: string; price: string }>;
      winter: Array<{ id: string; title: string; description: string; price: string }>;
    };
    contact: {
      phone: string;
      email: string;
      address: string;
    };
  }>({
    hero: {
      summer: {
        title: "Transform Your Landscape",
        subtitle: "Professional lawn care and landscape design that brings your outdoor vision to life",
        ctaText: "Get Free Quote"
      },
      winter: {
        title: "Snow Removal Experts",
        subtitle: "24/7 professional snow and ice management to keep your property safe and accessible",
        ctaText: "Get Winter Service"
      }
    },
    services: {
      summer: [
        { id: '1', title: "Lawn Care", description: "Regular mowing, edging, and maintenance", price: "Starting at $50/visit" },
        { id: '2', title: "Landscape Design", description: "Custom outdoor space planning", price: "Starting at $500" },
        { id: '3', title: "Garden Maintenance", description: "Pruning, weeding, and care", price: "Starting at $75/visit" }
      ],
      winter: [
        { id: '4', title: "Snow Plowing", description: "Driveway and parking lot clearing", price: "Starting at $75/visit" },
        { id: '5', title: "Ice Management", description: "Salt and sand application", price: "Starting at $45/visit" },
        { id: '6', title: "Emergency Service", description: "24/7 storm response", price: "Starting at $125/visit" }
      ]
    },
    contact: {
      phone: "(555) 123-4567",
      email: "info@bladesnowpro.com",
      address: "123 Service Drive, Your City, ST 12345"
    }
  });

  useEffect(() => {
    console.log('useEffect running, fetching content...');
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    fetchContent();
  }, [navigate]);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('Attempting to fetch content from backend...');
      
      // Check if we have a token
      const token = localStorage.getItem('token');
      console.log('Current token in localStorage:', token ? '*** (exists)' : 'NOT FOUND');
      
      // First try to get content from the backend
      try {
        console.log('Calling contentApi.getAll()...');
        const response = await contentApi.getAll();
        console.log('API Response received:', {
          isArray: Array.isArray(response),
          length: Array.isArray(response) ? response.length : 'N/A',
          firstItem: Array.isArray(response) && response.length > 0 ? response[0] : 'N/A'
        });
        
        if (Array.isArray(response)) {
          console.log('Received valid content array, updating state...');
          setContent(response as ContentItem[]);
          setError('');
          return;
        } else {
          console.warn('API response is not an array:', response);
          throw new Error('Invalid response format from server');
        }
      } catch (apiError: any) {
        const errorDetails = {
          message: apiError.message,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          config: {
            url: apiError.config?.url,
            method: apiError.config?.method,
            headers: {
              ...apiError.config?.headers,
              // Don't log the full auth header for security
              Authorization: apiError.config?.headers?.Authorization 
                ? '*** (exists)' 
                : 'MISSING'
            }
          }
        };
        
        console.error('API Error details:', errorDetails);
        
        // If unauthorized, redirect to login
        if (apiError.response?.status === 401) {
          console.log('Unauthorized - redirecting to login');
          navigate('/admin/login');
          return;
        }
        
        console.log('Falling back to sample data');
        
        // Use the sample data from uiContent
        const sampleContent: ContentItem[] = [
          {
            id: '1',
            key: 'hero.title',
            value: uiContent.hero[season].title,
            type: 'text',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            key: 'hero.subtitle',
            value: uiContent.hero[season].subtitle,
            type: 'text',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            key: 'contact.phone',
            value: uiContent.contact.phone,
            type: 'text',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '4',
            key: 'contact.email',
            value: uiContent.contact.email,
            type: 'text',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '5',
            key: 'contact.address',
            value: uiContent.contact.address,
            type: 'text',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        // Add service items to sample content
        uiContent.services[season].forEach((service, index) => {
          sampleContent.push({
            id: `service-${season}-${index + 1}`,
            key: `services.${season}.${index}.title`,
            value: service.title,
            type: 'text',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          sampleContent.push({
            id: `service-${season}-${index + 1}-desc`,
            key: `services.${season}.${index}.description`,
            value: service.description,
            type: 'text',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          sampleContent.push({
            id: `service-${season}-${index + 1}-price`,
            key: `services.${season}.${index}.price`,
            value: service.price,
            type: 'text',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        });
        
        setContent(sampleContent);
        setError('Using sample data - could not connect to backend');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content';
      setError(errorMessage);
      setContent([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // TODO: Implement save functionality with the API
      // This is a placeholder for the actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasUnsavedChanges(false);
      // Show success message or notification
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save content';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
    navigate('/admin/login');
  };

  const SeasonIcon = season === 'summer' ? Sun : Snowflake;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <Button 
            onClick={fetchContent}
            className="mt-2"
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
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
                <Badge variant="secondary" className="animate-pulse">
                  Unsaved Changes
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Season Toggle */}
              <div className="flex items-center space-x-3 text-sm">
                <Sun className={`h-4 w-4 transition-colors duration-300 ${season === 'summer' ? 'text-green-500' : 'text-muted-foreground'}`} />
                <Switch 
                  checked={season === 'winter'} 
                  onCheckedChange={onSeasonToggle}
                  className="data-[state=checked]:bg-blue-500"
                />
                <Snowflake className={`h-4 w-4 transition-colors duration-300 ${season === 'winter' ? 'text-blue-500' : 'text-muted-foreground'}`} />
              </div>

              <Button variant="outline" onClick={onPreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview Site
              </Button>

              <Button 
                onClick={handleSave} 
                disabled={!hasUnsavedChanges || isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row gap-6">
          <TabsList className="flex flex-col h-auto p-2 bg-muted/50 rounded-lg w-full md:w-48 space-y-2">
            <TabsTrigger value="hero" className="flex items-center space-x-2 justify-start w-full">
              <FileText className="w-4 h-4" />
              <span>Hero</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center space-x-2 justify-start w-full">
              <Briefcase className="w-4 h-4" />
              <span>Services</span>
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center space-x-2 justify-start w-full">
              <ImageIcon className="w-4 h-4" />
              <span>Portfolio</span>
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="flex items-center space-x-2 justify-start w-full">
              <Users className="w-4 h-4" />
              <span>Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center space-x-2 justify-start w-full">
              <Phone className="w-4 h-4" />
              <span>Contact</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2 justify-start w-full">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Hero Section Editor */}
          <TabsContent value="hero" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SeasonIcon className="w-5 h-5" />
                    <span>{season === 'summer' ? 'Summer' : 'Winter'} Hero Section</span>
                  </CardTitle>
                  <CardDescription>
                    Edit the main hero content for {season} season
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="hero-title">Main Title</Label>
                      <Input
                        id="hero-title"
                        value={uiContent.hero[season].title}
                        onChange={(e) => {
                          setUiContent(prev => ({
                            ...prev,
                            hero: {
                              ...prev.hero,
                              [season]: {
                                ...prev.hero[season],
                                title: e.target.value
                              }
                            }
                          }));
                          setHasUnsavedChanges(true);
                        }}
                        className="text-lg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="hero-subtitle">Subtitle</Label>
                      <Textarea
                        id="hero-subtitle"
                        value={uiContent.hero[season].subtitle}
                        onChange={(e) => {
                          setUiContent(prev => ({
                            ...prev,
                            hero: {
                              ...prev.hero,
                              [season]: {
                                ...prev.hero[season],
                                subtitle: e.target.value
                              }
                            }
                          }));
                          setHasUnsavedChanges(true);
                        }}
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="hero-cta">Call to Action Button Text</Label>
                      <Input
                        id="hero-cta"
                        value={uiContent.hero[season].ctaText}
                        onChange={(e) => {
                          setUiContent(prev => ({
                            ...prev,
                            hero: {
                              ...prev.hero,
                              [season]: {
                                ...prev.hero[season],
                                ctaText: e.target.value
                              }
                            }
                          }));
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Services Section Editor */}
          <TabsContent value="services" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <SeasonIcon className="w-5 h-5" />
                        <span>{season === 'summer' ? 'Summer' : 'Winter'} Services</span>
                      </CardTitle>
                      <CardDescription>
                        Manage your service offerings for {season} season
                      </CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Service
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {uiContent.services[season].map((service) => (
                    <div key={service.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{service.title}</h4>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Service Title</Label>
                          <Input 
                            value={service.title} 
                            onChange={(e) => {
                              // Update service title logic
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input 
                            value={service.description} 
                            onChange={(e) => {
                              // Update service description logic
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Price</Label>
                          <Input 
                            value={service.price} 
                            onChange={(e) => {
                              // Update service price logic
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Portfolio Section Editor */}
          <TabsContent value="portfolio" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Portfolio Projects</CardTitle>
                      <CardDescription>
                        Manage your work showcase and project gallery
                      </CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Project
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4" />
                    <p>Portfolio management interface coming soon...</p>
                    <p className="text-sm">Upload images, add descriptions, and organize your work</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Testimonials Section Editor */}
          <TabsContent value="testimonials" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Customer Reviews</CardTitle>
                      <CardDescription>
                        Manage testimonials and customer feedback
                      </CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Review
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-4" />
                    <p>Testimonials management interface coming soon...</p>
                    <p className="text-sm">Add customer reviews, ratings, and feedback</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Contact Section Editor */}
          <TabsContent value="contact" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Update your business contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Phone Number</Label>
                      <Input
                        id="contact-phone"
                        value={uiContent.contact.phone}
                        onChange={(e) => {
                          setUiContent(prev => ({
                            ...prev,
                            contact: {
                              ...prev.contact,
                              phone: e.target.value
                            }
                          }));
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email Address</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={uiContent.contact.email}
                        onChange={(e) => {
                          setUiContent(prev => ({
                            ...prev,
                            contact: {
                              ...prev.contact,
                              email: e.target.value
                            }
                          }));
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact-address">Business Address</Label>
                    <Textarea
                      id="contact-address"
                      value={uiContent.contact.address}
                      onChange={(e) => {
                        setUiContent(prev => ({
                          ...prev,
                          contact: {
                            ...prev.contact,
                            address: e.target.value
                          }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                      Configure your website preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Seasonal Mode</p>
                        <p className="text-sm text-muted-foreground">Toggle between summer and winter themes</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Sun className="h-4 w-4 text-green-500" />
                        <Switch checked={season === 'winter'} onCheckedChange={onSeasonToggle} />
                        <Snowflake className="h-4 w-4 text-blue-500" />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-save</p>
                        <p className="text-sm text-muted-foreground">Automatically save changes as you type</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>
                      Manage your admin account settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full">
                      Change Password
                    </Button>
                    <Button variant="destructive" className="w-full">
                      Reset All Content
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
