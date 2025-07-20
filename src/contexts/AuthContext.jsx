import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session
    const savedUser = localStorage.getItem('socialchat_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Mock login - in real app, this would call your backend
      const mockUser = {
        id: '1',
        email,
        name: 'Demo User',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        coins: 100,
        isVerified: true,
        isVip: false,
        interests: ['Technology', 'Travel', 'Music'],
        location: 'New York, USA',
        age: 25,
        gender: 'male',
        language: 'en'
      };
      
      localStorage.setItem('socialchat_user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      
      return { success: true };
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      // Mock registration
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        coins: 50, // Welcome bonus
        isVerified: false,
        isVip: false,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      };
      
      localStorage.setItem('socialchat_user', JSON.stringify(newUser));
      setUser(newUser);
      
      toast({
        title: "Account created!",
        description: "Welcome to SocialChat! You've received 50 welcome coins.",
      });
      
      return { success: true };
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Please try again.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('socialchat_user');
    setUser(null);
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
  };

  const updateProfile = (updates) => {
    if(!user) return;
    const updatedUser = { ...user, ...updates };
    localStorage.setItem('socialchat_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const socialLogin = async (provider) => {
    try {
      // Mock social login
      const mockUser = {
        id: Date.now().toString(),
        email: `user@${provider}.com`,
        name: `${provider} User`,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        coins: 75,
        isVerified: true,
        isVip: false,
        provider
      };
      
      localStorage.setItem('socialchat_user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      toast({
        title: "Welcome!",
        description: `Successfully logged in with ${provider}.`,
      });
      
      return { success: true };
    } catch (error) {
      toast({
        title: "Social login failed",
        description: "Please try again.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    socialLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};