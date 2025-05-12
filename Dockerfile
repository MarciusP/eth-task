# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
# Use wildcard to include both package.json and package-lock.json
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine

# Copy the build output from the build stage to Nginx's web root directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (Nginx default port)
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"] 