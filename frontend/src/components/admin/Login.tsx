import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { authApi, contentApi } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { motion } from 'framer-motion';
import { Shield, Snowflake, Sun, ArrowLeft, Lock, User, X } from 'lucide-react';

interface LoginProps {
  season?: 'summer' | 'winter';
  onSeasonToggle?: () => void;
}

export const Login = ({ season = 'summer', onSeasonToggle = () => {} }: LoginProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });
  const [branding, setBranding] = useState<{ name?: string; logoUrl?: string }>({});
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin/dashboard';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate(from, { replace: true });
  }, [navigate, from]);

  useEffect(() => {
    (async () => {
      try {
        const items = (await contentApi.getAll()) as Array<{ key: string; value: string }>;
        const bItem = items.find(i => i.key === 'branding');
        if (bItem?.value) setBranding(JSON.parse(bItem.value));
      } catch {}
    })();

    try {
      const cachedBranding = localStorage.getItem('cache:branding');
      if (cachedBranding) setBranding(JSON.parse(cachedBranding));
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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus({ type: 'idle' });
    try {
      const resp = await authApi.forgotPassword(forgotEmail);
      setForgotStatus({ type: 'success', message: resp?.message || 'If an account exists, a reset link was sent.' });
    } catch (err) {
      const msg = (err as any)?.response?.data?.error || 'Failed to send reset email. Please try again later.';
      setForgotStatus({ type: 'error', message: msg });
    }
  };

  interface LoginResponse {
    token: string;
    user: { id: number; email: string };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await authApi.login(credentials.email, credentials.password) as LoginResponse;
      if (!result?.token) throw new Error('No token received from server');
      localStorage.setItem('token', result.token);
      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
    } finally { setIsLoading(false); }
  };

  const backgroundGradient = season === 'summer' 
    ? 'from-green-50 via-emerald-50 to-teal-50'
    : 'from-blue-50 via-slate-50 to-indigo-50';

  const accentColor = season === 'summer' ? 'text-green-600' : 'text-blue-600';
  const SeasonIcon = season === 'summer' ? Sun : Snowflake;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${backgroundGradient} flex items-center justify-center p-6 relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: season === 'summer' 
            ? `radial-gradient(circle at 1px 1px, rgb(34 197 94) 1px, transparent 0)`
            : `radial-gradient(circle at 1px 1px, rgb(59 130 246) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>
      </div>
      {/* Season Toggle */}
      <motion.div className="absolute top-6 right-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="outline" size="sm" onClick={onSeasonToggle}>
          <SeasonIcon className="w-4 h-4 mr-2" /> {season === 'summer' ? 'Summer' : 'Winter'}
        </Button>
      </motion.div>

      {/* Back to Site */}
      <motion.div className="absolute top-6 left-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Site
        </Button>
      </motion.div>

      {/* Login Card */}
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5 }}>
        <Card className="border-0 shadow-2xl bg-background/95 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <motion.div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center overflow-hidden">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.name || 'Company Logo'} className="w-16 h-16 object-contain bg-white rounded-2xl" />
              ) : <Shield className="w-8 h-8 text-primary-foreground" />}
            </motion.div>
            <Badge variant="outline">{branding.name || 'Admin'} Admin</Badge>
            <CardTitle className="text-2xl tracking-tight">Admin Portal</CardTitle>
            <CardDescription>{season === 'summer' ? 'Manage your landscaping business operations' : 'Oversee winter service management system'}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2"><User className="w-4 h-4"/> Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" value={credentials.email} onChange={e => setCredentials(prev => ({ ...prev, email: e.target.value }))} required />
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="password" className="flex items-center gap-2"><Lock className="w-4 h-4"/> Password</Label>
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={credentials.password} onChange={e => setCredentials(prev => ({ ...prev, password: e.target.value }))} required />
              </div>

              {error && <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg p-3">{error}</div>}

              <Button type="submit" className="w-full">{isLoading ? 'Loading...' : 'Sign In to Admin'}</Button>

              <div className="text-center">
                <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={() => setForgotOpen(true)}>Forgot Password?</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <>
          {/* Animated Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(5px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[99990] bg-black/30"
            onClick={() => setForgotOpen(false)}
          />

          {/* Centered Modal with scale + blur entrance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, scale: 1, backdropFilter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed inset-0 z-[99991] flex items-center justify-center p-4"
          >
            <Card className="bg-background border shadow-2xl w-full max-w-md relative">
              {/* Close Button on top-right */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setForgotOpen(false)}
                className="absolute top-4 right-4 h-8 w-8 p-0"
                aria-label="Close"
              >
                <X className="w-4 h-4"/>
              </Button>

              <CardHeader>
                <CardTitle>Forgot Password</CardTitle>
                <CardDescription>Enter your account email to receive a password reset link.</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  {forgotStatus.type !== 'idle' && (
                    <div className={`text-sm border rounded-md p-2 ${forgotStatus.type === 'success' ? 'text-green-700 bg-green-50 border-green-200' : 'text-destructive bg-destructive/10 border-destructive/20'}`}>
                      {forgotStatus.message}
                    </div>
                  )}

                  <Button type="submit" className="w-full">Send Reset Email</Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

    </div>
  );
};

export default Login;
