import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { jwtDecode } from "jwt-decode";
import { Neo4jApiResponse } from "./pages/graph_pages/Graph/graph-interfaces.interface";

interface GlobalContextType {
  searchText: string;
  setSearchText: (text: string) => void;
  loggedIn: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
  graphToggled: number;
  setGraphToggled: (counter: number) => void;
  logout: () => void;
  profileData: Neo4jApiResponse;
  setProfileData: (profileData: Neo4jApiResponse) => void;
}

const GlobalContext = createContext<GlobalContextType>(null);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const [searchText, setSearchText] = useState("");
  const [graphToggled, setGraphToggled] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [jwtChecked, setJwtChecked] = useState(false);
  const [profileData, setProfileData] = useState([] as unknown as Neo4jApiResponse);

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

  const logout = () => {
    localStorage.removeItem("jwt");
    setLoggedIn(false);
  };

  const value: GlobalContextType = {
    searchText,
    setSearchText,
    loggedIn,
    setLoggedIn,
    graphToggled,
    setGraphToggled,
    logout,
    profileData,
    setProfileData
  };

  return (
    <GlobalContext.Provider value={value}>
      {jwtChecked ? children : null}
    </GlobalContext.Provider>
  );
};

// eslint-disable-next-line
export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobal must be used within a GlobalProvider");
  }
  return context;
};
