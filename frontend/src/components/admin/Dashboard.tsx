import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { contentApi, authApi, adminApi, resolveAssetUrl } from '../../services/api';
import { settingsService } from '../../services/settings';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
type ServiceItem = { id: string; title: string; description: string; price: string; image?: string; features?: string[] };
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
  const [profile, setProfile] = useState<{ id: number; email: string; isMaster: number } | null>(null);
  const [emailChange, setEmailChange] = useState('');
  const [users, setUsers] = useState<Array<{ id: number; email: string; isMaster: number; createdAt: string }>>([]);
  const [newUser, setNewUser] = useState<{ email: string; password: string; isMaster: boolean }>({ email: '', password: '', isMaster: false });
  const [runtimeSettings, setRuntimeSettings] = useState<{ siteName: string; userEmail: string }>({ siteName: '', userEmail: '' });
  
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
    contact: { phone: "", email: "", address: "", hours: "", weekendNote: "", facebook: "", facebookName: "", facebookUrl: "" },
    branding: { name: "", logoUrl: "" }
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
      newUiContent.branding = contentMap['branding'] || newUiContent.branding;

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
    (async () => {
      try {
        const res = await authApi.getFullProfile();
        setProfile(res.user);
        if (res.user.isMaster) {
          try {
            const list = await adminApi.listUsers();
            setUsers(list);
          } catch {}
          // Load runtime settings for master users
          try {
            const items = await settingsService.getAll();
            const map = new Map(items.map(i => [i.key, i.value]));
            const siteNameRaw = map.get('SITE_NAME');
            const userEmailRaw = map.get('USER_EMAIL');
            const siteName = (() => { try { return JSON.parse(siteNameRaw || ''); } catch { return siteNameRaw || ''; } })();
            const userEmail = (() => { try { return JSON.parse(userEmailRaw || ''); } catch { return userEmailRaw || ''; } })();
            setRuntimeSettings({ siteName: siteName || '', userEmail: userEmail || '' });
          } catch {}
        }
      } catch {}
    })();
  }, [navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      // Validation: branding name required
      if (!uiContent.branding?.name || !uiContent.branding.name.trim()) {
        alert('Branding name is required. Please provide your company name.');
        setIsSaving(false);
        return;
      }
      // First, get the existing content to map keys to IDs
      const existingContent = await contentApi.getAll() as Array<{ id: string; key: string; value: string }>;
      const contentMap = new Map(existingContent.map(i => [i.key, i.id]));

      // Normalize branding.logoUrl to relative /uploads path if a full URL was provided
      const brandingNormalized = { ...uiContent.branding } as any;
      try {
        const raw = brandingNormalized?.logoUrl || '';
        if (raw) {
          try {
            const u = new URL(raw, window.location.origin);
            if (u.pathname && u.pathname.startsWith('/uploads/')) {
              brandingNormalized.logoUrl = u.pathname;
            }
          } catch {
            // not a URL; leave as-is
          }
        }
      } catch {}

      const contentToSave = [
        { key: 'hero.summer', value: JSON.stringify(uiContent.hero.summer) },
        { key: 'hero.winter', value: JSON.stringify(uiContent.hero.winter) },
        { key: 'services.summer', value: JSON.stringify(uiContent.services.summer) },
        { key: 'services.winter', value: JSON.stringify(uiContent.services.winter) },
        { key: 'portfolio.summer', value: JSON.stringify(uiContent.portfolio.summer) },
        { key: 'portfolio.winter', value: JSON.stringify(uiContent.portfolio.winter) },
        { key: 'testimonials', value: JSON.stringify(uiContent.testimonials) },
        { key: 'contact', value: JSON.stringify(uiContent.contact) },
        { key: 'branding', value: JSON.stringify(brandingNormalized) },
      ];

      for (const item of contentToSave) {
        const id = contentMap.get(item.key) || item.key; // Fallback to key if ID not found
        await contentApi.createOrUpdate(id, { ...item, type: 'json' });
      }

      // Cache updated content for live updates across the app
      try {
        localStorage.setItem('cache:hero.summer', JSON.stringify(uiContent.hero.summer));
        localStorage.setItem('cache:hero.winter', JSON.stringify(uiContent.hero.winter));
        localStorage.setItem('cache:services.summer', JSON.stringify(uiContent.services.summer));
        localStorage.setItem('cache:services.winter', JSON.stringify(uiContent.services.winter));
        localStorage.setItem('cache:portfolio.summer', JSON.stringify(uiContent.portfolio.summer));
        localStorage.setItem('cache:portfolio.winter', JSON.stringify(uiContent.portfolio.winter));
        localStorage.setItem('cache:testimonials', JSON.stringify(uiContent.testimonials));
        localStorage.setItem('cache:contact', JSON.stringify(uiContent.contact));
        localStorage.setItem('cache:branding', JSON.stringify(brandingNormalized || {}));
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { persisted: true } }));
      } catch {}

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

  // Ensure only one featured portfolio project at a time across BOTH seasons (auto-switch)
  const toggleFeatured = (id: string, checked: boolean) => {
    const otherSeason: 'summer' | 'winter' = season === 'summer' ? 'winter' : 'summer';
    const updatedCurrent = uiContent.portfolio[season].map(p => ({ ...p, featured: p.id === id ? checked : false }));
    const updatedOther = uiContent.portfolio[otherSeason].map(p => ({ ...p, featured: false }));
    const nextPortfolio = { ...uiContent.portfolio, [season]: updatedCurrent, [otherSeason]: updatedOther };
    handleUiChange('portfolio', nextPortfolio);
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
    const newItem = { id: `s-${Date.now()}`, title: 'New Service', description: 'Service description', price: '$0', image: '' };
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

  const [uploadingServiceId, setUploadingServiceId] = useState<string | null>(null);
  const handleServiceImageUpload = async (id: string, file: File | null) => {
    if (!file) return;
    try {
      setUploadingServiceId(id);
      const { url } = await authApi.upload(file);
      updateService(id, 'image', url as any);
      setHasUnsavedChanges(true);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to upload image.');
    } finally {
      setUploadingServiceId(null);
    }
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
    if (!window.confirm('Delete this testimonial? This action cannot be undone.')) return;
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
    <div className="container mx-auto px-6 py-8 p-8" data-season={season}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="w-full overflow-x-auto no-scrollbar text-sm xl:text-base">
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
                <Label>Button Text</Label>
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
            </CardHeader>
            <CardContent className="space-y-4">
              {uiContent.services[season].map(service => (
                <div key={service.id} className="border p-8 rounded-lg space-y-2">
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
                  <Label>Image</Label>
                  <div
                    className="flex flex-col gap-3 border rounded-md p-3 bg-muted/30"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleServiceImageUpload(service.id, file);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Input placeholder="Image URL" value={service.image || ''} onChange={e => updateService(service.id, 'image', e.target.value)} />
                      <div>
                        <input
                          id={`svc-file-${service.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleServiceImageUpload(service.id, e.target.files?.[0] || null)}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`svc-file-${service.id}`)?.click()} disabled={uploadingServiceId === service.id}>
                          {uploadingServiceId === service.id ? 'Uploading...' : 'Upload Image'}
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Drag & drop an image here to upload</div>
                    {service.image && (
                      <img src={service.image} alt={service.title} className="h-20 w-auto rounded border" />
                    )}
                  </div>
                  {/* Features (optional) */}
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Features (optional)</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const next = [...(service.features || []), ''];
                          updateService(service.id, 'features', next as any);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Feature
                      </Button>
                    </div>
                    {(service.features || []).length === 0 && (
                      <p className="text-sm text-muted-foreground">No features added.</p>
                    )}
                    <div className="space-y-2">
                      {(service.features || []).map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            value={feat}
                            placeholder={`Feature #${idx + 1}`}
                            onChange={(e) => {
                              const next = [...(service.features || [])];
                              next[idx] = e.target.value;
                              updateService(service.id, 'features', next as any);
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const next = [...(service.features || [])];
                              next.splice(idx, 1);
                              updateService(service.id, 'features', next as any);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4">
                <Button size="sm" onClick={addService}><Plus className="w-4 h-4 mr-2" />Add Service</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio Section */}
        <TabsContent value="portfolio" className="p-4 sm:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {uiContent.portfolio[season].map(p => (
                <div key={p.id} className="border p-4 rounded-lg space-y-2 p-8">
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
                  <div
                    className="flex flex-col gap-3 border rounded-md p-3 bg-muted/30"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handlePortfolioImageUpload(p.id, file);
                    }}
                  >
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
                    <div className="text-xs text-muted-foreground">Drag & drop an image here to upload</div>
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt={p.title} className="h-20 w-auto rounded border" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch checked={!!p.featured} onCheckedChange={(checked: boolean) => toggleFeatured(p.id, checked)} />
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
            </CardHeader>
            <CardContent className="space-y-4">
              {uiContent.testimonials.map(t => (
                <div key={t.id} className="border p-8 rounded-lg space-y-2">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Facebook Name</Label>
                  <Input placeholder="Jay's Blade and Snow Services" value={(uiContent as any).contact.facebookName || ''}
                    onChange={e => handleUiChange('contact', { ...uiContent.contact, facebookName: e.target.value })} />
                </div>
                <div>
                  <Label>Facebook Link</Label>
                  <Input placeholder="https://www.facebook.com/jcatapiajrj" value={(uiContent as any).contact.facebookUrl || ''}
                    onChange={e => handleUiChange('contact', { ...uiContent.contact, facebookUrl: e.target.value })} />
                </div>
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
              <CardHeader><CardTitle>Branding</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Company Name</Label>
                  <Input value={(uiContent as any).branding?.name || ''} onChange={e => handleUiChange('branding', { ...uiContent.branding, name: e.target.value })} />
                </div>
                <div>
                  <Label>Logo</Label>
                  <div className="flex items-center gap-3">
                    <Input placeholder="Logo URL" value={(uiContent as any).branding?.logoUrl || ''} onChange={e => handleUiChange('branding', { ...uiContent.branding, logoUrl: e.target.value })} />
                    <div>
                      <input
                        id={`branding-logo-file`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const { url, path } = await authApi.upload(file);
                            // Store relative path for portability; preview can still render due to backend URL usage elsewhere
                            handleUiChange('branding', { ...uiContent.branding, logoUrl: path || url });
                            setHasUnsavedChanges(true);
                          } catch (err: any) {
                            alert(err?.response?.data?.error || 'Failed to upload logo.');
                          }
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('branding-logo-file')?.click()}>
                        Upload Logo
                      </Button>
                    </div>
                  </div>
                  {(uiContent as any).branding?.logoUrl && (
                    <div className="pt-3">
                      <img src={resolveAssetUrl((uiContent as any).branding.logoUrl)} alt="Logo preview" className="h-12 w-auto rounded border bg-white" />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Change Email (verification required)</Label>
                  <div className="flex gap-2">
                    <Input type="email" placeholder="new-email@example.com" value={emailChange} onChange={(e) => setEmailChange(e.target.value)} />
                    <Button
                      type="button"
                      onClick={async () => {
                        if (!emailChange) { alert('Please enter a new email'); return; }
                        try {
                          const res = await authApi.requestEmailChange(emailChange);
                          alert(res.message + " (Verification link logged by backend in dev)");
                        } catch (e: any) {
                          alert(e?.response?.data?.error || 'Failed to request email change');
                        }
                      }}
                    >
                      Request Change
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Master Admin Management */}
            {profile?.isMaster ? (
              <Card>
                <CardHeader><CardTitle>User Management (Master Admin)</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Create New User</Label>
                    <div className="grid md:grid-cols-3 gap-2">
                      <Input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                      <Input placeholder="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                      <div className="flex items-center gap-2">
                        <Switch checked={newUser.isMaster} onCheckedChange={(v: boolean) => setNewUser({ ...newUser, isMaster: v })} />
                        <span>Master</span>
                        <Button type="button" onClick={async () => {
                          try {
                            if (!newUser.email || !newUser.password) { alert('Email and password required'); return; }
                            await adminApi.createUser(newUser);
                            const list = await adminApi.listUsers();
                            setUsers(list);
                            setNewUser({ email: '', password: '', isMaster: false });
                          } catch (e: any) { alert(e?.response?.data?.error || 'Failed to create user'); }
                        }}>Add</Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Existing Users</Label>
                    <div className="space-y-2">
                      {users.map(u => (
                        <div key={u.id} className="flex items-center justify-between border rounded p-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm">{u.email}</span>
                            {u.isMaster ? <Badge>Master</Badge> : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const email = prompt('New email (leave blank to keep)?', u.email) || undefined;
                                const password = prompt('New password (leave blank to keep)?') || undefined;
                                const isMaster = window.confirm('Should this user be master? OK = Yes, Cancel = No');
                                try {
                                  await adminApi.updateUser(u.id, { email, password, isMaster });
                                  const list = await adminApi.listUsers();
                                  setUsers(list);
                                } catch (e: any) { alert(e?.response?.data?.error || 'Failed to update user'); }
                              }}
                            >Edit</Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                if (!window.confirm('Delete this user?')) return;
                                try { await adminApi.deleteUser(u.id); setUsers(await adminApi.listUsers()); } catch (e: any) { alert(e?.response?.data?.error || 'Failed to delete user'); }
                              }}
                            >Delete</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
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
      {hasUnsavedChanges && (
        <Button
          className="floating-save-btn"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </Button>
      )}
    </div>
  );
};

export default Dashboard;