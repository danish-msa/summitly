"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { FaqItem } from "@/components/common/FAQ";

interface FAQFieldProps {
  value: FaqItem[];
  onChange: (faqs: FaqItem[]) => void;
  label?: string;
  description?: string;
}

export const FAQField: React.FC<FAQFieldProps> = ({
  value = [],
  onChange,
  label = "FAQs",
  description = "Add frequently asked questions for this page. These will be displayed along with the default pre-construction FAQs.",
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const addFAQ = () => {
    const newFAQ: FaqItem = {
      id: `faq-${Date.now()}-${Math.random()}`,
      question: "",
      answer: "",
      icon: null,
    };
    onChange([...value, newFAQ]);
    setExpandedIndex(value.length);
  };

  const removeFAQ = (index: number) => {
    const newFAQs = value.filter((_, i) => i !== index);
    onChange(newFAQs);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const updateFAQ = (index: number, field: keyof FaqItem, fieldValue: string | React.ReactNode) => {
    const newFAQs = [...value];
    newFAQs[index] = {
      ...newFAQs[index],
      [field]: fieldValue,
    };
    onChange(newFAQs);
  };

  const moveFAQ = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= value.length) return;
    const newFAQs = [...value];
    const [moved] = newFAQs.splice(fromIndex, 1);
    newFAQs.splice(toIndex, 0, moved);
    onChange(newFAQs);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{label}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <Button type="button" onClick={addFAQ} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {value.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No FAQs added yet. Click "Add FAQ" to get started.</p>
          </div>
        ) : (
          value.map((faq, index) => (
            <Card key={faq.id} className="border-2">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    className="mt-2 cursor-move text-muted-foreground hover:text-foreground"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const handleMouseMove = (e: MouseEvent) => {
                        const rect = (e.currentTarget as HTMLElement)?.closest('.faq-item')?.getBoundingClientRect();
                        if (rect) {
                          const newIndex = Math.floor((e.clientY - rect.top) / 80);
                          if (newIndex !== index && newIndex >= 0 && newIndex < value.length) {
                            moveFAQ(index, newIndex);
                          }
                        }
                      };
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                      }, { once: true });
                    }}
                  >
                    <GripVertical className="h-5 w-5" />
                  </button>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label>Question</Label>
                      <Input
                        value={faq.question}
                        onChange={(e) => updateFAQ(index, "question", e.target.value)}
                        placeholder="Enter the question..."
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Answer</Label>
                      <Textarea
                        value={faq.answer}
                        onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                        placeholder="Enter the answer..."
                        rows={3}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFAQ(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};

