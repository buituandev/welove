import React, { createContext, ReactNode, useContext, useState } from "react";

interface StatusBarContextType {
    showStatusBarFade: boolean;
    setShowStatusBarFade: (show: boolean) => void;
}

const StatusBarContext = createContext<StatusBarContextType | undefined>(undefined);

export const StatusBarProvider = ({ children }: { children: ReactNode }) => {
    const [showStatusBarFade, setShowStatusBarFade] = useState(true);

    return (
        <StatusBarContext.Provider value={{ showStatusBarFade, setShowStatusBarFade }}>
            {children}
        </StatusBarContext.Provider>
    );
};

export const useStatusBar = () => {
    const context = useContext(StatusBarContext);
    if (!context) {
        throw new Error("useStatusBar must be used within a StatusBarProvider");
    }
    return context;
};

