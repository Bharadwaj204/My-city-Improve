# Production deployment steps
# Please follow these steps to deploy to production:

1. Set up environment variables in production:

```bash
# Main config
PORT=5000
NODE_ENV=production
MONGODB_URI=your_prod_mongodb_uri
JWT_SECRET=your_secure_jwt_secret  # Use a strong random value

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Maps
GOOGLE_MAPS_API_KEY=your_maps_key

# Email (Gmail or SMTP)
EMAIL_USER=your_email
EMAIL_PASSWORD=your_password

# Optional initial admin (set on first run)
INITIAL_ADMIN_EMAIL=admin@yourdomain.com
INITIAL_ADMIN_PASSWORD=your_secure_password
```

2. Build and run with Docker:

```bash
# Build and start (detached)
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

3. Or run directly on host:

```bash
npm install --production
NODE_ENV=production npm start
```

4. Set up NGINX reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. Security checklist:
- [ ] SSL/TLS enabled
- [ ] Strong JWT secret
- [ ] MongoDB authentication enabled
- [ ] Rate limiting configured (in security.js)
- [ ] File upload limits set
- [ ] CORS configured properly
- [ ] Admin password changed from default
- [ ] Regular backups configured
- [ ] Monitoring set up (e.g. PM2)