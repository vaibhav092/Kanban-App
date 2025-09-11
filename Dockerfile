    FROM node:18 AS frontend-build
    WORKDIR /app/frontend
    COPY frontend/package*.json ./
    RUN npm install
    COPY frontend/ .
    RUN npm run build
    
    
    FROM node:18 AS backend
    WORKDIR /app
    
    COPY Backend/package*.json ./Backend/
    WORKDIR /app/Backend
    RUN npm install
    
    COPY Backend/ .
    
    RUN mkdir -p public
    COPY --from=frontend-build /app/frontend/dist ./public
    
    EXPOSE 3000
    
    CMD ["npm", "start"]
    