import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { contentApi, authApi } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { motion } from 'framer-motion';
import { 
  Settings, 
  FileText, 
  Image as ImageIcon, 
  Users, 
  Phone, 
  Briefcase,
  Star,
  Plus,
  Trash2,
  Snowflake,
  Sun,
  KeyRound,
  RefreshCw
} from 'lucide-react';

// Type definitions
interface DashboardContextType {
  season: 'summer' | 'winter';
  onSeasonToggle: () => void;
  setHeaderControls?: (controls: { hasUnsavedChanges?: boolean; onSave?: () => void }) => void;
}

type PortfolioItem = { id: string; title: string; description: string; imageUrl: string; location: string; duration: string; category?: string; featured?: boolean };
type ServiceItem = { id: string; title: string; description: string; price: string };
type TestimonialItem = { id: string; name: string; role: string; rating: number; comment: string };

// The Dashboard Component
export const Dashboard = () => {
  const context = useOutletContext<DashboardContextType>();
  const { season, onSeasonToggle, setHeaderControls } = context || {};
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  const navigate = useNavigate();
  
  const [uiContent, setUiContent] = useState({
    hero: {
      summer: { title: "", subtitle: "", ctaText: "", activeProjects: 12, responseTime: '< 2 hours', satisfactionRate: '99.8%' },
      winter: { title: "", subtitle: "", ctaText: "", activeProjects: 12, responseTime: '< 2 hours', satisfactionRate: '99.8%' }
    },
    services: {
      summer: [] as ServiceItem[],
      winter: [] as ServiceItem[]
    },
    portfolio: {
      summer: [] as PortfolioItem[],
      winter: [] as PortfolioItem[]
    },
    testimonials: [] as TestimonialItem[],
    contact: { phone: "", email: "", address: "" }
  });

  // Fetch initial content from the backend
  const fetchContent = async () => {
    setIsLoading(true);
    try {
      const items = await contentApi.getAll() as Array<{ key: string; value: string }>;
      const newUiContent = { ...uiContent };

      const contentMap: { [key: string]: any } = {};
      items.forEach(item => {
        try {
          contentMap[item.key] = JSON.parse(item.value);
        } catch {
          contentMap[item.key] = item.value;
        }
      });

      newUiContent.hero.summer = contentMap['hero.summer'] || newUiContent.hero.summer;
      newUiContent.hero.winter = contentMap['hero.winter'] || newUiContent.hero.winter;
      newUiContent.services.summer = contentMap['services.summer'] || newUiContent.services.summer;
      newUiContent.services.winter = contentMap['services.winter'] || newUiContent.services.winter;
      newUiContent.portfolio.summer = contentMap['portfolio.summer'] || newUiContent.portfolio.summer;
      newUiContent.portfolio.winter = contentMap['portfolio.winter'] || newUiContent.portfolio.winter;
      newUiContent.testimonials = contentMap['testimonials'] || newUiContent.testimonials;
      newUiContent.contact = contentMap['contact'] || newUiContent.contact;

      setUiContent(newUiContent);
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate('/admin/login');
      } else {
        setError('Failed to load content from the server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      // First, get the existing content to map keys to IDs
      const existingContent = await contentApi.getAll() as Array<{ id: string; key: string; value: string }>;
      const contentMap = new Map(existingContent.map(i => [i.key, i.id]));

      const contentToSave = [
        { key: 'hero.summer', value: JSON.stringify(uiContent.hero.summer) },
        { key: 'hero.winter', value: JSON.stringify(uiContent.hero.winter) },
        { key: 'services.summer', value: JSON.stringify(uiContent.services.summer) },
        { key: 'services.winter', value: JSON.stringify(uiContent.services.winter) },
        { key: 'portfolio.summer', value: JSON.stringify(uiContent.portfolio.summer) },
        { key: 'portfolio.winter', value: JSON.stringify(uiContent.portfolio.winter) },
        { key: 'testimonials', value: JSON.stringify(uiContent.testimonials) },
        { key: 'contact', value: JSON.stringify(uiContent.contact) },
      ];

      for (const item of contentToSave) {
        const id = contentMap.get(item.key) || item.key; // Fallback to key if ID not found
        await contentApi.createOrUpdate(id, { ...item, type: 'json' });
      }

      setHasUnsavedChanges(false);
      alert('Changes saved successfully!');
    } catch (err: any) { 
      const serverMsg = err?.response?.data?.error || err?.message || 'Unknown error';
      console.error('Save failed:', err);
      alert(`Failed to save changes. ${serverMsg}`);
      setError(`Failed to save changes. ${serverMsg}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  useEffect(() => {
    setHeaderControls?.({ hasUnsavedChanges, onSave: handleSave });
  }, [hasUnsavedChanges, uiContent]);

  // Generic handler to update nested state
  const handleUiChange = (section: string, value: any) => {
    setUiContent(prev => ({ ...prev, [section]: value }));
    setHasUnsavedChanges(true);
  };

  // CRUD Handlers for Portfolio
  const addPortfolioItem = () => {
    const newItem: PortfolioItem = { id: `p-${Date.now()}`, title: 'New Project', description: '', imageUrl: '', location: '', duration: '', category: '', featured: false };
    const updatedPortfolio = { ...uiContent.portfolio, [season]: [...uiContent.portfolio[season], newItem] };
    handleUiChange('portfolio', updatedPortfolio);
  };
  const updatePortfolioItem = (id: string, field: keyof PortfolioItem, value: any) => {
    const updatedItems = uiContent.portfolio[season].map(p => p.id === id ? { ...p, [field]: value } : p);
    const updatedPortfolio = { ...uiContent.portfolio, [season]: updatedItems };
    handleUiChange('portfolio', updatedPortfolio);
  };
  const deletePortfolioItem = (id: string) => {
    const updatedItems = uiContent.portfolio[season].filter(p => p.id !== id);
    const updatedPortfolio = { ...uiContent.portfolio, [season]: updatedItems };
    handleUiChange('portfolio', updatedPortfolio);
  };

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const handlePortfolioImageUpload = async (id: string, file: File | null) => {
    if (!file) return;
    try {
      setUploadingId(id);
      const { url } = await authApi.upload(file);
      const imageUrl = url; // store absolute URL for reliable display across origins
      updatePortfolioItem(id, 'imageUrl', imageUrl);
      setHasUnsavedChanges(true);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to upload image.');
    } finally {
      setUploadingId(null);
    }
  };

  // CRUD Handlers for Services
  const addService = () => {
    const newItem = { id: `s-${Date.now()}`, title: 'New Service', description: 'Service description', price: '$0' };
    const updatedServices = { ...uiContent.services, [season]: [...uiContent.services[season], newItem] };
    handleUiChange('services', updatedServices);
  };
  const updateService = (id: string, field: keyof ServiceItem, value: string) => {
    const updatedItems = uiContent.services[season].map(s => s.id === id ? { ...s, [field]: value } : s);
    const updatedServices = { ...uiContent.services, [season]: updatedItems };
    handleUiChange('services', updatedServices);
  };
  const deleteService = (id: string) => {
    const updatedItems = uiContent.services[season].filter(s => s.id !== id);
    const updatedServices = { ...uiContent.services, [season]: updatedItems };
    handleUiChange('services', updatedServices);
  };

  // CRUD Handlers for Testimonials
  const addTestimonial = () => {
    const newItem = { id: `t-${Date.now()}`, name: 'New Customer', role: 'Customer', rating: 5, comment: '' };
    handleUiChange('testimonials', [...uiContent.testimonials, newItem]);
  };
  const updateTestimonial = (id: string, field: keyof TestimonialItem, value: string | number) => {
    const updatedItems = uiContent.testimonials.map(t => t.id === id ? { ...t, [field]: value } : t);
    handleUiChange('testimonials', updatedItems);
  };
  const deleteTestimonial = (id: string) => {
    const updatedItems = uiContent.testimonials.filter(t => t.id !== id);
    handleUiChange('testimonials', updatedItems);
  };

  // Settings Handlers
  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const currentPassword = (form.elements.namedItem('current-password') as HTMLInputElement).value;
    const newPassword = (form.elements.namedItem('new-password') as HTMLInputElement).value;
    if (!currentPassword || !newPassword) {
      alert('Please fill in both password fields.');
      return;
    }
    try {
      await authApi.changePassword(currentPassword, newPassword);
      alert('Password changed successfully!');
      form.reset();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.error || 'An error occurred.'}`);
    }
  };

  const handleResetContent = async () => {
    if (window.confirm('Are you sure? This will reset all content to its default state.')) {
      try {
        await contentApi.reset();
        alert('Content has been reset. The page will now reload.');
        window.location.reload();
      } catch (error) {
        alert('An error occurred while resetting content.');
      }
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  const SeasonIcon = season === 'summer' ? Sun : Snowflake;

  return (
    <div className="container mx-auto px-6 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList>
          <TabsTrigger value="hero"><FileText className="w-4 h-4 mr-2" />Hero</TabsTrigger>
          <TabsTrigger value="services"><Briefcase className="w-4 h-4 mr-2" />Services</TabsTrigger>
          <TabsTrigger value="portfolio"><ImageIcon className="w-4 h-4 mr-2" />Portfolio</TabsTrigger>
          <TabsTrigger value="testimonials"><Users className="w-4 h-4 mr-2" />Reviews</TabsTrigger>
          <TabsTrigger value="contact"><Phone className="w-4 h-4 mr-2" />Contact</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Settings</TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><SeasonIcon className="w-5 h-5 mr-2" />{season.charAt(0).toUpperCase() + season.slice(1)} Hero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={uiContent.hero[season].title} onChange={e => handleUiChange('hero', { ...uiContent.hero, [season]: { ...uiContent.hero[season], title: e.target.value } })} />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Textarea value={uiContent.hero[season].subtitle} onChange={e => handleUiChange('hero', { ...uiContent.hero, [season]: { ...uiContent.hero[season], subtitle: e.target.value } })} />
              </div>
              <div>
                <Label>CTA Text</Label>
                <Input value={uiContent.hero[season].ctaText} onChange={e => handleUiChange('hero', { ...uiContent.hero, [season]: { ...uiContent.hero[season], ctaText: e.target.value } })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Active Projects</Label>
                  <Input type="number" value={uiContent.hero[season].activeProjects}
                    onChange={e => handleUiChange('hero', { ...uiContent.hero, [season]: { ...uiContent.hero[season], activeProjects: Number(e.target.value) } })} />
                </div>
                <div>
                  <Label>Response Time</Label>
                  <Input value={uiContent.hero[season].responseTime}
                    onChange={e => handleUiChange('hero', { ...uiContent.hero, [season]: { ...uiContent.hero[season], responseTime: e.target.value } })} />
                </div>
                <div>
                  <Label>Satisfaction Rate</Label>
                  <Input value={uiContent.hero[season].satisfactionRate}
                    onChange={e => handleUiChange('hero', { ...uiContent.hero, [season]: { ...uiContent.hero[season], satisfactionRate: e.target.value } })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Section */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <Button size="sm" onClick={addService}><Plus className="w-4 h-4 mr-2" />Add Service</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {uiContent.services[season].map(service => (
                <div key={service.id} className="border p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{service.title}</h4>
                    <Button variant="ghost" size="sm" onClick={() => deleteService(service.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  <Label>Title</Label>
                  <Input value={service.title} onChange={e => updateService(service.id, 'title', e.target.value)} />
                  <Label>Description</Label>
                  <Input value={service.description} onChange={e => updateService(service.id, 'description', e.target.value)} />
                  <Label>Price</Label>
                  <Input value={service.price} onChange={e => updateService(service.id, 'price', e.target.value)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio Section */}
        <TabsContent value="portfolio">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
              <Button size="sm" onClick={addPortfolioItem}><Plus className="w-4 h-4 mr-2" />Add Project</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {uiContent.portfolio[season].map(p => (
                <div key={p.id} className="border p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{p.title || 'Untitled Project'}</h4>
                    <Button variant="ghost" size="sm" onClick={() => deletePortfolioItem(p.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  <Label>Title</Label>
                  <Input value={p.title} onChange={e => updatePortfolioItem(p.id, 'title', e.target.value)} />
                  <Label>Description</Label>
                  <Input value={p.description} onChange={e => updatePortfolioItem(p.id, 'description', e.target.value)} />
                  <Label>Category</Label>
                  <Input value={p.category || ''} onChange={e => updatePortfolioItem(p.id, 'category', e.target.value)} />
                  <Label>Location</Label>
                  <Input value={p.location} onChange={e => updatePortfolioItem(p.id, 'location', e.target.value)} />
                  <Label>Duration</Label>
                  <Input value={p.duration} onChange={e => updatePortfolioItem(p.id, 'duration', e.target.value)} />
                  <Label>Image</Label>
                  <div className="flex items-center gap-3">
                    <Input placeholder="Image URL" value={p.imageUrl} onChange={e => updatePortfolioItem(p.id, 'imageUrl', e.target.value)} />
                    <div>
                      <input
                        id={`file-${p.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handlePortfolioImageUpload(p.id, e.target.files?.[0] || null)}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`file-${p.id}`)?.click()} disabled={uploadingId === p.id}>
                        {uploadingId === p.id ? 'Uploading...' : 'Upload Image'}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch checked={!!p.featured} onCheckedChange={(checked: boolean) => updatePortfolioItem(p.id, 'featured', checked)} />
                    <Label>Featured</Label>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testimonials Section */}
        <TabsContent value="testimonials">
          <Card>
            <CardHeader>
              <CardTitle>Testimonials</CardTitle>
              <Button size="sm" onClick={addTestimonial}><Plus className="w-4 h-4 mr-2" />Add Testimonial</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {uiContent.testimonials.map(t => (
                <div key={t.id} className="border p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{t.name}</h4>
                    <Button variant="ghost" size="sm" onClick={() => deleteTestimonial(t.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  <Label>Name</Label>
                  <Input value={t.name} onChange={e => updateTestimonial(t.id, 'name', e.target.value)} />
                  <Label>Role</Label>
                  <Input value={t.role} onChange={e => updateTestimonial(t.id, 'role', e.target.value)} />
                  <Label>Rating (1-5)</Label>
                  <Input type="number" min={1} max={5} value={t.rating} onChange={e => updateTestimonial(t.id, 'rating', Number(e.target.value))} />
                  <Label>Comment</Label>
                  <Textarea value={t.comment} onChange={e => updateTestimonial(t.id, 'comment', e.target.value)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Section */}
        <TabsContent value="contact">
          <Card>
            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Phone</Label>
                <Input value={uiContent.contact.phone} onChange={e => handleUiChange('contact', { ...uiContent.contact, phone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={uiContent.contact.email} onChange={e => handleUiChange('contact', { ...uiContent.contact, email: e.target.value })} />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea value={uiContent.contact.address} onChange={e => handleUiChange('contact', { ...uiContent.contact, address: e.target.value })} />
              </div>
              <div>
                <Label>Hours</Label>
                <Input value={(uiContent as any).contact.hours || ''} onChange={e => handleUiChange('contact', { ...uiContent.contact, hours: e.target.value })} />
              </div>
              <div>
                <Label>Weekend/Emergency Note</Label>
                <Input value={(uiContent as any).contact.weekendNote || ''} onChange={e => handleUiChange('contact', { ...uiContent.contact, weekendNote: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Section */}
        <TabsContent value="settings">
          <div className="grid gap-6">
            <Card>
              <CardHeader><CardTitle>General</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label>Seasonal Mode</Label>
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4" />
                    <Switch checked={season === 'winter'} onCheckedChange={onSeasonToggle} />
                    <Snowflake className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Security</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                  <Button type="submit"><KeyRound className="w-4 h-4 mr-2" />Change Password</Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Danger Zone</CardTitle></CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleResetContent}><RefreshCw className="w-4 h-4 mr-2" />Reset All Content</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;