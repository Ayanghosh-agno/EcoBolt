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
    console.log('🔄 AuthProvider: Starting initialization...');

    const initializeAuth = async () => {
      try {
        console.log('🔍 AuthProvider: Checking Supabase configuration...');
        
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
          console.log('⚠️ AuthProvider: Supabase not configured, using demo mode');
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
            console.log('✅ AuthProvider: Demo user set, loading complete');
          }
          return;
        }

        console.log('🔍 AuthProvider: Getting initial session...');
        
        // Add timeout to session check - increased from 5000 to 10000
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 10000)
        );
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (error) {
          console.error('❌ AuthProvider: Error getting session:', error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }
        
        console.log('📋 AuthProvider: Session data:', session?.user?.id ? 'User found' : 'No user');
        
        if (session?.user && mounted) {
          console.log('👤 AuthProvider: Getting user profile with session data...');
          try {
            // Pass user data from session to avoid additional auth calls
            const currentUser = await supabaseApi.getCurrentUser(
              session.user.id,
              session.user.email!,
              session.user.user_metadata
            );
            
            if (mounted) {
              console.log('✅ AuthProvider: User profile loaded:', currentUser?.name);
              setUser(currentUser);
              setIsLoading(false);
            }
          } catch (error) {
            console.error('⚠️ AuthProvider: Error getting user profile, using fallback:', error);
            // If profile doesn't exist, user is still authenticated but needs profile setup
            if (mounted) {
              const fallbackUser = {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.full_name || 'User',
                phone: '',
                farmName: '',
                location: '',
              };
              console.log('✅ AuthProvider: Fallback user set:', fallbackUser.name);
              setUser(fallbackUser);
              setIsLoading(false);
            }
          }
        } else {
          console.log('❌ AuthProvider: No session found, setting loading to false');
          if (mounted) {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ AuthProvider: Error in initializeAuth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Only set up auth listener if Supabase is configured
    let subscription: any = null;
    
    if (isSupabaseConfigured()) {
      console.log('🔗 AuthProvider: Setting up auth state listener...');
      // Listen for auth changes
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔄 AuthProvider: Auth state changed:', event, session?.user?.id || 'no user');
          
          if (!mounted) {
            console.log('⚠️ AuthProvider: Component unmounted, ignoring auth change');
            return;
          }
          
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ AuthProvider: User signed in, getting profile with session data...');
            try {
              // Pass user data from session to avoid additional auth calls
              const currentUser = await supabaseApi.getCurrentUser(
                session.user.id,
                session.user.email!,
                session.user.user_metadata
              );
              
              console.log('✅ AuthProvider: Profile loaded after sign in:', currentUser?.name);
              setUser(currentUser);
            } catch (error) {
              console.error('⚠️ AuthProvider: Error getting user after sign in, using fallback:', error);
              // Fallback to basic user info
              const fallbackUser = {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.full_name || 'User',
                phone: '',
                farmName: '',
                location: '',
              };
              console.log('✅ AuthProvider: Fallback user set after sign in:', fallbackUser.name);
              setUser(fallbackUser);
            }
            // Always set loading to false after handling sign in
            console.log('✅ AuthProvider: Setting loading to false after sign in');
            setIsLoading(false);
          } else if (event === 'SIGNED_OUT') {
            console.log('👋 AuthProvider: User signed out');
            setUser(null);
            setIsLoading(false);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 AuthProvider: Token refreshed');
            // Don't change loading state for token refresh
          } else {
            console.log('🔄 AuthProvider: Other auth event, setting loading to false');
            setIsLoading(false);
          }
        }
      );
      
      subscription = authSubscription;
    }

    return () => {
      console.log('🧹 AuthProvider: Cleanup');
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 AuthProvider: Attempting login...');
      if (!isSupabaseConfigured()) {
        console.log('🔐 AuthProvider: Demo mode login');
        // Demo mode login
        setUser({
          id: 'demo-user',
          email: email,
          name: 'Demo User',
          phone: '+1-555-0123',
          farmName: 'Demo Farm',
          location: 'Demo Location',
        });
        setIsLoading(false);
        return true;
      }
      
      await supabaseApi.signIn(email, password);
      console.log('✅ AuthProvider: Login successful');
      return true;
    } catch (error) {
      console.error('❌ AuthProvider: Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<boolean> => {
    try {
      console.log('📝 AuthProvider: Attempting registration...');
      if (!isSupabaseConfigured()) {
        console.log('📝 AuthProvider: Demo mode registration');
        // Demo mode registration
        setUser({
          id: 'demo-user',
          email: email,
          name: fullName,
          phone: '',
          farmName: '',
          location: '',
        });
        setIsLoading(false);
        return true;
      }
      
      await supabaseApi.signUp(email, password, fullName);
      console.log('✅ AuthProvider: Registration successful');
      return true;
    } catch (error) {
      console.error('❌ AuthProvider: Registration error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('👋 AuthProvider: Attempting logout...');
      if (isSupabaseConfigured()) {
        await supabaseApi.signOut();
      } else {
        // Demo mode logout
        setUser(null);
      }
      console.log('✅ AuthProvider: Logout successful');
    } catch (error) {
      console.error('❌ AuthProvider: Logout error:', error);
    }
  };

  console.log('🎯 AuthProvider: Current state - isLoading:', isLoading, 'user:', user?.name || 'none');

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};