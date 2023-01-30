
FROM node:18

WORKDIR /usr/lib/api/

COPY ./package*.json  /usr/lib/api/

RUN npm install -f
RUN npm install -g typescript ts-node
RUN npm i --save-dev @types/node -g

COPY . /usr/lib/api/
CMD ["npm", "run", "start"]