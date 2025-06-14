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
        
        // Get session without timeout - let it take as long as needed
        const { data: { session }, error } = await supabase.auth.getSession();
        
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
            }
          }
        } else {
          console.log('❌ AuthProvider: No session found');
        }
        
        // Always set loading to false after processing session
        if (mounted) {
          console.log('✅ AuthProvider: Setting loading to false after session check');
          setIsLoading(false);
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
            setIsLoading(true); // Set loading while fetching profile
            
            try {
              // Pass user data from session to avoid additional auth calls
              
              const fallbackUser = {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.full_name || 'User',
                phone: '',
                farmName: '',
                location: '',
              };
              
              setUser(fallbackUser);
              
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
            } finally {
              // Always set loading to false after handling sign in
              console.log('✅ AuthProvider: Setting loading to false after sign in');
              setIsLoading(false);
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('👋 AuthProvider: User signed out');
            setUser(null);
            setIsLoading(false);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 AuthProvider: Token refreshed');
            // Don't change loading state for token refresh
          } else {
            console.log('🔄 AuthProvider: Other auth event:', event);
            // Only set loading to false if we don't have a user yet
            if (!user) {
              console.log('✅ AuthProvider: Setting loading to false for event:', event);
              setIsLoading(false);
            }
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
      setIsLoading(true);
      
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
      // Don't set loading to false here - let the auth state change handler do it
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
      setIsLoading(true);
      
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
      // Don't set loading to false here - let the auth state change handler do it
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
        setIsLoading(false);
      }
      console.log('✅ AuthProvider: Logout successful');
    } catch (error) {
      // Check if the error is due to session not found
      if (error instanceof AuthApiError && error.message.includes('Session from session_id claim in JWT does not exist')) {
        console.warn('⚠️ AuthProvider: Supabase session not found during logout, clearing client session anyway.');
        setUser(null); // Clear user state
      }
      // Always set loading to false after a logout attempt, regardless of error type
      setIsLoading(false);
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