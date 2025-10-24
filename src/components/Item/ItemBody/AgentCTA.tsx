import React from 'react'
import { Phone, Mail, MessageCircle, User, Star, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const AgentCTA: React.FC = () => {
  return (
    <Card className="w-full shadow-lg border-0 bg-brand-mist/50 sticky top-2">
      <CardContent className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/40 rounded-full mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">
            Connect with an Agent
          </h3>
          <p className="text-sm">
            Get personalized assistance from our expert real estate professionals
          </p>
        </div>

        {/* Agent Info */}
        <div className="bg-brand-tide backdrop-blur-lg rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">JD</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">John Doe</h4>
              <p className="text-sm text-gray-600">Senior Real Estate Agent</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-xs text-gray-500 ml-1">4.9 (127 reviews)</span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            Available Now
          </Badge>
        </div>

        {/* Contact Options */}
        <div className="flex justify-center gap-4 mb-6">
          <button 
            className="flex items-center justify-center w-12 h-12 bg-primary hover:bg-primary/90 text-white rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
            title="Call Now"
          >
            <Phone className="h-5 w-5" />
          </button>
          
          <button 
            className="flex items-center justify-center w-12 h-12 bg-white/60 backdrop-blur-lg text-primary hover:bg-brand-celestial hover:text-white rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
            title="Start Chat"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          
          <button 
            className="flex items-center justify-center w-12 h-12 bg-white/60 backdrop-blur-lg text-primary hover:bg-brand-celestial hover:text-white rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
            title="Send Email"
          >
            <Mail className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-4 bg-white/40 rounded-lg p-4">
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
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span>Free Consultation</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AgentCTA
