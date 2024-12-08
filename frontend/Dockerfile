# Use the official Node.js image
FROM node:18

# Set the working directory
WORKDIR /frontend

# Copy frontend files to the container
COPY frontend/ /frontend

# Install dependencies
RUN npm install

# Build the frontend
RUN npm run build

# Expose the frontend port
EXPOSE 3000

# Start the React app
CMD ["npm", "start"]