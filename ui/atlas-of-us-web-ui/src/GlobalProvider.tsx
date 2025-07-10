import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { jwtDecode } from "jwt-decode";

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
  const [searchText, setSearchText] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [jwtChecked, setJwtChecked] = useState(false);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      try {
        const decodedToken: { exp: number } = jwtDecode(jwt);
        const currentTime = Math.floor(Date.now() / 1000); // in seconds
        if (decodedToken?.exp < currentTime) {
          setLoggedIn(false);
          localStorage.removeItem("jwt");
        } else {
          setLoggedIn(true);
        }
      } catch {
        setLoggedIn(false);
        localStorage.removeItem("jwt");
      }
    } else {
      setLoggedIn(false);
    }
    setJwtChecked(true);
  }, [setLoggedIn]);

  const value: GlobalContextType = {
    searchText,
    setSearchText,
    loggedIn,
    setLoggedIn,
  };

  return (
    <GlobalContext.Provider value={value}>
      {jwtChecked ? children : null}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobal must be used within a GlobalProvider");
  }
  return context;
};
