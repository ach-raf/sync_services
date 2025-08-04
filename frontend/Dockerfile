# Simple Dockerfile for Frontend
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 80

# Simple static server
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "80"]
