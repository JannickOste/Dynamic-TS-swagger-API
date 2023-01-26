
FROM node:18

WORKDIR /usr/lib/bin/api/

COPY ./package*.json  /usr/lib/bin/api/

RUN npm install -f
RUN npm install typescript -g 
RUN npm install ts-node -g 
RUN npm i --save-dev @types/node -g

COPY . /usr/lib/bin/api/
CMD  [ "debug.sh" ]
# CMD ["npm", "run", "start"]
# CMD ["npm", "run", "start"]