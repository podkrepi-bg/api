
FROM node:16-alpine3.14 as base
WORKDIR /app
ARG TARGET_APP
ENV TARGET_APP $TARGET_APP

# Build target dependencies #
#############################
FROM base AS dependencies
COPY package.json yarn.lock ./
RUN yarn --production
COPY schema.prisma .
RUN yarn generate-schema

# Build target development #
############################
FROM dependencies AS development
COPY . .
CMD yarn dev

# Build target builder #
########################
FROM dependencies AS builder
COPY . .
RUN yarn
RUN yarn build-all --prod

# Build target production #
###########################
FROM base AS production
COPY --from=builder /app/dist /app
COPY --from=dependencies /app/node_modules /app/node_modules
# Start the app
CMD node /app/apps/$TARGET_APP/main.js
