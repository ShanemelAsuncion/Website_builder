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
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });
  const [branding, setBranding] = useState<{ name?: string; logoUrl?: string }>({});
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin/dashboard';

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  // Load Branding (API + Cache) and subscribe to updates
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

  // Forgot password submit handler
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

  // Define the expected response type from the login API
  interface LoginResponse {
    token: string;
    user: {
      id: number;
      email: string;
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting to log in with:', credentials.email);
      const result = await authApi.login(credentials.email, credentials.password) as LoginResponse;
      
      if (!result?.token) {
        throw new Error('No token received from server');
      }

      console.log('Login successful, token received');
      // Persist token so ProtectedRoute and API interceptor can use it
      localStorage.setItem('token', result.token);
      // Optionally, you could also set axios default header immediately (interceptor reads from localStorage anyway)
      // api.defaults.headers.common.Authorization = `Bearer ${result.token}`;
      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const backgroundGradient = season === 'summer' 
    ? 'from-green-50 via-emerald-50 to-teal-50'
    : 'from-blue-50 via-slate-50 to-indigo-50';

  const accentColor = season === 'summer' ? 'text-green-600' : 'text-blue-600';
  const seasonIcon = season === 'summer' ? Sun : Snowflake;
  const SeasonIcon = seasonIcon;

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
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 right-6"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={onSeasonToggle}
          className="bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90"
        >
          <SeasonIcon className="w-4 h-4 mr-2" />
          {season === 'summer' ? 'Summer' : 'Winter'}
        </Button>
      </motion.div>

      {/* Back to Site Button */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-6"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = '/'}
          className="bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background/90"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Site
        </Button>
      </motion.div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-background/95 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4 pb-8">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center overflow-hidden"
            >
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.name || 'Company Logo'} className="w-16 h-16 object-contain bg-white rounded-2xl" />
              ) : (
                <Shield className="w-8 h-8 text-primary-foreground" />
              )}
            </motion.div>

            {/* Brand */}
            <div className="space-y-2">
              <Badge variant="outline" className="mx-auto">
                {branding.name || 'Admin'} Admin
              </Badge>
              <CardTitle className="text-2xl tracking-tight">
                Admin Portal
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {season === 'summer' 
                  ? 'Manage your landscaping business operations'
                  : 'Oversee winter service management system'
                }
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="email" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  className="h-12 bg-input-background border-border/50 focus:border-primary transition-colors"
                  required
                />
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="h-12 bg-input-background border-border/50 focus:border-primary transition-colors pr-12"
                    required
                  />
                </div>
              </motion.div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg p-3"
                >
                  {error}
                </motion.div>
              )}

              {/* Login Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isLoading || !credentials.email || !credentials.password}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Sign In to Admin
                    </>
                  )}
                </Button>
              </motion.div>

               {/* Forgot Password Link */}
              <div className="text-center">
                <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={() => setForgotOpen(true)}>
                  Forgot Password?
                </Button>
              </div>
            </form>

            {/* Forgot Password Modal (outside of form to avoid nested form issues) */}
            {forgotOpen && (
              <>
                {/* Backdrop */}
                <motion.button
                  type="button"
                  aria-label="Close forgot password"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setForgotOpen(false)}
                  className="fixed inset-0 z-[99990] bg-black/50 backdrop-blur-sm"
                />
                {/* Centered Modal */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="fixed z-[99991] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4"
                >
                  <Card className="bg-background border shadow-2xl relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setForgotOpen(false)}
                      className="absolute top-4 right-4 h-8 w-8 p-0"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
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
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                        {forgotStatus.type !== 'idle' && (
                          <div className={`${forgotStatus.type === 'success' ? 'text-green-700 bg-green-50 border-green-200' : 'text-destructive bg-destructive/10 border-destructive/20'} text-sm border rounded-md p-2`}>
                            {forgotStatus.message}
                          </div>
                        )}
                        <div>
                          <Button type="submit" className="w-full">Send Reset Email</Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}

            {/* Security Notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
              className="text-center"
            >
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border/30">
                <Shield className={`w-4 h-4 ${accentColor} mx-auto mb-1`} />
                Your session is secured with enterprise-grade encryption
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="absolute top-20 left-20"
      >
        <SeasonIcon className={`w-32 h-32 ${accentColor}`} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-20 right-20"
      >
        <SeasonIcon className={`w-24 h-24 ${accentColor}`} />
      </motion.div>
    </div>
  );
};

export default Login;
