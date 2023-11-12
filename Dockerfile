FROM oven/bun:canary-alpine
WORKDIR /app
RUN wget -qO- https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz | tar xJf - --strip-components 2 --exclude "*.*"
RUN chmod +x ffmpeg ffprobe
RUN mv ffmpeg /usr/bin/
RUN mv ffprobe /usr/bin/
RUN mv ffplay /usr/bin/
COPY package.json package.json
COPY bun.lockb bun.lockb
RUN bun install
COPY . .
COPY patch.ts node_modules/drizzle-orm/bun-sqlite/session.js
EXPOSE 3000
ENTRYPOINT ["bun", "start"]
