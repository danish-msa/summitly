'use client';
import React, { useState } from 'react';
import { Send } from 'lucide-react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    agreement: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add API call or further processing here
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* First Name & Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium text-sm mb-2 text-foreground">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="John"
            required
            className="w-full h-12 px-4 border border-gray-300 rounded-xl bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block font-medium text-sm mb-2 text-foreground">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Doe"
            required
            className="w-full h-12 px-4 border border-gray-300 rounded-xl bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
          />
        </div>
      </div>

      {/* Email Address */}
      <div>
        <label className="block font-medium text-sm mb-2 text-foreground">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="john@example.com"
          required
          className="w-full h-12 px-4 border border-gray-300 rounded-xl bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
        />
      </div>

      {/* Phone Number */}
      <div>
        <label className="block font-medium text-sm mb-2 text-foreground">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+1 (555) 000-0000"
          required
          className="w-full h-12 px-4 border border-gray-300 rounded-xl bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
        />
      </div>

      {/* Agreement Checkbox */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          name="agreement"
          checked={formData.agreement}
          onChange={handleChange}
          required
          className="w-4 h-4 border-gray-300 rounded mt-0.5 flex-shrink-0"
        />
        <label className="text-xs text-muted-foreground leading-relaxed">
          I agree to receive promotional content from Summitly. By submitting, you agree with our Terms of Service.
        </label>
      </div>

      {/* Submit Button */}
      <button 
        type="submit" 
        className="w-full h-12 rounded-full text-white font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:opacity-90"
        style={{ 
          background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #2563EB 100%)' 
        }}
      >
        Submit Request
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};

export default ContactForm;
