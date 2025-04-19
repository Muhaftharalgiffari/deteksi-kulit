FROM node:18

# Install Python, pip, dan python3-venv
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-full

# Set working directory
WORKDIR /app

# Copy seluruh backend folder
COPY backend ./backend

# Install Node.js dependencies
WORKDIR /app/backend
RUN npm install

# Setup Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies dalam virtual environment
RUN pip3 install --no-cache-dir -r requirements.txt

# Create necessary directories
RUN mkdir -p uploads model

# Environment variables
ENV PORT=5000
ENV NODE_ENV=production
ENV PATH=/app/backend:$PATH

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"] 