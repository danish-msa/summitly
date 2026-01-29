"use client"
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/Auth/LoginForm';
import RegisterForm from '@/components/Auth/RegisterForm';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Home, 
  Shield, 
  Star, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string | false;
  welcomeMessage?: {
    title?: string;
    description?: string;
    footer?: string;
  };
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, welcomeMessage, redirectTo = '/dashboard' }) => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
    } else {
      const timer = setTimeout(() => {
        setIsMounted(false);
        setShowWelcome(false);
        setUserName('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleWelcome = (name: string) => {
    setUserName(name);
    setShowWelcome(true);
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    setUserName('');
    onClose();
    if (redirectTo !== false) {
      router.push(redirectTo);
      router.refresh();
    }
  };

  // Default welcome messages
  const defaultWelcome = {
    title: "Welcome {username}!",
    description: "You've unlocked access to exclusive listings, price trends, and market insights.",
    footer: "One of our agents will be in touch to help you with your search."
  };

  const welcome = {
    title: welcomeMessage?.title || defaultWelcome.title,
    description: welcomeMessage?.description || defaultWelcome.description,
    footer: welcomeMessage?.footer || defaultWelcome.footer
  };

  if (!isMounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto"
      style={{
        opacity: isMounted ? 1 : 0,
        transition: 'opacity 300ms ease-in-out'
      }}
    >
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div 
          className="fixed inset-0 bg-black transition-opacity duration-300 ease-in-out"
          style={{ opacity: isOpen ? 0.5 : 0 }}
          onClick={showWelcome ? undefined : onClose}
        />
        <div 
          className={`bg-white rounded-lg relative transform overflow-hidden z-[10000] ${
            showWelcome ? 'p-8 w-full max-w-md' : isLogin ? 'p-8 w-full max-w-md' : 'p-0 w-full max-w-5xl'
          }`}
          style={{
            transform: `translateY(${isOpen ? '0' : '-20px'}) scale(${isOpen ? '1' : '0.95'})`,
            opacity: isOpen ? 1 : 0,
            transition: 'transform 300ms ease-in-out, opacity 300ms ease-in-out'
          }}
        >
          {!showWelcome && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
            >
              ✕
            </button>
          )}
          
          {showWelcome ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center mb-2">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {welcome.title.replace('{username}', userName)}
                </h2>
                <p className="text-base text-gray-700 mt-4">
                  {welcome.description}
                </p>
                <p className="text-sm text-gray-600 mt-3">
                  {welcome.footer}
                </p>
              </div>
              <Button 
                onClick={handleWelcomeClose}
                className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors duration-200"
              >
                Get Started
              </Button>
            </div>
          ) : isLogin ? (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Welcome to Summitly!
                </h2>
                <p className="text-gray-600 mt-2">
                  Get started on your real estate journey today.
                </p>
              </div>
              <LoginForm
                onRegisterClick={() => setIsLogin(false)}
                onClose={onClose}
                redirectTo={redirectTo}
              />
            </>
          ) : (
            <div className="flex flex-col md:flex-row min-h-[600px]">
              {/* Left Column - Benefits */}
              <div className="bg-gradient-to-br from-primary to-secondary text-white p-8 md:w-1/2 flex flex-col justify-center">
                <div className="mb-6 text-left">
                  <h2 className="text-3xl font-bold mb-2">
                    Join Summitly Today
                  </h2>
                  <p className="text-white/90 text-lg">
                    Unlock exclusive benefits and make smarter real estate decisions
                  </p>
                </div>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 text-left">Personalized Notifications</h3>
                      <p className="text-white/80 text-sm text-left">
                        Get instant alerts for properties matching your criteria, price drops, and new listings in your preferred areas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Home className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 text-left">Save Your Favorites</h3>
                      <p className="text-white/80 text-sm text-left">
                        Save properties you love and access them anytime from your personalized dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 text-left">Schedule Tours</h3>
                      <p className="text-white/80 text-sm text-left">
                        Book in-person, virtual, or self-guided tours directly through the platform.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 text-left">Secure & Private</h3>
                      <p className="text-white/80 text-sm text-left">
                        Your data is protected with enterprise-grade security and privacy controls.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Star className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1 text-left">Expert Support</h3>
                      <p className="text-white/80 text-sm text-left">
                        Connect with real estate professionals and get expert advice when you need it.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Sign Up Form */}
              <div className="bg-white p-8 md:w-1/2 flex flex-col justify-center">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Create Your Account
                  </h2>
                  <p className="text-gray-600 mt-2 text-sm">
                    Sign up to get started with Summitly
                  </p>
                </div>
                <RegisterForm 
                  onLoginClick={() => setIsLogin(true)} 
                  onClose={onClose}
                  onWelcome={handleWelcome}
                  redirectTo={redirectTo}
                  welcomeMessage={welcomeMessage}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level, outside of any container
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
};

export default AuthModal;