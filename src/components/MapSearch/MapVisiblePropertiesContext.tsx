"use client";

import React, { createContext, useContext, useRef, useCallback } from 'react';
import { PropertyListing } from '@/lib/types';

interface MapVisiblePropertiesContextType {
  onVisiblePropertiesChange: ((properties: PropertyListing[]) => void) | null;
  setOnVisiblePropertiesChange: (callback: ((properties: PropertyListing[]) => void) | null) => void;
}

// Module-level ref to store callback (works with dynamic imports)
// This is the PRIMARY method since props don't work with dynamic imports
const globalCallbackRef = { current: null as ((properties: PropertyListing[]) => void) | null };

// Export function to get global callback (for dynamic import components)
export const getGlobalCallback = () => {
  const callback = globalCallbackRef.current;
  console.log('🔍 [getGlobalCallback] Retrieved:', {
    hasCallback: !!callback,
    isFunction: typeof callback === 'function',
  });
  return callback;
};

// Export function to set global callback directly (for direct access)
export const setGlobalCallback = (callback: ((properties: PropertyListing[]) => void) | null) => {
  globalCallbackRef.current = callback;
  console.log('🌐 [MapVisiblePropertiesContext] Global callback set:', {
    type: typeof callback,
    isFunction: typeof callback === 'function',
    hasValue: !!callback,
    callbackValue: callback,
  });
  
  // Verify it was set
  setTimeout(() => {
    const verified = getGlobalCallback();
    console.log('✅ [MapVisiblePropertiesContext] Global callback verification:', {
      wasSet: verified === callback,
      isFunction: typeof verified === 'function',
    });
  }, 0);
};

const MapVisiblePropertiesContext = createContext<MapVisiblePropertiesContextType>({
  onVisiblePropertiesChange: null,
  setOnVisiblePropertiesChange: () => {},
});

export const useMapVisibleProperties = () => {
  const context = useContext(MapVisiblePropertiesContext);
  // Also check global ref as fallback
  return {
    onVisiblePropertiesChange: context.onVisiblePropertiesChange || globalCallbackRef.current,
    setOnVisiblePropertiesChange: context.setOnVisiblePropertiesChange,
  };
};

export const MapVisiblePropertiesProvider: React.FC<{
  children: React.ReactNode;
  onVisiblePropertiesChange?: (properties: PropertyListing[]) => void;
}> = ({ children, onVisiblePropertiesChange }) => {
  // Store callback in both ref and state
  const callbackRef = useRef<((properties: PropertyListing[]) => void) | null>(onVisiblePropertiesChange || null);
  const [callback, setCallback] = React.useState<((properties: PropertyListing[]) => void) | null>(
    onVisiblePropertiesChange || null
  );

  // Update both refs when prop changes - use setGlobalCallback for consistency
  React.useEffect(() => {
    const callback = onVisiblePropertiesChange || null;
    callbackRef.current = callback;
    setGlobalCallback(callback); // Use the exported function
    setCallback(callback);
    console.log('🔍 [MapVisiblePropertiesProvider] Callback updated:', {
      type: typeof onVisiblePropertiesChange,
      isFunction: typeof onVisiblePropertiesChange === 'function',
      hasValue: !!onVisiblePropertiesChange,
      globalRefAfter: !!globalCallbackRef.current,
    });
  }, [onVisiblePropertiesChange]);

  const setOnVisiblePropertiesChange = useCallback((newCallback: ((properties: PropertyListing[]) => void) | null) => {
    callbackRef.current = newCallback;
    setGlobalCallback(newCallback); // Use the exported function
    setCallback(newCallback);
  }, []);

  // Create value object with current callback
  const value = React.useMemo(() => ({
    onVisiblePropertiesChange: callback,
    setOnVisiblePropertiesChange,
  }), [callback, setOnVisiblePropertiesChange]);

  return (
    <MapVisiblePropertiesContext.Provider value={value}>
      {children}
    </MapVisiblePropertiesContext.Provider>
  );
};
