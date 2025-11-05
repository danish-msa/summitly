import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import SectionHeading from "@/components/Helper/SectionHeading";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  project: string;
  image: string;
  rating: number;
  content: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Mitchell",
    role: "First-time Homebuyer",
    project: "Oakridge Residences",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    rating: 5,
    content: "The pre-construction process was seamless. The team guided us through every step, and we got an incredible unit at a great price. Our investment has already appreciated significantly!"
  },
  {
    id: 2,
    name: "David Chen",
    role: "Real Estate Investor",
    project: "Skyline Towers",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
    rating: 5,
    content: "I've purchased three units in this development. The location is prime, the builder's reputation is solid, and the projected returns are outstanding. Highly recommend for investors."
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Young Professional",
    project: "The Metropolitan",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    rating: 5,
    content: "Everything I wanted in a modern home - smart features, eco-friendly design, and a vibrant community. The pre-construction pricing made it possible for me to afford my dream condo!"
  },
  {
    id: 4,
    name: "James Thompson",
    role: "Retiree",
    project: "Harborview Estates",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    rating: 5,
    content: "After years of research, we chose this pre-construction project for our retirement. The amenities are exceptional, and the waterfront location is exactly what we were looking for."
  },
  {
    id: 5,
    name: "Lisa Wang",
    role: "Business Owner",
    project: "Central Plaza",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop",
    rating: 5,
    content: "The investment potential and the quality of construction exceeded my expectations. The developer's transparency throughout the process made me confident in my decision."
  },
  {
    id: 6,
    name: "Michael O'Brien",
    role: "Growing Family",
    project: "Garden Heights",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    rating: 5,
    content: "Perfect timing for our expanding family. The flexible floor plans, nearby schools, and family-friendly amenities made this the ideal choice. We're excited to move in next year!"
  }
];

export const Testimonials = () => {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <SectionHeading
          heading="What Our Clients Say"
          subheading="Testimonials"
          description="Join hundreds of satisfied homeowners and investors who trusted us with their pre-construction journey"
          position="center"
        />

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {testimonials.map((testimonial) => (
            <Card 
              key={testimonial.id}
              className="p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card border-border"
            >
              {/* Rating Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star 
                    key={i} 
                    className="w-5 h-5 fill-accent text-accent" 
                  />
                ))}
              </div>

              {/* Testimonial Content */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Client Info */}
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <Avatar className="w-12 h-12 ring-2 ring-accent/20">
                  <AvatarImage src={testimonial.image} alt={testimonial.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                  <p className="text-xs text-primary font-medium mt-1">
                    {testimonial.project}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Ready to start your pre-construction journey?
          </p>
          <button className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-lg">
            Schedule a Consultation
          </button>
        </div>
      </div>
    </section>
  );
};

