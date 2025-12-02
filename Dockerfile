# 1. The Base Image (The Scout)
# Using Alpine for minimal attack surface (<50MB vs 1GB)
FROM node:24-alpine

# 2. The Fortress Directory
WORKDIR /app

# 3. Cache Strategy
# We copy ONLY the manifests first.
# This tells Docker: "If package.json didn't change, skip the npm install step."
# This makes your re-builds take 1 second instead of 10 minutes.
COPY package*.json ./

# 4. The Arsenal (Installation)
# If you have a lockfile, `npm ci` is faster and reproducible.
# This project currently doesn't include a lockfile, so fall back to
# a safe `npm install` to avoid build failures during image build.
RUN npm install --omit=dev --no-audit --no-fund --progress=false

# 5. The Payload
# Copy the rest of the source code
COPY . .

# Create the uploads directory explicitly (so we know it exists)
# And give the 'node' user ownership of the entire /app directory
RUN mkdir -p uploads && chown -R node:node /app

# 6. Security Protocol (The Sovereign Move)
# By default, Docker runs as 'root' (God Mode). This is dangerous.
# We downgrade to the 'node' user (Least Privilege).
USER node

# 7. The Gate
# Expose the port your app runs on (Usually 3000 or 8080)
EXPOSE 3000

# 8. Launch
# The application entrypoint lives at `src/server.js` (see `package.json`).
# Run the file directly so the container doesn't depend on an extra copy
# at `/app/server.js`.
CMD ["node", "src/server.js"]
