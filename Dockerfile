# Node Version
FROM node:10-alpine

RUN mkdir -p /usr/src/app/node_modules && chown -R node:node /usr/src/app

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Switch to non-root user
USER node

# If you are building your code for production
# RUN npm install --only=production
RUN npm install

# Bundle app source
COPY --chown=node:node . .

# Run app for test use in a sandbox / test env
#CMD [ "npm", "start" ]
CMD [ "npm", "test" ]
