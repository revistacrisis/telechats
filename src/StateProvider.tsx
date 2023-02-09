import { createContext, useState } from 'react';
import type {ReactChild} from 'react'

interface StateProviderArgs {
    children: ReactChild
}

interface State {
    editing: boolean
}

interface Context {
    state: State,
    setState: Function
}

const defaultContext: Context = {
    state: { editing: false },
    setState: (state: State) => {}
}

export const MainContext = createContext(defaultContext)
export default function StateProvider({ children }: StateProviderArgs) {
    const [state, setState] = useState({ editing: false })
    return (
        <MainContext.Provider value={{ state, setState }}>
            {children}
        </MainContext.Provider>
    )
}

