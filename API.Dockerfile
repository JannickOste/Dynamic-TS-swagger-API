
FROM node:18

WORKDIR /usr/lib/bin/api/

COPY ./package*.json  /usr/lib/bin/api/

RUN npm install -f
RUN npm install -g typescript ts-node
RUN npm i --save-dev @types/node -g

COPY . /usr/lib/bin/api/
CMD ["npm", "run", "start"]