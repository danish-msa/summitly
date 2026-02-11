"use client"

import React, { useState } from "react";
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

const assignmentPreBuiltQuestions = [
  "What is the assignment fee for this unit?",
  "Is the builder's consent required for this assignment?",
  "How much have the current owners paid in deposits?",
  "When is the expected closing date?",
  "Can I schedule a viewing or get more details?",
];

export interface PreConContactSectionProps {
  isAssignment?: boolean;
}

export const PreConContactSection: React.FC<PreConContactSectionProps> = ({ isAssignment = false }) => {
  const questions = isAssignment ? assignmentPreBuiltQuestions : preBuiltQuestions;
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
    <section id="contact-section" className="w-full min-h-0 flex items-center justify-center bg-background px-4 py-10 sm:px-6 sm:py-12 lg:py-24">
      <div className="w-full max-w-5xl mx-auto min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-start">
          {/* Left Column - Header & Questions */}
          <div className="space-y-5 sm:space-y-6 lg:space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-secondary/10 border border-secondary/20">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-secondary animate-pulse flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-secondary">
                {isAssignment ? "Assignment opportunity" : "Available Now"}
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                {isAssignment ? "Interested in this assignment?" : "Let's find your dream home together."}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {isAssignment
                  ? "Have questions about taking over this pre-construction contract? Our team can walk you through the assignment process and help you get started."
                  : "Have questions about a property or need help with your search? Our team of experts is ready to assist you every step of the way."}
              </p>
            </div>

            {/* Pre-built Questions */}
            <div className="flex flex-col gap-2 sm:gap-3">
              {questions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleQuestionClick(question)}
                  className="w-full sm:w-fit max-w-full h-auto py-2.5 px-4 sm:py-3 sm:px-5 text-xs sm:text-sm md:text-base font-normal text-left justify-start whitespace-normal break-words rounded-lg border border-secondary/30 text-secondary hover:bg-secondary/5 hover:border-secondary/50 transition-all duration-200"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>

          {/* Right Column - Form Card */}
          <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border border-border/50 w-full min-w-0">
            <h3 className="text-xl sm:text-2xl font-semibold text-card-foreground mb-4 sm:mb-6">
              Send us a message
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Name Fields Row - stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                className="min-h-[100px] sm:min-h-[120px] resize-none"
              />

              {/* Submit Button */}
              <Button
                variant="default"
                type="submit"
                className="w-full h-12 sm:h-14 text-sm sm:text-base font-semibold rounded-xl hover:shadow-xl transition-all duration-300"
              >
                Send Message
                <Send className="ml-2 h-4 w-4 sm:h-5 sm:w-5 text-white flex-shrink-0" aria-hidden />
              </Button>

              {/* Privacy Policy */}
              <p className="text-center text-xs sm:text-sm text-muted-foreground pt-2">
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

