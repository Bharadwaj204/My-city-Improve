# App's core functionality works on these cloud platforms
services:
  mongodb: MongoDB Atlas (current connection string in .env)
  images: Cloudinary
  email: Gmail (configured)
  maps: Google Maps API (configured)

# Next steps for deployment
1. Go to MongoDB Atlas (https://cloud.mongodb.com)
   - Add your IP: Network Access > Add IP > Add Current IP
   - Or for public access: Add 0.0.0.0/0 (less secure, use IP ranges in prod)

2. Deployment options:

## Option 1: Railway.app (recommended, has free tier)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init

# Deploy (from project root)
railway up
```

## Option 2: Heroku (need paid tier)
```bash
# Install Heroku CLI
npm i -g heroku

# Login
heroku login

# Create app
heroku create my-city-app

# Set environment variables
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=...
heroku config:set CLOUDINARY_CLOUD_NAME=...
heroku config:set CLOUDINARY_API_KEY=...
heroku config:set CLOUDINARY_API_SECRET=...
heroku config:set GOOGLE_MAPS_API_KEY=...
heroku config:set EMAIL_USER=...
heroku config:set EMAIL_PASSWORD=...

# Deploy
git push heroku main
```

## Option 3: DigitalOcean App Platform
1. Fork this repo to GitHub
2. Connect DigitalOcean to GitHub
3. Create new App > Select repo
4. Add environment variables from .env
5. Deploy

Remember:
- Set NODE_ENV=production
- Use strong JWT_SECRET
- Add proper CORS origins
- Enable MongoDB Atlas network access
- Set up proper email service for production