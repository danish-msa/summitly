"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  firstName: z.string().min(1, 'Enter your first name.'),
  lastName: z.string().min(1, 'Enter your last name.'),
  phone: z.string().min(10, 'Enter a valid phone number.'),
  email: z.string().email('Enter a valid email.'),
  hearAboutUs: z.string().min(1, 'Please select how you heard about us.'),
  isAgent: z.boolean(),
  firstChoice: z.string().min(1, 'Please select your first choice.'),
  secondChoice: z.string().optional(),
  message: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface RequestFurtherInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
}

const hearAboutUsOptions = [
  'Google Search',
  'Social Media',
  'Friend/Family Referral',
  'Real Estate Agent',
  'Advertisement',
  'Other',
];

const unitTypeOptions = [
  '1 Bed',
  '1 Bed + 1 Den',
  '2 Bed',
  '2 Bed + 1 Den',
  '3 Bed',
  '3 Bed + 1 Den',
  '4 Bed',
  '4 Bed + 1 Den',
];

const RequestFurtherInfoModal: React.FC<RequestFurtherInfoModalProps> = ({
  open,
  onOpenChange,
  projectName,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isAgent: false,
    },
  });

  const hearAboutUs = watch('hearAboutUs');
  const firstChoice = watch('firstChoice');
  const secondChoice = watch('secondChoice');
  const isAgent = watch('isAgent');

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
    // Handle form submission here
    // TODO: Add API call to submit the form
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 flex flex-col bg-white rounded-lg">
        {/* Fixed Header */}
        <DialogHeader className="sticky top-0 z-10 bg-white border-b border-border py-6 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-8 w-8 rounded-full hover:bg-gray-100"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
          <DialogTitle className="text-4xl font-bold text-center">
            Request Further Info
          </DialogTitle>
          {projectName && (
            <p className="text-center text-muted-foreground mt-2">
              {projectName}
            </p>
          )}
        </DialogHeader>
        
        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-10 pb-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* First Name and Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-sm">First Name</Label>
              <Input
                id="firstName"
                placeholder="Enter your first name"
                {...register('firstName')}
                className={cn('rounded-lg', errors.firstName && 'border-destructive')}
              />
              {errors.firstName && (
                <div className="flex items-center gap-1 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.firstName.message}</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-sm">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Enter your last name"
                {...register('lastName')}
                className={cn('rounded-lg bg-white', errors.lastName && 'border-destructive')}
              />
              {errors.lastName && (
                <div className="flex items-center gap-1 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.lastName.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Phone and Email */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-sm">Phone</Label>
              <Input
                id="phone"
                placeholder="Enter your phone number"
                {...register('phone')}
                className={cn('rounded-lg bg-white', errors.phone && 'border-destructive')}
              />
              {errors.phone && (
                <div className="flex items-center gap-1 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.phone.message}</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register('email')}
                className={cn('rounded-lg bg-white', errors.email && 'border-destructive')}
              />
              {errors.email && (
                <div className="flex items-center gap-1 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.email.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* How did you hear about us? */}
          <div className="space-y-1">
            <Label htmlFor="hearAboutUs" className="text-sm">How did you hear about us?</Label>
            <Select value={hearAboutUs} onValueChange={(value) => setValue('hearAboutUs', value)}>
              <SelectTrigger 
                id="hearAboutUs"
                className={cn(
                  'w-full rounded-lg bg-white',
                  errors.hearAboutUs && 'border-destructive'
                )}
              >
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {hearAboutUsOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.hearAboutUs && (
              <div className="flex items-center gap-1 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.hearAboutUs.message}</span>
              </div>
            )}
          </div>

          {/* Are You an Agent? */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isAgent"
              checked={isAgent}
              onCheckedChange={(checked) => setValue('isAgent', checked === true)}
            />
            <Label
              htmlFor="isAgent"
              className="text-sm font-normal cursor-pointer"
            >
              Are You an Agent?
            </Label>
          </div>

          {/* First Choice and Second Choice */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="firstChoice" className="text-sm">First Choice</Label>
              <Select value={firstChoice} onValueChange={(value) => setValue('firstChoice', value)}>
                <SelectTrigger 
                  id="firstChoice"
                  className={cn(
                    'w-full rounded-lg bg-white',
                    errors.firstChoice && 'border-destructive'
                  )}
                >
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {unitTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.firstChoice && (
                <div className="flex items-center gap-1 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.firstChoice.message}</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="secondChoice" className="text-sm">Second Choice (Optional)</Label>
              <Select value={secondChoice} onValueChange={(value) => setValue('secondChoice', value)}>
                <SelectTrigger 
                  id="secondChoice"
                  className="w-full rounded-lg bg-white"
                >
                  <SelectValue placeholder="Select unit type (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {unitTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1">
            <Label htmlFor="message" className="text-sm">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Enter your message..."
              {...register('message')}
              className={cn('rounded-lg bg-white min-h-[120px]', errors.message && 'border-destructive')}
            />
            {errors.message && (
              <div className="flex items-center gap-1 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.message.message}</span>
              </div>
            )}
          </div>

          {/* Consent/Disclaimer Text */}
          <div className="pt-2 pb-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              By submitting this form, you give express written consent to eXp Realty and its authorized representatives to contact you via email, telephone, text message, and other forms of electronic communication, including through automated systems, AI assistants, or prerecorded messages. Communications may include information about real estate services, property listings, market updates, or promotions related to your inquiry or expressed interests. You may withdraw your consent at any time by replying "STOP" to text messages or clicking "unsubscribe" in emails. Message and data rates may apply. For more details, please review our{' '}
              <a 
                href="/privacy-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Privacy Policy
              </a>
              {' '}&{' '}
              <a 
                href="/terms-of-service" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Terms of Service
              </a>
              .
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-6 text-base font-semibold rounded-lg"
          >
            Submit
          </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestFurtherInfoModal;

