FROM node:18-alpine as frontend-build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM python:3.9-slim

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY backend/ ./backend/

# Copy built frontend files
COPY --from=frontend-build /app/dist ./static

# Expose port
EXPOSE 8000

# Start command
CMD ["python", "backend/app.py"]