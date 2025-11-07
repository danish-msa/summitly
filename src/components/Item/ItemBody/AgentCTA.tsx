import React from 'react'
import { Phone, Mail, MessageCircle, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const AgentCTA: React.FC = () => {
  return (
    <Card 
      data-agent-cta
      className="w-full shadow-lg border-0 bg-gradient-to-b from-brand-celestial to-brand-cb-blue"
    >
      <CardContent className="p-6">
        {/* Header with Contact Icons */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Header Text */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex items-center justify-center w-8 h-8 bg-white/40 rounded-full flex-shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Connect with an Agent
              </h3>
            </div>
            <p className="text-sm text-white">
              Get personalized assistance from our expert real estate professionals
            </p>
          </div>

          {/* Contact Options */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button 
              className="flex items-center justify-center w-12 h-12 bg-brand-celestial hover:bg-white/50 hover:text-primary text-white rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
              title="Call Now"
            >
              <Phone className="h-5 w-5" />
            </button>
            
            <button 
              className="flex items-center justify-center w-12 h-12 bg-brand-celestial backdrop-blur-lg text-white hover:bg-white/50 hover:text-primary rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
              title="Start Chat"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
            
            <button 
              className="flex items-center justify-center w-12 h-12 bg-brand-celestial backdrop-blur-lg text-white hover:bg-white/50 hover:text-primary rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
              title="Send Email"
            >
              <Mail className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        {/* <div className="border-t pt-4 bg-white/40 rounded-lg p-4">
          <h5 className="font-semibold text-gray-900 mb-3 text-sm">Quick Actions</h5>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white transition-colors text-left">
              <span className="text-sm text-gray-700">Schedule a Viewing</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white transition-colors text-left">
              <span className="text-sm text-gray-700">Get Market Analysis</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white transition-colors text-left">
              <span className="text-sm text-gray-700">Discuss Financing</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div> */}

        {/* Trust Indicators */}
        <div className="mt-6 pt-4 border-t border-white/20">
          <div className="flex items-center justify-center gap-4 text-xs text-white">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-white">24/7 Support</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-white">Free Consultation</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AgentCTA
