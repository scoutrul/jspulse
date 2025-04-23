FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Build the shared package and list emitted files
RUN pnpm --filter @jspulse/shared build --listEmittedFiles

# Switch to backend directory for backend build
# ... existing code ...