
FROM node:14-alpine3.14 as base
WORKDIR /app
ARG TARGET_APP
ENV TARGET_APP $TARGET_APP

# Build target dependencies #
#############################
FROM base AS dependencies
COPY package.json yarn.lock ./
RUN yarn

# Build target development #
############################
FROM dependencies AS development
COPY . .
CMD yarn nx serve $TARGET_APP --watch

# Build target builder #
########################
FROM dependencies AS builder
# RUN yarn global add nx
COPY . .
RUN yarn generate-model
RUN yarn build $TARGET_APP

# Build target production #
###########################
FROM base AS production
COPY --from=builder /app/dist/apps/$TARGET_APP /app
COPY --from=dependencies /app/node_modules /app/node_modules
# Start the app
CMD node /app/main.js
