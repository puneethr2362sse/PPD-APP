import React, { createContext, useContext, useState } from 'react';

export type ViewMode = 'desktop' | 'mobile-sim';

interface ViewModeContextType {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  toggleMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ViewMode>('desktop');

  const toggleMode = (newMode: ViewMode) => {
    setMode(newMode);
  };

  return (
    <ViewModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = (): ViewModeContextType => {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};
