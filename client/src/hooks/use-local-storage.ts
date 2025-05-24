import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        // Check if data has expired (30 days)
        if (parsed.timestamp && Date.now() - parsed.timestamp > 30 * 24 * 60 * 60 * 1000) {
          window.localStorage.removeItem(key);
          return initialValue;
        }
        return parsed.data || initialValue;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Store with timestamp for expiration
      const dataToStore = {
        data: valueToStore,
        timestamp: Date.now()
      };
      
      window.localStorage.setItem(key, JSON.stringify(dataToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
