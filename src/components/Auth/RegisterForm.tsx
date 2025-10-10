"use client"
import React, { useState } from 'react';

interface RegisterFormProps {
  onLoginClick: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onLoginClick }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle registration logic here
    console.log('Registration attempt with:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div>
        <label htmlFor="confirmPassword" className="block text-left text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full px-4 py-2"
          placeholder="Confirm your password"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors duration-200"
      >
        Create Account
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