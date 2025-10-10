"use client"
import React, { useState, useEffect } from 'react';
import LoginForm from '@/components/Auth/LoginForm';
import RegisterForm from '@/components/Auth/RegisterForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
    } else {
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isMounted) return null;

  return (
    <div 
      className="fixed inset-0 z-[999] overflow-y-auto"
      style={{
        opacity: isMounted ? 1 : 0,
        transition: 'opacity 300ms ease-in-out'
      }}
    >
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div 
          className="fixed inset-0 bg-black transition-opacity duration-300 ease-in-out"
          style={{ opacity: isOpen ? 0.5 : 0 }}
          onClick={onClose}
        />
        <div 
          className="bg-white rounded-lg p-8 w-full max-w-md relative transform overflow-hidden z-[1000]"
          style={{
            transform: `translateY(${isOpen ? '0' : '-20px'}) scale(${isOpen ? '1' : '0.95'})`,
            opacity: isOpen ? 1 : 0,
            transition: 'transform 300ms ease-in-out, opacity 300ms ease-in-out'
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 mt-2">
              {isLogin ? 'Please login to your account' : 'Please fill in your details'}
            </p>
          </div>
          
          {isLogin ? (
            <LoginForm onRegisterClick={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onLoginClick={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;