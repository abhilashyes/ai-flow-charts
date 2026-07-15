# --- Stage 1: build the client (served at the domain root) ---
FROM node:20-alpine AS client
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_API_URL empty => same-origin: the client calls /api on the server that
# serves it. APP_BASE=/ so assets resolve at the root (not the Pages sub-path).
ENV APP_BASE=/
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Stage 2: server (serves the API + the built client) ---
FROM node:20-alpine AS server
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY server ./server
COPY --from=client /app/dist ./dist
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
CMD ["node", "server/index.js"]
