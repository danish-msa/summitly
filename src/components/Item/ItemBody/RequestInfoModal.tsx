"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(1, 'Enter your name.'),
  phone: z.string().min(10, 'Enter a valid phone number.'),
  email: z.string().email('Enter a valid email.'),
  message: z.string().min(1, 'Please enter a message.'),
});

type FormData = z.infer<typeof formSchema>;

interface RequestInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RequestInfoModal: React.FC<RequestInfoModalProps> = ({
  open,
  onOpenChange,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
    // Handle form submission here
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-10 overflow-y-auto space-y-4 bg-white">
        <DialogHeader>
          <DialogTitle className="text-4xl font-bold text-center">Request Property Info</DialogTitle>
          <DialogDescription className="text-sm text-center">Please fill out the form below to request property information.</DialogDescription>
        </DialogHeader>
        
        {/* <AgentCTA />
        <Separator /> */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name and Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Input
                id="name"
                label="Name"
                {...register('name')}
                className={cn(errors.name && '!border-destructive')}
              />
              {errors.name && (
                <div className="flex items-center gap-1 text-destructive text-sm mt-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.name.message}</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Input
                id="phone"
                label="Phone"
                type="tel"
                {...register('phone')}
                className={cn(errors.phone && '!border-destructive')}
              />
              {errors.phone && (
                <div className="flex items-center gap-1 text-destructive text-sm mt-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.phone.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Input
              id="email"
              type="email"
              label="Email"
              {...register('email')}
              className={cn(errors.email && '!border-destructive')}
            />
            {errors.email && (
              <div className="flex items-center gap-1 text-destructive text-sm mt-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.email.message}</span>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="space-y-1">
            <Textarea
              id="message"
              label="Message"
              {...register('message')}
              className={cn('min-h-[120px]', errors.message && '!border-destructive')}
            />
            {errors.message && (
              <div className="flex items-center gap-1 text-destructive text-sm mt-1">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.message.message}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-6 text-base font-semibold rounded-lg mt-4"
          >
            Request Info
          </Button>
        </form>

      </DialogContent>
    </Dialog>
  );
};

export default RequestInfoModal;

