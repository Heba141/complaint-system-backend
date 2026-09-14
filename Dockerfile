FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Add this line to generate the Prisma client during the build
RUN npx prisma generate
EXPOSE 5000
CMD ["node", "server.js"]