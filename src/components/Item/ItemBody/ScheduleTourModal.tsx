"use client";

import React, { useState } from 'react';
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
import { ChevronLeft, ChevronRight, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  tourType: z.enum(['in-person', 'video-chat']),
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
  name: z.string().min(1, 'Enter your name.'),
  phone: z.string().min(10, 'Enter a valid phone number.'),
  email: z.string().email('Enter a valid email.'),
  preApproval: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface ScheduleTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Generate dates for the next 7 days
const generateDates = () => {
  const dates = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    dates.push({
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
      fullDate: date.toISOString().split('T')[0],
    });
  }
  return dates;
};

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
];

const ScheduleTourModal: React.FC<ScheduleTourModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [dateOffset, setDateOffset] = useState(0);
  const dates = generateDates();
  const visibleDates = dates.slice(dateOffset, dateOffset + 4);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tourType: 'in-person',
      preApproval: false,
    },
  });

  const tourType = watch('tourType');
  const selectedDate = watch('date');
  const selectedTime = watch('time');
  const preApproval = watch('preApproval');

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
    // Handle form submission here
    onOpenChange(false);
  };

  const handlePrevDates = () => {
    if (dateOffset > 0) {
      setDateOffset(dateOffset - 1);
    }
  };

  const handleNextDates = () => {
    if (dateOffset + 4 < dates.length) {
      setDateOffset(dateOffset + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-10 overflow-y-auto space-y-4 bg-white">
        <DialogHeader>
          <DialogTitle className="text-4xl font-bold text-center">Schedule Tour</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          {/* Tour Type */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Tour Type</Label>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('tourType', 'in-person')}
                className={cn(
                  'py-3 px-4 rounded-lg border-2 font-medium transition-all',
                  tourType === 'in-person'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-background text-foreground hover:border-primary/50'
                )}
              >
                In-Person
              </button>
              <button
                type="button"
                onClick={() => setValue('tourType', 'video-chat')}
                className={cn(
                  'py-3 px-4 rounded-lg border-2 font-medium transition-all',
                  tourType === 'video-chat'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-white text-foreground hover:border-primary/50'
                )}
              >
                Video Chat
              </button>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePrevDates}
                disabled={dateOffset === 0}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 grid grid-cols-4 gap-2">
                {visibleDates.map((dateInfo) => (
                  <button
                    key={dateInfo.fullDate}
                    type="button"
                    onClick={() => setValue('date', dateInfo.fullDate)}
                    className={cn(
                      'py-3 px-2 rounded-lg border-2 transition-all',
                      selectedDate === dateInfo.fullDate
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-white hover:border-accent/50'
                    )}
                  >
                    <div className="text-sm font-medium">{dateInfo.day}</div>
                    <div className="text-2xl font-bold">{dateInfo.date}</div>
                    <div className="text-xs text-muted-foreground">{dateInfo.month}</div>
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleNextDates}
                disabled={dateOffset + 4 >= dates.length}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {errors.date && (
              <div className="flex items-center gap-1 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.date.message}</span>
              </div>
            )}
          </div>

          {/* Time Selection */}
          <div className="space-y-1">
            <Label htmlFor="time" className="text-sm">Time</Label>
            <Select value={selectedTime} onValueChange={(value) => setValue('time', value)}>
              <SelectTrigger 
                id="time"
                className={cn(
                  'w-full rounded-lg bg-white',
                  errors.time && 'border-destructive'
                )}
              >
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.time && (
              <div className="flex items-center gap-1 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.time.message}</span>
              </div>
            )}
          </div>

          {/* Name and Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm">Name</Label>
              <Input
                id="name"
                placeholder="Name"
                {...register('name')}
                className={cn('rounded-lg bg-white', errors.name && 'border-destructive')}
              />
              {errors.name && (
                <div className="flex items-center gap-1 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.name.message}</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-sm">Phone</Label>
              <Input
                id="phone"
                placeholder="Phone"
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
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
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

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-6 text-base font-semibold rounded-lg"
          >
            Schedule Tour
          </Button>

          {/* Pre-approval Checkbox */}
          <div className="flex items-start space-x-2 pt-4">
            <Checkbox
              id="preApproval"
              checked={preApproval}
              onCheckedChange={(checked) => setValue('preApproval', checked as boolean)}
              className="mt-0.5"
            />
            <label
              htmlFor="preApproval"
              className="text-sm leading-tight text-muted-foreground cursor-pointer"
            >
              I want pre-approval information from Summitly Home Loans
            </label>
          </div>

          {/* Terms */}
          <div className="text-xs text-muted-foreground leading-relaxed">
            By pressing Schedule Tour, you agree that Summitly and real estate professionals may contact you via phone/text about your inquiry, which may involve the use of automated means. You are not required to consent as a condition of purchasing any property, goods or services. Message/data rates may apply. You also agree to our{' '}
            <a href="#" className="text-primary hover:underline">
              Terms of Use
            </a>
            . Summitly does not endorse any{' '}
            <a href="#" className="text-primary hover:underline">
              real estate professional
            </a>
            .
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleTourModal;
