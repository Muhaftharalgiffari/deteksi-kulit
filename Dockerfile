FROM node:18

# Install Python dan pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Set working directory
WORKDIR /app

# Copy package.json dan requirements.txt
COPY backend/package*.json backend/
COPY backend/requirements.txt backend/

# Install dependencies
WORKDIR /app/backend
RUN npm install
RUN pip3 install -r requirements.txt

# Copy rest of the application
COPY backend/ backend/

# Set working directory to backend
WORKDIR /app/backend

# Start the application
CMD ["node", "server.js"] 