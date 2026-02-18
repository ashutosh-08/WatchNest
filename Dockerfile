FROM node:20-bookworm-slim

WORKDIR /app

# Install ffmpeg for storyboard generation jobs.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 8000

CMD ["npm", "start"]
