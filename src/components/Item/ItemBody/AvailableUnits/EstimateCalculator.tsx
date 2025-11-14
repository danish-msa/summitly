import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Unit } from "./AvailableUnits";

interface EstimateCalculatorProps {
  allUnits: Unit[];
  selectedUnit: Unit;
}

export function EstimateCalculator({ allUnits, selectedUnit }: EstimateCalculatorProps) {
  const [selectedUnitId, setSelectedUnitId] = useState(selectedUnit.id);
  const [catRent, setCatRent] = useState(false);
  const [dogRent, setDogRent] = useState(false);

  useEffect(() => {
    setSelectedUnitId(selectedUnit.id);
  }, [selectedUnit.id]);

  const currentUnit = allUnits.find((u) => u.id === selectedUnitId) || selectedUnit;
  const baseRent = currentUnit.price;
  const catFee = catRent ? 100 : 0;
  const dogFee = dogRent ? 100 : 0;
  const monthlyTotal = baseRent + catFee + dogFee;

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Estimate Your Total</h3>
      
      <div className="space-y-4 bg-muted/50 p-6 rounded-lg">
        <div>
          <Label htmlFor="unit-select" className="text-sm font-medium mb-2 block">
            Select Unit
          </Label>
          <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
            <SelectTrigger id="unit-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allUnits.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  Unit {unit.id} - ${unit.price.toLocaleString()}/mo
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3 pt-4">
          <h4 className="font-semibold text-sm">Monthly rent, fees & charges</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Required</p>
                <p className="text-sm text-muted-foreground">
                  Rent ${baseRent.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on a 12-month lease and includes fixed, required monthly fees.
                </p>
              </div>
              <span className="font-semibold">${baseRent.toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t">
              <p className="font-medium mb-3">Optional</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cat-rent"
                      checked={catRent}
                      onCheckedChange={(checked) => setCatRent(checked as boolean)}
                    />
                    <Label htmlFor="cat-rent" className="text-sm cursor-pointer">
                      Cat rent ($100)
                    </Label>
                  </div>
                  <span className="text-sm font-medium">${catFee}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="dog-rent"
                      checked={dogRent}
                      onCheckedChange={(checked) => setDogRent(checked as boolean)}
                    />
                    <Label htmlFor="dog-rent" className="text-sm cursor-pointer">
                      Dog rent ($100)
                    </Label>
                  </div>
                  <span className="text-sm font-medium">${dogFee}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t font-semibold">
              <span>Estimated monthly total</span>
              <span className="text-primary text-lg">
                ${monthlyTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-semibold text-sm">One-time fees & charges</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Required</p>
                <p className="text-xs text-muted-foreground">Security deposit</p>
              </div>
              <span className="text-sm font-medium">$0</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Optional</p>
                <p className="text-xs text-muted-foreground">Pet deposit</p>
              </div>
              <span className="text-sm font-medium text-muted-foreground">Contact</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Estimated total</span>
              <span className="text-sm font-medium text-muted-foreground">Contact</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Contact property for amount
          </p>
        </div>
      </div>
    </div>
  );
}

