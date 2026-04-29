# Stage 1: Build
FROM node:20-alpine AS build
ARG GEMINI_API_KEY
# Vite uses GEMINI_API_KEY from process.env during build as configured in vite.config.ts
ENV GEMINI_API_KEY=$GEMINI_API_KEY
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Vite builds to dist/ by default
RUN npm run build

# Stage 2: Serve
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=build /app/dist ./dist
COPY server ./server
EXPOSE 3000
CMD ["node", "server/index.js"]
