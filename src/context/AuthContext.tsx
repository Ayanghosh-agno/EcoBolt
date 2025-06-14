import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabaseApi } from '../services/supabaseApi';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
          console.warn('Supabase not configured, using demo mode');
          if (mounted) {
            setUser({
              id: 'demo-user',
              email: 'demo@ecobolt.com',
              name: 'Demo User',
              phone: '+1-555-0123',
              farmName: 'Demo Farm',
              location: 'Demo Location',
            });
            setIsLoading(false);
          }
          return;
        }

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }
        
        if (session?.user && mounted) {
          try {
            const currentUser = await supabaseApi.getCurrentUser();
            if (mounted) {
              setUser(currentUser);
            }
          } catch (error) {
            console.error('Error getting user profile:', error);
            // If profile doesn't exist, user is still authenticated but needs profile setup
            if (mounted) {
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.full_name || 'User',
                phone: '',
                farmName: '',
                location: '',
              });
            }
          }
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Only set up auth listener if Supabase is configured
    let subscription: any = null;
    
    if (isSupabaseConfigured()) {
      // Listen for auth changes
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id);
          
          if (!mounted) return;
          
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              const currentUser = await supabaseApi.getCurrentUser();
              setUser(currentUser);
            } catch (error) {
              console.error('Error getting user after sign in:', error);
              // Fallback to basic user info
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.full_name || 'User',
                phone: '',
                farmName: '',
                location: '',
              });
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
          
          // Always set loading to false after auth state change
          setIsLoading(false);
        }
      );
      
      subscription = authSubscription;
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      if (!isSupabaseConfigured()) {
        // Demo mode login
        setUser({
          id: 'demo-user',
          email: email,
          name: 'Demo User',
          phone: '+1-555-0123',
          farmName: 'Demo Farm',
          location: 'Demo Location',
        });
        return true;
      }
      
      await supabaseApi.signIn(email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    try {
      if (!isSupabaseConfigured()) {
        // Demo mode registration
        setUser({
          id: 'demo-user',
          email: email,
          name: fullName,
          phone: '',
          farmName: '',
          location: '',
        });
        return true;
      }
      
      await supabaseApi.signUp(email, password, fullName);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (isSupabaseConfigured()) {
        await supabaseApi.signOut();
      } else {
        // Demo mode logout
        setUser(null);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};