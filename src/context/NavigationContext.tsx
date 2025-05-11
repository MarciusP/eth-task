import { createContext, useState } from "react";
import type { ReactNode } from "react";

export type Page = "gdp" | "electricity";

export interface NavigationContextState {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  gdpAvailable: boolean;
  setGdpAvailable: (available: boolean) => void;
  electricityAvailable: boolean;
  setElectricityAvailable: (available: boolean) => void;
  isExpertMode: boolean;
  setIsExpertMode: (isExpert: boolean) => void;
}

export const NavigationContext = createContext<
  NavigationContextState | undefined
>(undefined);

interface NavigationContextProviderProps {
  children: ReactNode;
  initialPage?: Page;
}

const NavigationContextProvider = (props: NavigationContextProviderProps) => {
  const { children, initialPage = "gdp" } = props;
  const [currentPage, setCurrentPage] = useState<Page>(initialPage);
  const [gdpAvailable, setGdpAvailable] = useState<boolean>(false);
  const [electricityAvailable, setElectricityAvailable] =
    useState<boolean>(false);
  const [isExpertMode, setIsExpertMode] = useState<boolean>(false);

  const value = {
    currentPage,
    setCurrentPage,
    gdpAvailable,
    setGdpAvailable,
    electricityAvailable,
    setElectricityAvailable,
    isExpertMode,
    setIsExpertMode,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export default NavigationContextProvider;
