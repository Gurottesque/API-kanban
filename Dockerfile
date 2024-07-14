
FROM node:latest

WORKDIR /app

# Copy the rest of the source files into the image.
COPY . .
# Run the build script.
RUN npm install
RUN npm run tsc


# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD ["node", "./build/index.js"]
