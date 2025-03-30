import React, { createContext, useState, useContext, ReactNode } from 'react';

interface GlobalContextType {
  searchText: string;
  setSearchText: (text: string) => void;
  loggedIn: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
}

const GlobalContext = createContext<GlobalContextType>(null);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const [searchText, setSearchText] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const value: GlobalContextType = {
    searchText,
    setSearchText,
    loggedIn,
    setLoggedIn,
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};