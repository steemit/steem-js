FROM node:6
ADD ./package.json /steemjs/package.json
WORKDIR /steemjs
RUN npm install
ADD . /steemjs
RUN npm test
