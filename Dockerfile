
FROM node:14-alpine3.14 as base
WORKDIR /app

# Build target dependencies #
#############################
FROM base AS dependencies
COPY package.json yarn.lock ./
RUN yarn
COPY schema.prisma .
RUN yarn generate-model

# Build target development #
############################
FROM dependencies AS development
COPY . .
CMD yarn dev

# Build target builder #
########################
FROM dependencies AS builder
RUN yarn build-all

# Build target production #
###########################
FROM base AS production
COPY --from=builder /app/dist /app
COPY --from=dependencies /app/node_modules /app/node_modules
# Start the app
CMD node /app/main.js
