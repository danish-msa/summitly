"use client";

import React, { useState } from "react";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const Form: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Form Data:", formData);
      setFormData({ name: "", email: "", subject: "", message: "" });
      alert("Message sent successfully!");
    } catch {
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBase =
    "w-full bg-transparent py-2 text-foreground placeholder:text-muted-foreground/60 border-0 border-b border-input rounded-none focus:outline-none focus:ring-0 focus:border-primary transition-colors disabled:opacity-60";
  const labelBase = "block text-sm font-medium text-muted-foreground mb-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className={labelBase}>
            Your Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`${inputBase} ${errors.name ? "border-destructive" : ""}`}
            placeholder="John Doe"
            disabled={isSubmitting}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-destructive text-xs mt-1">{errors.name}</p>
          )}
        </div>
        <div>
          <label htmlFor="email" className={labelBase}>
            Your Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`${inputBase} ${errors.email ? "border-destructive" : ""}`}
            placeholder="hello@example.com"
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-destructive text-xs mt-1">{errors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className={labelBase}>
          Your Subject
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          className={inputBase}
          placeholder="I want to hire you quickly"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-primary mb-1"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          className={`${inputBase} min-h-[100px] resize-y ${errors.message ? "border-destructive" : ""}`}
          placeholder="Write here your message"
          disabled={isSubmitting}
          aria-invalid={!!errors.message}
          rows={4}
        />
        {errors.message && (
          <p className="text-destructive text-xs mt-1">{errors.message}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto bg-primary text-primary-foreground font-medium py-3 px-8 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
};

export default Form;
