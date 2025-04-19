FROM node:18

# Install Python, pip, dan python3-venv
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-full

# Set working directory
WORKDIR /app

# Copy package.json dan requirements.txt
COPY backend/package*.json backend/
COPY backend/requirements.txt backend/

# Install Node.js dependencies
WORKDIR /app/backend
RUN npm install

# Setup Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies dalam virtual environment
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy rest of the application
COPY backend/ backend/

# Set working directory to backend
WORKDIR /app/backend

# Start the application
CMD ["node", "server.js"] 