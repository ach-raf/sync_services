# Simple Dockerfile for Backend
FROM python:3.12-slim

WORKDIR /app

# Install git
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy app
COPY . .

# Create files directory
RUN mkdir -p files

# Expose port
EXPOSE 45553

# Run the app
CMD ["python", "main.py"]
