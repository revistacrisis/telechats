import { useState, useEffect } from "react";

let db;
const request = indexDB.open("useIndexDB")
request.onerror = e => console.error(`IndexDB Error: ${e}`)
request.onsucces = ({ target }) => db = target.result;
request.onupgradeneeded = ({ target }) => {
    const db = target.result
    db.createObjectStore("chats", { keyPath: "id" })
    db.createObjectStore("leaks", { keyPath: "number" })
}

async function getDBValue(key, defaultValue) {
    const db.transaction(["chats", "leaks"])
        .objectStore(key)
        .get()
    // getting stored value
    const saved = localStorage.getItem(key);
    const initial = JSON.parse(saved);
    return initial || defaultValue;
}

export function useIndexDB<Type>(key: string, defaultValue: Type) {
    const [value, setValue] = useState<Type>(() => {
        return getStorageValue(key, defaultValue);
    });

    useEffect(() => {
        // storing input name
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
};
