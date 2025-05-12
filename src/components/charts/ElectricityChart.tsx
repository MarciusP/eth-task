import React, { useState, useContext, useEffect, useMemo } from "react";
import Plot from "react-plotly.js";
import { NavigationContext } from "../../context/NavigationContext";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Box from "@mui/material/Box";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';
import type { 
    ParseSuccessMessage, 
    AggregationRequest, 
    AggregatedPlotData, 
    FromWorkerMessage, 
    ToWorkerMessage
} from "../../workers/workerTypes";
import type { PlotData } from "plotly.js";
import type { GenerationSchema } from "../../types/generation";

interface ElectricityChartProps {
  worker: Worker;
  initialMetadata: ParseSuccessMessage;
  schema: GenerationSchema | null;
}

const chartTypes = [
    { key: 'stacked-bar', name: 'Stacked Bar Chart' },
    { key: 'line', name: 'Line Chart' },
    { key: 'stacked-area', name: 'Stacked Area Chart' }
];

const ElectricityChart: React.FC<ElectricityChartProps> = ({ worker, initialMetadata, schema }) => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("ElectricityChart must be used within a NavigationContextProvider");
  }
  const { isExpertMode, electricityAggregation, setElectricityAggregation } =
    context;

  const [plotDataFromWorker, setPlotDataFromWorker] = useState<AggregatedPlotData | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const [selectedCountries, setSelectedCountries] = useState<string[]>(initialMetadata.availableCountries);
  const [availableCountries, setAvailableCountries] = useState<string[]>(initialMetadata.availableCountries);
  const [currentChartTypeIndex, setCurrentChartTypeIndex] = useState<number>(0);

  const effectiveAggregationLevel = isExpertMode ? electricityAggregation : 'yearly';

  useEffect(() => {
    if (!worker) return;

    setLastError(null);
    setIsProcessing(true);
    const requestPayload: AggregationRequest = {
      aggregationLevel: effectiveAggregationLevel,
      selectedCountries: selectedCountries,
    };
    
    const message: ToWorkerMessage = {
        type: "AGGREGATE", 
        payload: requestPayload 
    };

    worker.postMessage(message);

  }, [worker, effectiveAggregationLevel, selectedCountries]);

  useEffect(() => {
    if (!worker) return;

    const handleWorkerMessage = (event: MessageEvent<FromWorkerMessage>) => {
      setLastError(null);
      
      switch (event.data.type) {
          case "AGGREGATION_RESULT":
              setPlotDataFromWorker(event.data.payload);
              setIsProcessing(false);
              break;
          case "AGGREGATION_ERROR":
              console.error("Chart: Worker reported aggregation error:", event.data.error);
              setLastError(event.data.error);
              setPlotDataFromWorker(null);
              setIsProcessing(false);
              break;
          case "PARSE_ERROR":
              console.error("Chart: Worker reported parse error:", event.data.error);
              setLastError(event.data.error);
              setPlotDataFromWorker(null);
              setIsProcessing(false);
              break;
          case "PARSE_SUCCESS": 
              setAvailableCountries(event.data.availableCountries);
              break; 
      }
    };

    worker.addEventListener('message', handleWorkerMessage);

    const initialRequestPayload: AggregationRequest = {
        aggregationLevel: effectiveAggregationLevel,
        selectedCountries: selectedCountries,
    };
    const initialMessage: ToWorkerMessage = { type: "AGGREGATE", payload: initialRequestPayload };
    worker.postMessage(initialMessage);
    
    return () => {
      worker.removeEventListener('message', handleWorkerMessage);
    };
  }, [worker]);

  const handleCountryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const countryId = event.target.name;
    setSelectedCountries(prev => 
      event.target.checked 
        ? [...prev, countryId]
        : prev.filter(id => id !== countryId)
    );
  };

  const handlePrevChartType = () => {
    setCurrentChartTypeIndex(prev => (prev - 1 + chartTypes.length) % chartTypes.length);
  };

  const handleNextChartType = () => {
    setCurrentChartTypeIndex(prev => (prev + 1) % chartTypes.length);
  };

  const handleSelectChartType = (index: number) => {
    setCurrentChartTypeIndex(index);
  };

  const { chartDataForPlot, chartLayoutUpdates } = useMemo(() => {
    if (!plotDataFromWorker) return { chartDataForPlot: [], chartLayoutUpdates: {} };

    const currentChartTypeKey = chartTypes[currentChartTypeIndex].key;
    let finalTraces: Partial<PlotData>[] = [];
    const layoutUpdates: Partial<Plotly.Layout> = { 
        barmode: undefined, 
        legend: { traceorder: 'normal' },
        yaxis: { title: { text: "Generation (MWh)" }, range: undefined } // Reset yaxis
    };

    switch (currentChartTypeKey) {
        case 'line':
            finalTraces = plotDataFromWorker.map(trace => ({
                ...trace,
                type: 'scattergl',
                mode: 'lines+markers',
                stackgroup: undefined,
                fill: undefined,
            }));
            break;
        case 'stacked-area':
            // Calculate totals for each x point for normalization
            const totals: { [x: string]: number } = {};
            plotDataFromWorker.forEach(trace => {
                // Ensure x and y are arrays before processing
                if (!Array.isArray(trace.x) || !Array.isArray(trace.y)) return; 

                trace.x.forEach((xVal, i) => {
                    const xKey = String(xVal); // Ensure consistent key type
                    if (!totals[xKey]) totals[xKey] = 0;
                    // Ensure y value is treated as a number
                    const yVal = trace.y?.[i];
                    totals[xKey] += Number(yVal) || 0;
                });
            });

            finalTraces = plotDataFromWorker
                .filter(trace => Array.isArray(trace.x) && Array.isArray(trace.y)) // Filter out traces with invalid data
                .map((trace, index) => {
                    // We know x and y are arrays here due to filter
                    const traceX = trace.x as Plotly.Datum[]; 
                    const traceY = trace.y as Plotly.Datum[];

                    // Normalize y values
                    const normalizedY = traceX.map((xVal, i) => {
                        const xKey = String(xVal);
                        const total = totals[xKey];
                        const yVal = traceY[i];
                        return total > 0 ? ((Number(yVal) || 0) / total) * 100 : 0;
                    });

                    // Generate text for hover info (ensure it's string[])
                    const hoverText = traceY.map((origY, i) => { 
                        const xKey = String(traceX[i]);
                        const total = totals[xKey];
                        const percentage = total > 0 ? (((Number(origY) || 0) / total) * 100).toFixed(1) + '%' : '0.0%';
                        return `Value: ${(Number(origY) || 0).toFixed(0)} MWh (${percentage})`;
                    }) as string[]; // Assert type as string[]

                    return {
                        ...trace,
                        x: traceX, // Use the asserted array
                        y: normalizedY,
                        text: hoverText, // Use the asserted string array
                        type: 'scatter',
                        mode: 'lines',
                        fill: index === 0 ? 'tozeroy' : 'tonexty',
                        stackgroup: 'areaStackGroup', // Use stackgroup for correct stacking behavior
                        hoverinfo: 'all', // Try 'all' hoverinfo as 'x+text+name' causes type issues
                    };
            });
            layoutUpdates.yaxis = { title: { text: "Contribution (%)" }, range: [0, 100] };
            break;
        case 'stacked-bar':
        default:
            finalTraces = plotDataFromWorker.map(trace => ({
                ...trace,
                type: 'bar',
                stackgroup: undefined,
                fill: undefined,
            }));
            layoutUpdates.barmode = 'stack';
            break;
    }
    return { chartDataForPlot: finalTraces, chartLayoutUpdates: layoutUpdates };
  }, [plotDataFromWorker, currentChartTypeIndex]);

  if (lastError) {
      return <p style={{ color: "red" }}>Error processing electricity data: {lastError}</p>;
  }
  
  if (!plotDataFromWorker && isProcessing) {
      return <p>Processing electricity data in background...</p>;
  }

  const noDataMessage = selectedCountries.length > 0 && (!plotDataFromWorker || plotDataFromWorker.length === 0) 
    ? <p>No Electricity Generation data available for the selected countries or filters.</p> 
    : null;

  const getTitleAndXAxis = () => {
    const baseTitle = schema?.title || "Electricity Generation by Technology";
    const currentViewName = chartTypes[currentChartTypeIndex].name;
    let title = `${baseTitle} (${currentViewName})`;
    let xAxisTitle = "Period";
    if (effectiveAggregationLevel === "monthly") {
      title = "Monthly " + title;
      xAxisTitle = "Month";
    } else if (effectiveAggregationLevel === "daily") {
      title = "Daily " + title;
      xAxisTitle = "Date";
    } else {
      xAxisTitle = "Year";
    }
    return { chartTitle: title, xAxisLabel: xAxisTitle };
  };

  const { chartTitle, xAxisLabel } = getTitleAndXAxis();

  // Determine Y-axis title based on schema and chart type
  let yAxisDynamicTitle = `Generation (${schema?.valueField?.unit || 'MWh'})`;
  if (chartTypes[currentChartTypeIndex].key === 'stacked-area' && chartLayoutUpdates.yaxis?.range?.[1] === 100) {
    // Safely access the text property if title exists
    const normalizedTitle = chartLayoutUpdates.yaxis?.title?.text;
    if (normalizedTitle) { 
      yAxisDynamicTitle = normalizedTitle; // Use the title from normalized layout ('Contribution (%)')
    } // Otherwise, fallback to the default title defined above
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '100%' }}>
      {isExpertMode && (
        <Box sx={{ marginBottom: "20px", textAlign: "center" }}>
          <ButtonGroup variant="outlined" aria-label="Electricity Aggregation Level">
            <Button
              onClick={() => setElectricityAggregation("daily")} 
              disabled={effectiveAggregationLevel === "daily"} 
            >
              Daily
            </Button>
            <Button
              onClick={() => setElectricityAggregation("monthly")}
              disabled={effectiveAggregationLevel === "monthly"}
            >
              Monthly
            </Button>
            <Button
              onClick={() => setElectricityAggregation("yearly")}
              disabled={effectiveAggregationLevel === "yearly"}
            >
              Yearly
            </Button>
          </ButtonGroup>
        </Box>
      )}

      {noDataMessage}

      {/* Chart Area with relative positioning for overlay */}
      <Box sx={{ width: '95%', height: '600px', position: 'relative', marginBottom: '20px' }}>
        {/* Loading Indicator Overlay - shown only during updates (when plotData exists but isProcessing is true) */}
        {isProcessing && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent overlay
            zIndex: 10, // Ensure it's above the plot
          }}>
            <CircularProgress />
          </Box>
        )}
        <Plot
          data={chartDataForPlot as any}
          layout={{
            title: { text: chartTitle, x: 0.5, xanchor: 'center' },
            xaxis: {
              title: { text: xAxisLabel },
              type: "category" as const,
            },
            yaxis: { 
                title: { text: yAxisDynamicTitle },
                range: chartLayoutUpdates.yaxis?.range 
            },
            barmode: chartLayoutUpdates.barmode,
            legend: { traceorder: 'normal' }
          }}
          style={{ width: "100%", height: "100%" }} // Use 100% to fill container Box
          config={{ responsive: true }}
        />
      </Box>

      {/* Chart Type Switcher and Info Icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', gap: 1 }}>
        <IconButton onClick={handlePrevChartType} size="small" aria-label="Previous chart type">
          <ArrowBackIosNewIcon fontSize="inherit" />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {chartTypes.map((type, index) => (
                <Box
                    key={type.key}
                    onClick={() => handleSelectChartType(index)}
                    sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: currentChartTypeIndex === index ? 'primary.main' : 'grey.400',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s',
                        '&:hover': {
                            backgroundColor: currentChartTypeIndex === index ? 'primary.dark' : 'grey.500',
                        }
                    }}
                    aria-label={`Select ${type.name}`}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && handleSelectChartType(index)}
                 />
            ))}
        </Box>
        <IconButton onClick={handleNextChartType} size="small" aria-label="Next chart type">
          <ArrowForwardIosIcon fontSize="inherit" />
        </IconButton>
        {schema?.description && (
          <Tooltip title={schema.description} arrow>
            <IconButton size="small" aria-label="Dataset description">
              <InfoIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Typography variant="caption" display="block" gutterBottom sx={{ mb: 2 }}>
         Current view: {chartTypes[currentChartTypeIndex].name}
      </Typography>

      <Box sx={{ padding: '10px', border: '1px solid lightgray', borderRadius: '4px', width: 'fit-content' }}>
        <Typography variant="subtitle1" gutterBottom>
          Filter Countries:
        </Typography>
        <FormGroup row>
          {availableCountries.map(countryId => (
            <FormControlLabel
              key={countryId}
              control={
                <Checkbox 
                  checked={selectedCountries.includes(countryId)}
                  onChange={handleCountryChange}
                  name={countryId} 
                />
              }
              label={countryId} 
            />
          ))}
        </FormGroup>
      </Box>
    </Box>
  );
};

export default ElectricityChart;
