import React, { useContext } from "react";
import "./AppBar.scss";
import { NavigationContext } from "../../context/NavigationContext";
import CustomAppBarButton from "./CustomAppBarButton";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";

interface AppBarProps {}

const AppBar: React.FC<AppBarProps> = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("AppBar must be used within a NavigationContextProvider");
  }
  const {
    currentPage,
    setCurrentPage,
    gdpAvailable,
    electricityAvailable,
    isExpertMode,
    setIsExpertMode,
  } = context;

  const handleExpertModeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsExpertMode(event.target.checked);
  };

  return (
    <header className="app-bar">
      <div className="app-bar-title">Data Visualization Task</div>
      <nav className="app-bar-nav">
        <CustomAppBarButton
          text="GDP Data"
          onClick={() => setCurrentPage("gdp")}
          selected={currentPage === "gdp"}
          disabled={!gdpAvailable}
        />
        <CustomAppBarButton
          text="Electricity Generation"
          onClick={() => setCurrentPage("electricity")}
          selected={currentPage === "electricity"}
          disabled={!electricityAvailable}
        />
      </nav>
      <div className="options">
        <FormControlLabel
          control={
            <Switch
              checked={isExpertMode}
              onChange={handleExpertModeChange}
              name="expertMode"
              color="primary"
            />
          }
          labelPlacement="start"
          label="Expert"
          sx={{ color: "#213547" }}
        />
      </div>
    </header>
  );
};

export default AppBar;
