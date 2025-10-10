"use client";
import React from 'react';
import { useState } from 'react';

const Form: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    // Add your form submission logic here (e.g., API call)
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full bg-white p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
          placeholder="Enter your name"
          required
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
          placeholder="Enter your email"
          required
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-gray-700 font-medium mb-2">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          className="w-full p-3 border bg-white border-gray-300 rounded-lg focus:outline-none focus:border-primary"
          rows={5}
          placeholder="Enter your message"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-primary text-white py-3 px-6 rounded-full hover:bg-primary-dark transition duration-300"
      >
        Submit
      </button>
    </form>
  );
};

export default Form;