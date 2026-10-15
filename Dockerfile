FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node package.json server.mjs ./
COPY --chown=node:node site ./site
USER node
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.mjs"]
