"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell } from "lucide-react";

export const FilterBar = () => {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Select defaultValue="for-sale">
        <SelectTrigger className="w-[140px] bg-white">
          <SelectValue placeholder="For Sale" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="for-sale">For Sale</SelectItem>
          <SelectItem value="for-rent">For Rent</SelectItem>
          <SelectItem value="sold">Sold</SelectItem>
          <SelectItem value="pre-con">Pre-Construction</SelectItem>
        </SelectContent>
      </Select>

      <Select>
        <SelectTrigger className="w-[140px] bg-white">
          <SelectValue placeholder="Price" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any Price</SelectItem>
          <SelectItem value="under-500k">Under $500K</SelectItem>
          <SelectItem value="500k-750k">$500K - $750K</SelectItem>
          <SelectItem value="750k-1m">$750K - $1M</SelectItem>
          <SelectItem value="over-1m">Over $1M</SelectItem>
        </SelectContent>
      </Select>

      <Select>
        <SelectTrigger className="w-[160px] bg-white">
          <SelectValue placeholder="More Filters" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="beds">Bedrooms</SelectItem>
          <SelectItem value="baths">Bathrooms</SelectItem>
          <SelectItem value="sqft">Square Footage</SelectItem>
          <SelectItem value="type">Property Type</SelectItem>
        </SelectContent>
      </Select>

      <Button className="gap-2">
        <Bell className="h-4 w-4" />
        Get Alerts
      </Button>
    </div>
  );
};

