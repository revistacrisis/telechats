import { createContext, useState } from 'react';

export const MainContext = createContext({ state: { editing: false }, setState: () => { } })
export default function StateProvider({ children }) {
    const [state, setState] = useState({ editing: false })

    return (
        <MainContext.Provider value={{ state, setState }}>
            {children}
        </MainContext.Provider>
    )
}

