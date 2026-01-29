"use client";

import React from 'react';
import { User, Home, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ServiceCardProps {
  icon: React.ReactNode;
  text: string;
  buttonText: string;
  onAction?: () => void;
  iconColor?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ 
  icon, 
  text, 
  buttonText, 
  onAction,
  iconColor = "text-blue-500"
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${iconColor}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-gray-700 mb-4">{text}</p>
          <Button
            onClick={onAction}
            className="w-full text-white hover:from-blue-600 hover:to-teal-600 font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2"
          >
            {buttonText}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const ToolsAndServices: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Tools & Services</h2>
      
      <ServiceCard
        icon={<User className="w-8 h-8" />}
        text="We'll connect you with top agents in your area."
        buttonText="Ready to sell"
        iconColor="text-blue-500"
        onAction={() => console.log('Ready to sell clicked')}
      />

      <ServiceCard
        icon={<Home className="w-8 h-8" />}
        text="Refinance your home with us and get the best rates."
        buttonText="Learn more"
        iconColor="text-green-500"
        onAction={() => console.log('Learn more clicked')}
      />
    </div>
  );
};

export default ToolsAndServices;
