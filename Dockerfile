
FROM node:16-alpine3.14 as base
WORKDIR /app
ARG TARGET_APP
ENV TARGET_APP $TARGET_APP

# Build target dependencies #
#############################
FROM base AS dependencies
COPY package.json yarn.lock .yarnrc ./
COPY schema.prisma .
RUN yarn --production

# Build target builder #
########################
FROM dependencies AS builder
COPY . .
RUN yarn
RUN yarn generate-schema
RUN yarn build-all --configuration=production

# Build target development #
############################
FROM builder AS development
CMD yarn dev

# Build target production #
###########################
FROM base AS production
ARG APP_VERSION=master
ENV APP_VERSION $APP_VERSION
COPY --from=builder /app/dist /app/dist
COPY --from=dependencies /app/node_modules /app/node_modules
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
# Start the app
CMD node /app/dist/apps/$TARGET_APP/main.js
