# Dev image for the Kyber documentation site.
# Used by docker-compose.yml to run the Docusaurus dev server with hot-reload.
FROM node:22-alpine

WORKDIR /site

# Install dependencies first to leverage Docker layer caching when only docs change.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the project. At runtime, docker-compose mounts the source over
# this, so this layer is mainly useful when running the image without compose.
COPY . .

EXPOSE 3000

# --host 0.0.0.0 is required so the dev server is reachable from outside the container.
# --poll lets file-watching work reliably across the bind-mount on Linux/macOS/Windows.
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--poll", "1000"]
