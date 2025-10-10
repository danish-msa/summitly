'use client';
import React, { useState } from 'react';

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
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-black">Let us know how to reach you</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        {/* First Name & Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block font-medium">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-lg bg-white"
            />
          </div>
        </div>

        {/* Email & Phone Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block font-medium">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-lg bg-white"
            />
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="agreement"
            checked={formData.agreement}
            onChange={handleChange}
            required
            className="w-5 h-5 border-gray-300 rounded"
          />
          <label className="text-sm text-gray-600">
            I agree to receive promotional content from Justo
          </label>
        </div>

        {/* Submit Button */}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
          Submit
        </button>

        {/* Terms and Privacy Notice */}
        <p className="text-sm text-gray-500 text-center">
          By submitting, you agree with our <a href="#" className="text-blue-600 underline">Terms of Service</a> and <a href="#" className="text-blue-600 underline">Privacy Policy</a>.
        </p>
      </form>
    </div>
  );
};

export default ContactForm;
