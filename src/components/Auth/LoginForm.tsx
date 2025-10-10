"use client"
import React, { useState } from 'react';

interface LoginFormProps {
  onRegisterClick: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onRegisterClick }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login attempt with:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="Enter your password"
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input type="checkbox" className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded" />
          <span className="ml-2 text-sm text-gray-600">Remember me</span>
        </label>
        <button type="button" className="text-sm text-primary hover:text-primary-dark">
          Forgot Password?
        </button>
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors duration-200"
      >
        Sign In
      </button>

      <div className="text-center mt-4">
        <span className="text-sm text-gray-600">Don't have an account? </span>
        <button
          type="button"
          onClick={onRegisterClick}
          className="text-sm text-primary hover:text-primary-dark font-medium"
        >
          Sign Up
        </button>
      </div>
    </form>
  );
};

export default LoginForm;