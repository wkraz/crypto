# Use the official Python image
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Copy backend files to the container
COPY backend/ /app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the backend port
EXPOSE 5000

# Start the Flask app
CMD ["python", "app.py"]