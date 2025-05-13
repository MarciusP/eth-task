# ETH Task - Data Visualization Dashboard

This project is a web application built to visualize GDP and Electricity Generation data for Austria (AT), Germany (DE), and Switzerland (CH), based on provided datasets and schemas. It was developed as part of a technical task.

The application allows users to explore GDP trends over time and analyze electricity generation patterns with various aggregation levels and chart types.

## Technologies Used

*   **Frontend:** React, TypeScript, Vite
*   **Charting:** Plotly.js (`react-plotly.js`)
*   **UI Components:** Material UI (MUI)
*   **Styling:** SCSS
*   **Data Parsing:** PapaParse (CSV), Parquet-Wasm (Parquet)
*   **Performance:** Web Workers for background data processing
*   **Web Server (Production Build):** Nginx
*   **Containerization:** Docker, Docker Compose

## Features

*   **Dashboard:** Single-page application interface.
*   **GDP Visualization:** Grouped bar chart showing GDP per country over years. Uses `gdp.csv` and `gdp.json`.
*   **Electricity Visualization:**
    *   Displays electricity generation data from `generation.parquet` using `generation.json`.
    *   Multiple chart types (Grouped Bar, Stacked Bar, Normalized Stacked Area) selectable via a carousel.
    *   Data aggregation options (Yearly, Monthly, Daily) processed efficiently in a Web Worker.
    *   Country filters (AT, DE, CH) to customize the view.
    *   Loading indicators during data processing.
*   **Dynamic Content:** Chart titles, axis labels, and tooltips leverage information from the provided JSON schemas.
*   **Expert Mode:** A toggle switch (currently resets aggregation view).
*   **Dockerized Deployment:** Configured to run easily via Docker Compose.

## Project Structure

```
eth-task/
├── .dockerignore       # Files to ignore for Docker build
├── docker-compose.yml  # Docker Compose configuration
├── Dockerfile          # Dockerfile for building the app & Nginx server
├── jest.config.ts      # Jest test runner configuration
├── jest.setup.ts       # Jest setup file (e.g., for mocks)
├── nginx/              # Nginx configuration
│   └── default.conf
├── package.json        # Project dependencies and scripts
├── public/             # Static assets and data files
│   ├── gdp.csv
│   ├── gdp.json
│   ├── generation.json
│   ├── generation.parquet
│   └── parquet_wasm_bg.wasm
├── src/                # Application source code
│   ├── components/     # React components
│   │   ├── charts/
│   │   ├── ui/
│   │   └── __tests__/  # Component tests
│   │   └── Dashboard.tsx
│   ├── context/        # React Context for global state
│   ├── services/       # Data loading logic
│   ├── types/          # TypeScript type definitions
│   ├── workers/        # Web Worker code
│   ├── App.tsx         # Main application component
│   ├── index.scss      # Global styles
│   └── main.tsx        # Application entry point
├── tsconfig.json       # Base TypeScript configuration
├── tsconfig.app.json   # App-specific TypeScript configuration (used by Jest)
├── vite.config.ts      # Vite build tool configuration
└── README.md           # This file
```

## Setup and Running Locally

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   Docker Desktop

### Development Mode (using Vite)

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <repository-folder>
    ```
2.  **Navigate to the application directory:**
    ```bash
    cd eth-task
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
4.  **Copy WASM file:** Ensure the `parquet_wasm_bg.wasm` file from `node_modules/parquet-wasm/esm/` is copied to the `eth-task/public/` directory. You might need to do this manually or adjust the build process if it's not handled automatically.
5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
6.  Open your browser to `http://localhost:5173` (or the port specified by Vite).

### Production Mode (using Docker)

This is the recommended way to run the application as per the task requirements.

1.  **Clone the repository** (if not already done):
    ```bash
    git clone <your-repo-url>
    cd <repository-folder>
    ```
2.  **Ensure Docker Desktop is running.**
3.  **Navigate to the application directory:**
    ```bash
    cd eth-task 
    ```
4.  **Build and run the container using Docker Compose:**
    ```bash
    docker-compose up --build
    ```
    *   The `--build` flag ensures the image is built (or rebuilt if changes were made). You can omit it for subsequent runs if the image hasn't changed.
5.  **Access the application:** Open your browser to `http://localhost:9321`.

### Stopping the Docker Container

*   Press `Ctrl + C` in the terminal where `docker-compose up` is running.
*   To remove the stopped container (run from the `eth-task` directory):
    ```bash
    docker-compose down
    ```

## Data Files

The application expects the following data and schema files to be present in the `eth-task/public/` directory to be fetchable by the frontend:

*   `gdp.csv`: GDP data.
*   `gdp.json`: Schema for GDP data.
*   `generation.parquet`: Electricity generation data.
*   `generation.json`: Schema for electricity generation data.
*   `parquet_wasm_bg.wasm`: WebAssembly binary for the parquet parser.

## Testing

This project uses [Jest](https://jestjs.io/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for unit and integration testing.

To run the tests, navigate to the `eth-task` directory and run:

```bash
npm test
```

---

## Approach and Design Decisions

This section outlines some of the key approaches and decisions made during the development of this project:

*   **Data Loading:** Data and schema files are fetched client-side from the `/public` directory. This simplifies deployment to static hosting platforms but requires the data to be downloaded by the client.
*   **Parquet Parsing:** The `parquet-wasm` library is used for efficient client-side parsing of the Parquet file. This avoids the need for a dedicated backend data processing service.
*   **Performance Optimization (Web Worker):** To prevent the UI from freezing during potentially long-running Parquet parsing and data aggregation tasks, these operations were offloaded from the main thread to a Web Worker. This maintains UI responsiveness, especially for larger datasets or complex aggregations (like daily).
*   **State Management:** React Context (`NavigationContext`) was chosen for managing global application state (current page view, data availability flags, expert mode status, electricity aggregation level). This approach is suitable for the current scale of the application.
*   **Visualization:** `Plotly.js` (via `react-plotly.js`) was selected for its versatility in creating the required chart types (bar, stacked bar, stacked area). Material UI (MUI) was used for UI components to speed up development and provide a consistent look and feel.
*   **Testing Strategy:** Jest and React Testing Library form the testing foundation. Key decisions include:
    *   Mocking data loading functions (`dataLoader.ts`) to isolate component logic testing from actual data fetching.
    *   Mocking chart components (`GDPChart`, `ElectricityChart`) in tests for components that use them (like `Dashboard`) to avoid errors related to rendering dependencies (e.g., `canvas`) in the JSDOM environment.
    *   This strategy focuses tests on component behavior and logic rather than full end-to-end rendering, allowing tests to run reliably without complex environment setup.
*   **Expert Mode:** Implemented based on the interpretation that it should provide access to more granular data views, specifically enabling the 'Monthly' and 'Daily' aggregation options for the electricity chart.
*   **Deployment:** A multi-stage Dockerfile with Nginx is used to create an optimized production build, served statically as required by the task.
