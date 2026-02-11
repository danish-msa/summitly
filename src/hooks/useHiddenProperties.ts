import { useState, useCallback } from 'react';

interface UseHiddenPropertiesReturn {
  hiddenProperties: Set<string>;
  hideProperty: (mlsNumber: string) => void;
  showProperty: (mlsNumber: string) => void;
  isPropertyHidden: (mlsNumber: string) => boolean;
  getVisibleProperties: <T extends { mlsNumber: string }>(properties: T[]) => T[];
  clearHiddenProperties: () => void;
}

/**
 * Custom hook to manage hidden properties across the application
 * This follows React's "lifting state up" pattern by centralizing the hide state
 */
export const useHiddenProperties = (): UseHiddenPropertiesReturn => {
  const [hiddenProperties, setHiddenProperties] = useState<Set<string>>(new Set());

  const hideProperty = useCallback((mlsNumber: string) => {
    setHiddenProperties(prev => new Set([...prev, mlsNumber]));
  }, []);

  const showProperty = useCallback((mlsNumber: string) => {
    setHiddenProperties(prev => {
      const newSet = new Set(prev);
      newSet.delete(mlsNumber);
      return newSet;
    });
  }, []);

  const isPropertyHidden = useCallback((mlsNumber: string) => {
    return hiddenProperties.has(mlsNumber);
  }, [hiddenProperties]);

  const getVisibleProperties = useCallback(<T extends { mlsNumber: string }>(properties: T[]): T[] => {
    return properties.filter(property => !hiddenProperties.has(property.mlsNumber));
  }, [hiddenProperties]);

  const clearHiddenProperties = useCallback(() => {
    setHiddenProperties(new Set());
  }, []);

  return {
    hiddenProperties,
    hideProperty,
    showProperty,
    isPropertyHidden,
    getVisibleProperties,
    clearHiddenProperties
  };
};
