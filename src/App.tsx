import './App.scss';
import NavigationContextProvider from "./context/NavigationContext";
import Dashboard from "./components/Dashboard";
import AppBar from "./components/ui/AppBar";

function App() {
  return (
    <NavigationContextProvider initialPage="gdp">
      <AppBar />
      <Dashboard />
    </NavigationContextProvider>
  );
}

export default App;
