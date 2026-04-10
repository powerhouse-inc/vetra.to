'use client'

import { useState } from 'react'
import { Calendar, Clock, Users, Video } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'

export function BookMeetingModal() {
  const [isOpen, setIsOpen] = useState(false)

  const handleBookMeeting = () => {
    // In a real implementation, this would integrate with a calendar booking service
    // like Calendly, Cal.com, or a custom booking system
    window.open('https://calendar.app.google/nmxvyJStMgN6pLzx6', '_blank')
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="group">
          <Calendar className="size-4" />
          Book a Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Schedule a Demo
          </DialogTitle>
          <DialogDescription>
            Get a personalized demo of Vetra Cloud and discover how it can transform 
            your development workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <Video className="size-5 mt-0.5 text-primary" />
              <div>
                <h4 className="font-medium">Live Demo Session</h4>
                <p className="text-sm text-muted-foreground">
                  30-minute personalized walkthrough of Vetra Cloud features
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <Users className="size-5 mt-0.5 text-primary" />
              <div>
                <h4 className="font-medium">Solution Architecture</h4>
                <p className="text-sm text-muted-foreground">
                  Discuss your specific use case and how Vetra can help
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <Clock className="size-5 mt-0.5 text-primary" />
              <div>
                <h4 className="font-medium">Q&A Session</h4>
                <p className="text-sm text-muted-foreground">
                  Get answers to technical questions and implementation details
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button 
            onClick={handleBookMeeting}
            className="w-full sm:w-auto"
          >
            <Calendar className="size-4" />
            Schedule Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}