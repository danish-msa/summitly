"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChevronLeft, ChevronRight, AlertCircle, X, Bed, Bath, Maximize2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTours } from '@/hooks/useTours';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PropertyListing } from '@/lib/types';

const formSchema = z.object({
  date: z.string().min(1, 'Please select a date'),
  availability: z.enum(['morning', 'afternoon', 'evening'], {
    required_error: 'Please select your availability',
  }),
  name: z.string().min(1, 'Enter your name.'),
  phone: z.string().min(10, 'Enter a valid phone number.'),
  email: z.string().email('Enter a valid email.'),
  message: z.string().optional(),
  preApproval: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface ScheduleTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mlsNumber?: string;
  propertyAddress?: string;
  property?: PropertyListing;
}

// Generate dates for the next 21 days
const generateDates = () => {
  const dates = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 0; i < 21; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dayNum = date.getDate();
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    
    dates.push({
      day: dayName,
      date: dayNum,
      month: monthName,
      formatted: `${dayName} ${monthName} ${dayNum}`,
      fullDate: date.toISOString().split('T')[0],
    });
  }
  return dates;
};

// Map availability to default time
const availabilityToTime: Record<'morning' | 'afternoon' | 'evening', string> = {
  morning: '10:00 AM',
  afternoon: '2:00 PM',
  evening: '5:00 PM',
};

const ScheduleTourModal: React.FC<ScheduleTourModalProps> = ({
  open,
  onOpenChange,
  mlsNumber,
  property,
}) => {
  const { data: session } = useSession();
  const { createTour, isCreating } = useTours();
  const [step, setStep] = useState(1);
  const [dateOffset, setDateOffset] = useState(0);
  const [dates, setDates] = useState<ReturnType<typeof generateDates>>([]);
  
  // Generate dates only on client side to avoid hydration mismatch
  React.useEffect(() => {
    setDates(generateDates());
  }, []);
  
  const visibleDates = dates.slice(dateOffset, dateOffset + 6);

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
      preApproval: false,
      message: "I'm looking forward to touring with you!",
    },
  });

  const selectedDate = watch('date');
  const selectedAvailability = watch('availability');
  const preApproval = watch('preApproval');

  const onSubmit = async (data: FormData) => {
    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to schedule a tour.",
        variant: "destructive",
      });
      return;
    }

    if (!mlsNumber) {
      toast({
        title: "Error",
        description: "Property information is missing. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Parse time from format like "9:00 AM" to 24-hour format
      const parseTime = (timeStr: string): string => {
        const [time, period] = timeStr.split(' ')
        const [hours, minutes] = time.split(':')
        let hour24 = parseInt(hours, 10)
        if (period === 'PM' && hour24 !== 12) {
          hour24 += 12
        } else if (period === 'AM' && hour24 === 12) {
          hour24 = 0
        }
        return `${hour24.toString().padStart(2, '0')}:${minutes}`
      }
      
      // Get default time based on availability selection
      const defaultTime = availabilityToTime[data.availability]
      
      // Combine date and time into a single datetime
      const time24 = parseTime(defaultTime)
      const dateTime = new Date(`${data.date}T${time24}:00`)
      
      await createTour({
        mlsNumber,
        tourType: 'IN_PERSON',
        scheduledDate: dateTime.toISOString(),
        name: data.name,
        phone: data.phone,
        email: data.email,
        preApproval: data.preApproval,
        notes: data.message || undefined,
      });

      toast({
        title: "Tour Scheduled",
        description: "Your tour has been scheduled successfully. You'll receive a confirmation email shortly.",
        variant: "default",
      });

      // Reset form and close modal
      reset({
        preApproval: false,
        date: '',
        availability: undefined,
        name: '',
        phone: '',
        email: '',
        message: "I'm looking forward to touring with you!",
      });
      setStep(1);
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to schedule tour. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handlePrevDates = () => {
    if (dateOffset > 0) {
      setDateOffset(dateOffset - 1);
    }
  };

  const handleNextDates = () => {
    if (dateOffset + 6 < dates.length) {
      setDateOffset(dateOffset + 1);
    }
  };

  const handleNext = () => {
    // Validate step 1 fields before proceeding
    if (!selectedDate || !selectedAvailability) {
      toast({
        title: "Please complete all fields",
        description: "Please select date and availability before continuing.",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const propertyImage = property?.images?.imageUrl || property?.images?.allImages?.[0] || '';
  const propertyPrice = property?.listPrice || 0;
  const propertyAddress = property?.address?.location || '';
  const bedrooms = property?.details?.numBedrooms || 0;
  const bathrooms = property?.details?.numBathrooms || 0;
  const sqft = property?.details?.sqft || property?.lot?.squareFeet || 0;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        setStep(1);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 flex flex-col bg-white [&>button[class*='absolute']]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Schedule Tour</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setStep(1);
              onOpenChange(false);
            }}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 ? (
              <>
                {/* Property Overview */}
                {property && (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <div className="flex gap-4">
                      {propertyImage && (
                        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={propertyImage}
                            alt="Property"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-2xl font-bold mb-1">
                          {formatPrice(propertyPrice)}
                        </div>
                        {propertyAddress && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{propertyAddress}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          {bedrooms > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Bed className="h-4 w-4 text-muted-foreground" />
                              <span>{bedrooms} {bedrooms === 1 ? 'Bed' : 'Beds'}</span>
                            </div>
                          )}
                          {bathrooms > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Bath className="h-4 w-4 text-muted-foreground" />
                              <span>{bathrooms} {bathrooms === 1 ? 'Bath' : 'Baths'}</span>
                            </div>
                          )}
                          {(typeof sqft === 'number' ? sqft > 0 : Number(sqft) > 0) && (
                            <div className="flex items-center gap-1.5">
                              <Maximize2 className="h-4 w-4 text-muted-foreground" />
                              <span>{typeof sqft === 'number' ? sqft.toLocaleString() : sqft} sqft</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Date Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium">Select Date</h3>
                    <div className="flex items-center gap-1">
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleNextDates}
                        disabled={dateOffset + 6 >= dates.length}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {visibleDates.map((dateInfo) => {
                      const isSelected = selectedDate === dateInfo.fullDate;
                      return (
                        <button
                          key={dateInfo.fullDate}
                          type="button"
                          onClick={() => setValue('date', dateInfo.fullDate)}
                          className={cn(
                            'relative py-4 px-3 rounded-xl border-2 transition-all',
                            isSelected
                              ? 'border-secondary bg-secondary/10'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary" />
                          )}
                          <div className={cn(
                            'text-xs font-medium text-center mb-1',
                            isSelected ? 'text-secondary' : 'text-gray-900'
                          )}>
                            {dateInfo.day}
                          </div>
                          <div className={cn(
                            'text-base text-center',
                            isSelected ? 'text-secondary font-medium' : 'text-gray-600'
                          )}>
                            {dateInfo.month} {dateInfo.date}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.date && (
                    <div className="flex items-center gap-1 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.date.message}</span>
                    </div>
                  )}
                </div>

                {/* Availability Selection */}
                <div className="space-y-3">
                  <h3 className="text-base font-medium">When are you available?</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'morning', label: 'Morning', time: '8am - 12pm' },
                      { value: 'afternoon', label: 'Afternoon', time: '12pm - 5pm' },
                      { value: 'evening', label: 'Evening', time: '5pm - 8pm' },
                    ].map((option) => {
                      const isSelected = selectedAvailability === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setValue('availability', option.value as 'morning' | 'afternoon' | 'evening')}
                          className={cn(
                            'py-4 px-3 rounded-lg border-2 transition-all text-left',
                            isSelected
                              ? 'border-secondary bg-secondary/10'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          )}
                        >
                          <div className={cn(
                            'text-base font-semibold mb-1',
                            isSelected ? 'text-gray-900' : 'text-gray-900'
                          )}>
                            {option.label}
                          </div>
                          <div className="text-sm text-gray-500">
                            {option.time}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.availability && (
                    <div className="flex items-center gap-1 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.availability.message}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Name and Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Input
                      id="name"
                      label="Full Name"
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
                    className={cn('min-h-[100px]', errors.message && '!border-destructive')}
                  />
                  {errors.message && (
                    <div className="flex items-center gap-1 text-destructive text-sm mt-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.message.message}</span>
                    </div>
                  )}
                </div>

                {/* Pre-approval Checkbox */}
                <div className="flex items-start space-x-2">
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
              </>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex items-center justify-between gap-4">
          {step === 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground py-6 text-base font-semibold rounded-lg"
            >
              Next
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1 py-6 text-base font-semibold rounded-lg"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                onClick={handleSubmit(onSubmit)}
                disabled={isCreating}
                className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground py-6 text-base font-semibold rounded-lg disabled:opacity-50"
              >
                {isCreating ? 'Scheduling...' : 'Schedule Tour'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleTourModal;
