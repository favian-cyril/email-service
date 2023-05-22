# We are using the official Node.js runtime as a parent image
FROM node:16-alpine

# Working directory for the application inside the Docker container
WORKDIR /usr/src/app

# Copying package.json and yarn.lock (if available)
COPY package.json yarn.lock ./

# Installing dependencies
RUN yarn install --frozen-lockfile

# Bundle application source code inside Docker image
COPY . .

# Transpile TypeScript into JavaScript
RUN yarn build

# Expose port 3000 (or whatever port your app uses) to the Docker host, 
# this is necessary for the application to be accessible
EXPOSE 3000

# Our app is running on port 3000 within the container, 
# so we'll use the EXPOSE instruction to have it mapped by the docker daemon
CMD [ "yarn", "start:prod" ]
