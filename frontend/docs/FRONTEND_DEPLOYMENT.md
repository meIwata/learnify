# Frontend Deployment Guide

This guide explains how to deploy the Learnify frontend application to various hosting platforms.

## Overview

The frontend is a React + TypeScript + Vite application that builds to static files. It can be deployed to any static hosting service like Vercel, Netlify, or traditional web servers.

## Prerequisites

- Node.js 18+ installed
- Access to the backend API URL
- Git repository for deployment automation

## Build Process

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Create environment files for different deployment environments:

#### Development (.env.development)
```bash
VITE_API_URL=http://localhost:3000
```

#### Production (.env.production)
```bash
VITE_API_URL=https://your-backend-api.zeabur.app
```

### 3. Build Static Assets

```bash
npm run build
```

This creates a `dist/` folder with optimized static files ready for deployment.

### 4. Verify Build

Test the build locally:

```bash
npm run preview
```

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides excellent React/Vite support with automatic deployments.

#### Manual Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy from project root:
```bash
vercel --cwd frontend
```

3. Follow prompts to configure:
   - Project name: `learnify-frontend`
   - Build command: `npm run build`
   - Output directory: `dist`

#### Automatic Deployment (GitHub)

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard:
   - `VITE_API_URL`: Your backend URL

#### Vercel Configuration (vercel.json)

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
```

### Option 2: Netlify

#### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Drag and drop `dist/` folder to Netlify dashboard

#### Automatic Deployment (GitHub)

1. Connect GitHub repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: `frontend`

#### Netlify Configuration (_redirects)

Create `frontend/public/_redirects`:
```
/*    /index.html   200
```

### Option 3: Traditional Web Server

#### Apache

1. Upload `dist/` contents to web root
2. Configure `.htaccess` for SPA routing:

```apache
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

#### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Option 4: Docker Deployment

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Configure Nginx for SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf for Docker

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

#### Build and Run Docker

```bash
# Build image
docker build -t learnify-frontend .

# Run container
docker run -p 3000:80 learnify-frontend
```

## Environment Variables

Configure these variables based on your deployment platform:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://api.learnify.app` |

### Platform-Specific Configuration

#### Vercel
Set environment variables in project settings dashboard.

#### Netlify
Configure in Site Settings > Environment Variables.

#### Docker
Use environment files or docker-compose:

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=https://api.learnify.app
```

## Production Optimizations

### 1. Bundle Analysis

Analyze bundle size:
```bash
npm run build -- --analyze
```

### 2. CDN Configuration

For optimal performance, configure CDN caching:
- HTML files: No cache (for updates)
- JS/CSS files: Long-term cache (hashed filenames)
- Images: Medium-term cache

### 3. Compression

Enable gzip/brotli compression on your server:

```nginx
# Nginx compression
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

## Monitoring and Updates

### Health Check

Create a health check endpoint by adding to your HTML:

```html
<!-- In index.html -->
<meta name="app-version" content="1.0.0">
```

### Continuous Deployment

Example GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy Frontend

on:
  push:
    branches: [ main ]
    paths: [ 'frontend/**' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Build
        working-directory: frontend
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          working-directory: frontend
```

## Troubleshooting

### Common Issues

1. **White screen after deployment**
   - Check console for errors
   - Verify API URL is correct
   - Ensure backend CORS allows frontend domain

2. **404 errors on page refresh**
   - Configure SPA routing (see platform-specific configs above)

3. **API connection fails**
   - Verify `VITE_API_URL` environment variable
   - Check backend CORS configuration
   - Ensure backend is deployed and accessible

### Debug Commands

```bash
# Check build output
npm run build && ls -la dist/

# Test production build locally
npm run preview

# Check environment variables
echo $VITE_API_URL
```

## Security Considerations

1. **Environment Variables**: Never expose sensitive data in `VITE_` variables (they're public)
2. **HTTPS**: Always use HTTPS in production
3. **Content Security Policy**: Configure CSP headers
4. **Domain Verification**: Verify backend API allows your frontend domain

## Performance Optimization

1. **Code Splitting**: Vite automatically splits chunks
2. **Lazy Loading**: Implement lazy loading for components
3. **Image Optimization**: Use WebP format and appropriate sizes
4. **Caching**: Configure proper cache headers