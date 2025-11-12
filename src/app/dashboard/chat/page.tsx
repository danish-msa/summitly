"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Search } from "lucide-react"
import { useState } from "react"

const conversations = [
  { id: 1, agent: "Sarah Johnson", lastMessage: "Great! I'll schedule the tour", time: "2m ago", unread: 2 },
  { id: 2, agent: "Mike Chen", lastMessage: "The price has been updated", time: "1h ago", unread: 0 },
  { id: 3, agent: "Emily Davis", lastMessage: "Let me check the availability", time: "3h ago", unread: 1 },
  { id: 4, agent: "James Wilson", lastMessage: "Sure, I can help with that", time: "1d ago", unread: 0 },
]

const messages = [
  { id: 1, sender: "agent", text: "Hi! How can I help you today?", time: "10:30 AM" },
  { id: 2, sender: "user", text: "I'm interested in the property at 123 Oak Street", time: "10:32 AM" },
  { id: 3, sender: "agent", text: "That's a wonderful property! Would you like to schedule a tour?", time: "10:33 AM" },
  { id: 4, sender: "user", text: "Yes, that would be great. What times are available?", time: "10:35 AM" },
  { id: 5, sender: "agent", text: "Great! I'll schedule the tour", time: "10:36 AM" },
]

export default function Chat() {
  const [newMessage, setNewMessage] = useState("")

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Conversations List */}
        <div className="col-span-4">
          <Card className="h-full shadow-md">
            <CardHeader className="border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search conversations..." className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    className="w-full p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {conv.agent.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-foreground truncate">{conv.agent}</p>
                          <span className="text-xs text-muted-foreground">{conv.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      </div>
                      {conv.unread > 0 && (
                        <span className="bg-accent text-accent-foreground text-xs rounded-full px-2 py-1 font-medium">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="col-span-8">
          <Card className="h-full shadow-md flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">SJ</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">Real Estate Agent</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button className="bg-primary hover:bg-primary/90">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

