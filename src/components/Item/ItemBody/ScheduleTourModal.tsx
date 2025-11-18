"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
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
import { ChevronLeft, ChevronRight, AlertCircle, Info, X, Bed, Bath, Maximize2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTours } from '@/hooks/useTours';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PropertyListing } from '@/lib/types';

const formSchema = z.object({
  tourType: z.enum(['in-person', 'live-video', 'self-guided']),
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
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

// Get ordinal suffix for date
const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

// Generate dates for the next 7 days
const generateDates = () => {
  const dates = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dayNum = date.getDate();
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const ordinal = getOrdinalSuffix(dayNum);
    
    dates.push({
      day: dayName,
      date: dayNum,
      month: monthName,
      ordinal: ordinal,
      formatted: `${dayName} ${monthName} ${dayNum}${ordinal}`,
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
  
  const visibleDates = dates.slice(dateOffset, dateOffset + 4);

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
      tourType: 'in-person',
      preApproval: false,
      message: "I'm looking forward to touring with you!",
    },
  });

  const tourType = watch('tourType');
  const selectedDate = watch('date');
  const selectedTime = watch('time');
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
      
      // Combine date and time into a single datetime
      const time24 = parseTime(data.time)
      const dateTime = new Date(`${data.date}T${time24}:00`)
      
      const tourTypeMap: Record<string, 'IN_PERSON' | 'VIDEO_CHAT' | 'SELF_GUIDED'> = {
        'in-person': 'IN_PERSON',
        'live-video': 'VIDEO_CHAT',
        'self-guided': 'SELF_GUIDED',
      };
      
      await createTour({
        mlsNumber,
        tourType: tourTypeMap[data.tourType],
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
        tourType: 'in-person',
        preApproval: false,
        date: '',
        time: '',
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
    if (dateOffset + 4 < dates.length) {
      setDateOffset(dateOffset + 1);
    }
  };

  const handleNext = () => {
    // Validate step 1 fields before proceeding
    if (!tourType || !selectedDate || !selectedTime) {
      toast({
        title: "Please complete all fields",
        description: "Please select tour type, date, and time before continuing.",
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
                  <div className="border rounded-lg p-2 bg-muted/30">
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

                {/* Tour Type */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Tour Type</Label>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setValue('tourType', 'in-person')}
                      className={cn(
                        'py-1.5 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                        tourType === 'in-person'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-background text-foreground hover:border-primary/50'
                      )}
                    >
                      In-Person
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('tourType', 'live-video')}
                      className={cn(
                        'py-1.5 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                        tourType === 'live-video'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-white text-foreground hover:border-primary/50'
                      )}
                    >
                      Live Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('tourType', 'self-guided')}
                      className={cn(
                        'py-1.5 px-3 rounded-lg border-2 text-sm font-medium transition-all',
                        tourType === 'self-guided'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-white text-foreground hover:border-primary/50'
                      )}
                    >
                      Self-guided
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
                            'py-4 px-2 rounded-lg border-2 transition-all',
                            selectedDate === dateInfo.fullDate
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-border bg-white hover:border-accent/50'
                          )}
                        >
                          <div className="text-2xl font-bold text-center mb-2">{dateInfo.day}</div>
                          <div className="text-xs text-muted-foreground text-center">{dateInfo.month} {dateInfo.date}{dateInfo.ordinal}</div>
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
              </>
            ) : (
              <>
                {/* Name and Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-sm">Full Name</Label>
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

                {/* Message */}
                <div className="space-y-1">
                  <Label htmlFor="message" className="text-sm">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Message"
                    {...register('message')}
                    className={cn('rounded-lg bg-white min-h-[100px]', errors.message && 'border-destructive')}
                  />
                  {errors.message && (
                    <div className="flex items-center gap-1 text-destructive text-sm">
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
