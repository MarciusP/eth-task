import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NavigationContext } from '../../context/NavigationContext';
import AppBar from '../ui/AppBar';

// Mock the context value using jest.fn()
const mockContextValue = {
  currentPage: 'gdp', // Default to GDP page
  setPage: jest.fn(),
  gdpAvailable: true,
  electricityAvailable: true,
  isExpertMode: false,
  toggleExpertMode: jest.fn(),
  electricityAggregation: 'yearly' as const, // Add 'as const' for type safety
  setElectricityAggregation: jest.fn(),
};

type MockContextType = typeof mockContextValue;

// Helper function to render AppBar with mocked context
const renderAppBar = (contextValue: MockContextType = mockContextValue) => {
  return render(
    // Cast to any needed for mock context value
    <NavigationContext.Provider value={contextValue as any}>
      <AppBar />
    </NavigationContext.Provider>
  );
};

it('renders AppBar with title', () => {
  renderAppBar();
  const titleElement = screen.getByText(/Data Visualization Task/i);
  expect(titleElement).toBeInTheDocument();
});

it('renders navigation buttons', () => {
  renderAppBar();
  const gdpButton = screen.getByRole('button', { name: /GDP/i });
  const electricityButton = screen.getByRole('button', { name: /Electricity/i });
  expect(gdpButton).toBeInTheDocument();
  expect(electricityButton).toBeInTheDocument();
});

it('renders Expert Mode switch', () => {
  renderAppBar();
  const expertModeSwitch = screen.getByRole('checkbox', { name: /Expert/i });
  expect(expertModeSwitch).toBeInTheDocument();
  expect(expertModeSwitch).not.toBeChecked(); // Based on default mock context
});

it('renders Expert Mode switch as checked when isExpertMode is true', () => {
  renderAppBar({ ...mockContextValue, isExpertMode: true });
  const expertModeSwitch = screen.getByRole('checkbox', { name: /Expert/i });
  expect(expertModeSwitch).toBeInTheDocument();
  expect(expertModeSwitch).toBeChecked();
}); 