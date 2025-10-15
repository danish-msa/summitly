"use client"

import React from 'react';
import { brandColors } from '@/lib/constants/brand-colors';

/**
 * Color Palette Component
 * 
 * A visual reference component showing all brand colors
 * Useful for development and design reference
 */
export function ColorPalette() {
  const colorGroups = [
    {
      title: "Primary Brand Colors",
      colors: [
        { name: "CB BLUE", color: brandColors.cbBlue, usage: "Primary brand, CTAs" },
        { name: "CELESTIAL", color: brandColors.celestial, usage: "Secondary actions" },
        { name: "BRIGHT BLUE", color: brandColors.brightBlue, usage: "Interactive elements" }
      ]
    },
    {
      title: "Neutral Colors",
      colors: [
        { name: "MIDNIGHT", color: brandColors.midnight, usage: "Dark text, content" },
        { name: "SLATE", color: brandColors.slate, usage: "Secondary text" },
        { name: "SMOKY GRAY", color: brandColors.smokyGray, usage: "Muted text" }
      ]
    },
    {
      title: "Light Colors",
      colors: [
        { name: "MIST", color: brandColors.mist, usage: "Borders, dividers" },
        { name: "GLACIER", color: brandColors.glacier, usage: "Light backgrounds" },
        { name: "ICY BLUE", color: brandColors.icyBlue, usage: "Main background" },
        { name: "TIDE", color: brandColors.tide, usage: "Subtle highlights" }
      ]
    }
  ];

  return (
    <div className="p-6 bg-background">
      <h1 className="text-3xl font-bold text-foreground mb-8">Brand Color Palette</h1>
      
      {colorGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">{group.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.colors.map((colorInfo, colorIndex) => (
              <div
                key={colorIndex}
                className="bg-card border border-border rounded-lg p-4 shadow-sm"
              >
                <div
                  className="w-full h-16 rounded-md mb-3 border border-border"
                  style={{ backgroundColor: colorInfo.color.hex }}
                />
                <h3 className="font-semibold text-card-foreground mb-1">
                  {colorInfo.name}
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div><strong>Hex:</strong> {colorInfo.color.hex}</div>
                  <div><strong>RGB:</strong> {colorInfo.color.rgb}</div>
                  <div><strong>HSL:</strong> {colorInfo.color.hsl}</div>
                  <div className="text-xs mt-2 text-muted-foreground">
                    {colorInfo.usage}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold text-foreground mb-2">Usage Examples</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <div><strong>Theme-aware classes:</strong> <code className="bg-muted px-1 rounded">bg-primary text-primary-foreground</code></div>
          <div><strong>Direct brand colors:</strong> <code className="bg-muted px-1 rounded">bg-brand-cb-blue text-white</code></div>
          <div><strong>CSS variables:</strong> <code className="bg-muted px-1 rounded">hsl(var(--primary))</code></div>
        </div>
      </div>
    </div>
  );
}

export default ColorPalette;
