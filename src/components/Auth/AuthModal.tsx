"use client"
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
          onClick={onClose}
        />
        <div 
          className="bg-white rounded-lg p-8 w-full max-w-md relative transform overflow-hidden z-[10000]"
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
              Welcome to Summitly!
            </h2>
            <p className="text-gray-600 mt-2">
              Get started on your real estate journey today.
            </p>
          </div>
          
          {isLogin ? (
            <LoginForm onRegisterClick={() => setIsLogin(false)} onClose={onClose} />
          ) : (
            <RegisterForm onLoginClick={() => setIsLogin(true)} onClose={onClose} />
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