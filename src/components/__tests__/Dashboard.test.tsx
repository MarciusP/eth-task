import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { NavigationContext } from "../../context/NavigationContext";
import Dashboard from "../Dashboard";
import { jest } from "@jest/globals"; // Correct way to import jest for mocking

// Mock the chart components to avoid Plotly rendering issues without canvas
jest.mock("../charts/GDPChart", () => () => (
  <div data-testid="mock-gdp-chart">Mock GDP Chart</div>
));
jest.mock("../charts/ElectricityChart", () => () => (
  <div data-testid="mock-electricity-chart">Mock Electricity Chart</div>
));

// Mock the entire dataLoader module *before* Dashboard or other imports that might use it
jest.mock("../../services/dataLoader", () => ({
  loadGDPSchema: jest.fn(),
  loadGDPData: jest.fn(),
  loadElectricityData: jest.fn(),
  loadElectricitySchema: jest.fn(),
}));

// Now, import the mocked functions (or the entire module if preferred)
import {
  loadGDPData,
  loadGDPSchema,
  loadElectricityData,
  loadElectricitySchema,
} from "../../services/dataLoader";
import * as dataLoader from "../../services/dataLoader"; // Import the mocked module for type usage

// Mock the context value
const mockGdpContextValue = {
  currentPage: "gdp" as const,
  setPage: jest.fn(),
  gdpAvailable: false, // Set to false as we are testing unavailable GDP data
  setGdpAvailable: jest.fn(), // Mocked as it's part of the real context
  electricityAvailable: true, // Assume electricity is available to isolate the test
  setElectricityAvailable: jest.fn(),
  isExpertMode: false,
  toggleExpertMode: jest.fn(),
  electricityAggregation: "yearly" as const,
  setElectricityAggregation: jest.fn(),
};

describe("Dashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Use the type of the original function for jest.Mock
    (
      loadGDPSchema as jest.Mock<typeof dataLoader.loadGDPSchema>
    ).mockResolvedValue(null);
    (loadGDPData as jest.Mock<typeof dataLoader.loadGDPData>).mockResolvedValue(
      []
    );

    // Mock loadElectricityData
    const mockWorker = {
      postMessage: jest.fn(),
      terminate: jest.fn(),
      onmessage: null,
      onerror: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    } as unknown as Worker;

    // The type of the resolved value for loadElectricityData
    const mockElectricityResult: Awaited<
      ReturnType<typeof dataLoader.loadElectricityData>
    > = {
      worker: mockWorker,
      initialData: {
        type: "PARSE_SUCCESS",
        availableCountries: [],
        dateRange: { min: "", max: "" },
        numberOfRecords: 0,
      },
    };

    (
      loadElectricityData as jest.Mock<typeof dataLoader.loadElectricityData>
    ).mockResolvedValue(mockElectricityResult);
    (
      loadElectricitySchema as jest.Mock<
        typeof dataLoader.loadElectricitySchema
      >
    ).mockResolvedValue(null);
  });

  it('renders "GDP data is currently unavailable" when GDP page is active and GDP data is empty', async () => {
    render(
      <NavigationContext.Provider value={mockGdpContextValue as any}>
        <Dashboard />
      </NavigationContext.Provider>
    );

    // Wait for the message to appear as data loading is async
    await waitFor(() => {
      expect(
        screen.getByText(/GDP data is currently unavailable./i)
      ).toBeInTheDocument();
    });
  });
});
