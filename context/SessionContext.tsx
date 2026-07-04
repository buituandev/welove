import React, { createContext, useContext } from 'react';

interface SessionContextValue {
    session: any;
    /** undefined = still determining; true = has profile; false = needs onboarding */
    hasProfile: boolean | undefined;
}

const SessionContext = createContext<SessionContextValue>({
    session: null,
    hasProfile: undefined,
});

export const SessionProvider: React.FC<{
    children: React.ReactNode;
    session: any;
    hasProfile: boolean | undefined;
}> = ({ children, session, hasProfile }) => (
    <SessionContext.Provider value={{ session, hasProfile }}>
        {children}
    </SessionContext.Provider>
);

export const useSession = () => useContext(SessionContext);
