
FROM node:16-alpine3.14 as base
WORKDIR /app
ARG TARGET_APP
ENV TARGET_APP $TARGET_APP

# Build target dependencies #
#############################
FROM base AS dependencies
COPY package.json yarn.lock ./

# The @prisma/client package defines its own postinstall hook that's being
# executed whenever the package is being installed. This hook invokes the
# prisma generate command which in turn generates the Prisma Client code
# into the default location `node_modules/.prisma/client`
COPY schema.prisma .

RUN yarn --production

# Build target development #
############################
FROM dependencies AS development
COPY . .
RUN yarn generate-schema
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
COPY --from=builder /app/dist /app/dist
COPY --from=dependencies /app/node_modules /app/node_modules
# Start the app
CMD node /app/dist/apps/$TARGET_APP/main.js
