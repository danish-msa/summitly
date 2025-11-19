import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const preBuiltQuestions = [
  "What is the expected completion date for this project?",
  "What are the available unit types and sizes?",
  "What is the deposit structure and payment schedule?",
  "Are there any incentives or promotions available?",
  "What amenities are included in this development?",
];

export const PreConContactSection = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleQuestionClick = (question: string) => {
    setFormData((prev) => ({
      ...prev,
      message: prev.message ? `${prev.message} ${question}` : question,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.fullName || !formData.email || !formData.phone || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before sending.",
        variant: "destructive",
      });
      return;
    }

    // Email validation
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

    // Reset form
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      message: "",
    });
  };

  return (
    <section id="contact-section" className="w-full flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4 py-16">
      <div className="w-full max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Get In Touch
          </h2>
          <p className="text-muted-foreground text-lg">
            Have questions about this pre-construction project? We're here to help you find your dream home.
          </p>
        </div>

        {/* Pre-built Questions */}
        <div className="mb-12 flex flex-wrap items-center justify-center gap-3">
          {preBuiltQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleQuestionClick(question)}
              className="h-auto py-3 px-6 text-sm font-normal whitespace-normal text-center rounded-lg border-2 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md transition-all duration-300 backdrop-blur-sm"
            >
              {question}
            </Button>
          ))}
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-base font-medium flex items-center gap-2">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    className="h-12 text-base border-border/50 focus:border-primary transition-colors shadow-sm"
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium flex items-center gap-2">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="h-12 text-base border-border/50 focus:border-primary transition-colors shadow-sm"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base font-medium flex items-center gap-2">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="h-12 text-base border-border/50 focus:border-primary transition-colors shadow-sm"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-base font-medium flex items-center gap-2">
                  Message
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="min-h-[280px] text-base resize-none border-border/50 focus:border-primary transition-colors shadow-sm"
                  placeholder="Tell us about your pre-construction project interests..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                size="lg"
                className="px-12 py-6 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-md"
              >
                Send Message
              </Button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

