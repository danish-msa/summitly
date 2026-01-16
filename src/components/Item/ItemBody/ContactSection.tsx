"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

const preBuiltQuestions = [
  "How much out-of-pocket expenses do I need to purchase a home?",
  "Does this home have any offers on it?",
  "How much down-payment would I need to buy?",
  "Do repairs come out of my pocket or the seller?",
  "Is now a good time to buy a home?",
];

export const ContactSection = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleQuestionClick = (question: string) => {
    setFormData((prev) => {
      // If message already exists, add newline and the question
      // If message is empty, just add the question
      const newMessage = prev.message 
        ? `${prev.message}\n${question}` 
        : question;
      
      return {
        ...prev,
        message: newMessage,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.email || !formData.phone || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before sending.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Message Sent!",
      description: "We'll get back to you as soon as possible.",
    });

    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      message: "",
    });
  };

  return (
    <section id="contact-section" className="w-full min-h-screen flex items-center justify-center bg-background px-6 py-16 lg:py-24">
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column - Header & Questions */}
          <div className="space-y-8">
            {/* Available Now Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-sm font-medium text-secondary">Available Now</span>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Let's find your dream home together.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Have questions about a property or need help with your search? Our team of experts is ready to assist you every step of the way.
              </p>
            </div>

            {/* Pre-built Questions */}
            <div className="flex flex-col gap-3">
              {preBuiltQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleQuestionClick(question)}
                  className="w-fit h-auto py-3 px-5 text-base font-normal text-left rounded-lg border border-secondary/30 text-secondary hover:bg-secondary/5 hover:border-secondary/50 transition-all duration-200"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>

          {/* Right Column - Form Card */}
          <div className="bg-card rounded-2xl p-8 shadow-xl border border-border/50">
            <h3 className="text-2xl font-semibold text-card-foreground mb-6">
              Send us a message
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields Row */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="firstName"
                  type="text"
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                />
                <Input
                  id="lastName"
                  type="text"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                />
              </div>

              {/* Email */}
              <Input
                id="email"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />

              {/* Phone */}
              <Input
                id="phone"
                type="tel"
                label="Phone Number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />

              {/* Message */}
              <Textarea
                id="message"
                label="Message"
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message: e.target.value }))
                }
                className="min-h-[120px] resize-none"
              />

              {/* Submit Button */}
              <Button
                variant="default"
                type="submit"
                className="w-full h-14 text-base font-semibold rounded-xl hover:shadow-xl transition-all duration-300"
              >
                Send Message
                <Send className="ml-2 h-5 w-5 text-white" />
              </Button>

              {/* Privacy Policy */}
              <p className="text-center text-sm text-muted-foreground pt-2">
                By submitting this form, you agree to our{" "}
                <a href="#" className="text-primary hover:underline font-medium">
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
