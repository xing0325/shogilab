FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node . .
RUN mkdir -p /app/.server-data && chown node:node /app/.server-data
USER node
ENV HOST=0.0.0.0 PORT=5173 DATA_DIR=/app/.server-data
EXPOSE 5173
VOLUME ["/app/.server-data"]
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:5173/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
