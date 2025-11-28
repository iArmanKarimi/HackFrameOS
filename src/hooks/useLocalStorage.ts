/**
 * Custom hook for localStorage with type safety and SSR support
 */

import { useState, useCallback } from "react";

/**
 * Hook to manage localStorage state with type safety
 * @param key - localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns Tuple of [value, setValue]
 */
export function useLocalStorage<T>(
	key: string,
	initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
	const [storedValue, setStoredValue] = useState<T>(() => {
		if (typeof window === "undefined") {
			return initialValue;
		}
		try {
			const item = window.localStorage.getItem(key);
			return item ? (JSON.parse(item) as T) : initialValue;
		} catch (error) {
			console.warn(`Error reading localStorage key "${key}":`, error);
			return initialValue;
		}
	});

	const setValue = useCallback(
		(value: T | ((val: T) => T)) => {
			try {
				const valueToStore =
					value instanceof Function ? value(storedValue) : value;
				setStoredValue(valueToStore);
				if (typeof window !== "undefined") {
					window.localStorage.setItem(key, JSON.stringify(valueToStore));
				}
			} catch (error) {
				console.warn(`Error setting localStorage key "${key}":`, error);
			}
		},
		[key, storedValue]
	);

	return [storedValue, setValue];
}

/**
 * Hook for simple boolean localStorage values (like flags)
 * @param key - localStorage key
 * @param initialValue - Initial boolean value
 * @returns Tuple of [value, setValue]
 */
export function useLocalStorageFlag(
	key: string,
	initialValue: boolean = false
): [boolean, (value: boolean) => void] {
	const [value, setValue] = useState<boolean>(() => {
		if (typeof window === "undefined") {
			return initialValue;
		}
		try {
			const item = window.localStorage.getItem(key);
			return item === "true";
		} catch {
			return initialValue;
		}
	});

	const setFlag = useCallback(
		(newValue: boolean) => {
			setValue(newValue);
			try {
				if (typeof window !== "undefined") {
					window.localStorage.setItem(key, String(newValue));
				}
			} catch (error) {
				console.warn(`Error setting localStorage flag "${key}":`, error);
			}
		},
		[key]
	);

	return [value, setFlag];
}
