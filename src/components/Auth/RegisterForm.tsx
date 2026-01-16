"use client"
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';

interface RegisterFormProps {
  onLoginClick: () => void;
  onClose?: () => void;
  onWelcome?: (username: string) => void;
  welcomeMessage?: {
    title?: string; // Default: "Welcome {username}!"
    description?: string; // Default: "You've unlocked access to exclusive listings, price trends, and market insights."
    footer?: string; // Default: "One of our agents will be in touch to help you with your search."
  };
}

const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onLoginClick, 
  onClose: _onClose,
  onWelcome: _onWelcome,
  welcomeMessage: _welcomeMessage 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Register user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Show success message immediately after registration
      toast({
        title: "Account Created!",
        description: "Your account has been created successfully. Signing you in...",
      });

      // Auto sign in after registration
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error('Failed to sign in after registration');
      }

      // Show welcome message in the same modal
      if (_onWelcome) {
        _onWelcome(formData.name);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again."
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // Google OAuth will redirect to Google's page, then back to our callback
      await signIn('google', {
        callbackUrl: '/dashboard',
      });
      // Note: We won't reach here because of redirect, but this handles the click
    } catch {
      setIsGoogleLoading(false);
      toast({
        title: "Google Sign In Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Google Sign Up Button - Moved to Top */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading || isGoogleLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGoogleLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium">Signing up...</span>
          </>
        ) : (
          <>
            {/* Google Logo SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700 font-medium">Continue with Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>

      {/* Form Fields */}
      <div>
        <label htmlFor="name" className="block text-left text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-2"
          placeholder="Enter your full name"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-left text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2"
          placeholder="Enter your email"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-left text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-2"
          placeholder="Create a password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || isGoogleLoading}
        className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>

      <div className="text-center mt-4">
        <span className="text-sm text-gray-600">Already have an account? </span>
        <button
          type="button"
          onClick={onLoginClick}
          className="text-sm text-primary hover:text-primary-dark font-medium"
        >
          Sign In
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;