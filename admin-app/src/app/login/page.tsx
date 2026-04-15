'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogOut, Mail } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dummyEmail, setDummyEmail] = useState('');
  const [showDummyLogin, setShowDummyLogin] = useState(false);
  const [firebaseAvailable, setFirebaseAvailable] = useState(false);
  const router = useRouter();

  // Check if Firebase is available
  useEffect(() => {
    import('@/lib/firebase').then(({ auth, IS_DEMO_MODE }) => {
      setFirebaseAvailable(!IS_DEMO_MODE && !!auth);
    }).catch(() => {
      setFirebaseAvailable(false);
    });
  }, []);

  const handleGoogleSignIn = async () => {
    if (!firebaseAvailable) {
      alert('Firebase is not configured. Please use the demo login option.');
      return;
    }

    try {
      setLoading(true);
      const { signInWithPopup } = await import('firebase/auth');
      const { auth, googleProvider } = await import('@/lib/firebase');
      
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      
      // Store user session
      localStorage.setItem('user', JSON.stringify(result.user));
      
      // Set cookie for middleware compatibility
      document.cookie = `user=${encodeURIComponent(JSON.stringify(result.user))}; path=/; max-age=86400`;
      
      // Redirect to admin panel
      router.push('/admin');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Google Sign-In failed. Please use the demo login option.');
    } finally {
      setLoading(false);
    }
  };

  const handleDummyLogin = () => {
    if (!dummyEmail) {
      alert('Please enter an email address');
      return;
    }

    const dummyUser = {
      uid: 'dummy-user-' + Date.now(),
      email: dummyEmail,
      displayName: dummyEmail.split('@')[0],
      photoURL: '',
      isDummy: true
    };

    setUser(dummyUser);
    localStorage.setItem('user', JSON.stringify(dummyUser));
    
    // Set cookie for middleware compatibility
    document.cookie = `user=${encodeURIComponent(JSON.stringify(dummyUser))}; path=/; max-age=86400`;
    
    router.push('/admin');
  };

  const handleSignOut = async () => {
    try {
      if (firebaseAvailable) {
        const { signOut } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');
        await signOut(auth);
      }
      setUser(null);
      localStorage.removeItem('user');
      document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Check for existing user session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-indigo-500 to-amber-500 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">OF</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">OrderFlow Admin</CardTitle>
          <CardDescription className="text-gray-600">
            Customer Order Management System
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!user ? (
            <div className="space-y-4">
              {/* Dummy Login Section */}
              <div className="space-y-3">
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowDummyLogin(!showDummyLogin)}
                    className="w-full border-amber-200 hover:border-amber-300 hover:bg-amber-50 text-amber-700"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {showDummyLogin ? 'Hide' : 'Show'} Quick Login (Demo)
                  </Button>
                </div>
                
                {showDummyLogin && (
                  <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <Label htmlFor="dummy-email" className="text-sm font-medium text-amber-800">
                      Demo Email (any email works)
                    </Label>
                    <Input
                      id="dummy-email"
                      name="dummy-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={dummyEmail}
                      onChange={(e) => setDummyEmail(e.target.value)}
                      className="border-amber-200 focus:border-amber-400"
                    />
                    <Button 
                      onClick={handleDummyLogin}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Quick Login (Demo)
                    </Button>
                    <p className="text-xs text-amber-600 text-center">
                      Use any email address for demo purposes
                    </p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Google Sign-In */}
              <Button 
                onClick={handleGoogleSignIn}
                disabled={loading || !firebaseAvailable}
                className="w-full h-12 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {firebaseAvailable ? 'Continue with Google' : 'Google Sign-In (Configure Firebase)'}
                  </>
                )}
              </Button>
              {!firebaseAvailable && (
                <p className="text-xs text-gray-500 text-center">
                  Firebase is not configured. Use the demo login above or set up Firebase credentials.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL} alt={user.displayName} />
                  <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{user.displayName}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.isDummy && (
                    <p className="text-xs text-amber-600">Demo Account</p>
                  )}
                </div>
              </div>
              
              <Button 
                onClick={handleSignOut}
                variant="outline"
                className="w-full h-10 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-all duration-200"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
              
              <Button 
                onClick={() => router.push('/admin')}
                className="w-full h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Go to Admin Panel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}