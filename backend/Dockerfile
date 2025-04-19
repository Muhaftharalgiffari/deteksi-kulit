FROM python:3.11-slim

# Install system dependencies and Node.js in one layer
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && npm cache clean --force

WORKDIR /app/backend

# Copy package files and install Node.js dependencies
COPY package*.json ./
RUN npm ci --only=production

# Set up Python virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create necessary directories
RUN mkdir -p uploads model

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"] 