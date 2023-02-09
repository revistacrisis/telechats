import { useState, useEffect } from "react";

export function getStorageValue<Type>(key: string, defaultValue: Type) {
    // getting stored value
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;

    const initial = JSON.parse(saved);
    return initial || defaultValue;
}

export function useLocalStorage<Type>(key: string, defaultValue: Type) {
    const [value, setValue] = useState<Type>(() => {
        return getStorageValue(key, defaultValue);
    });

    useEffect(() => {
        // storing input name
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
};
