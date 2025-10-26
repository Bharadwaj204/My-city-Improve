# Deploying to Render.com

## Prerequisites
1. A [Render account](https://render.com)
2. Your MongoDB Atlas database set up
3. Your Cloudinary account configured
4. This repository pushed to GitHub

## Deployment Steps

1. **Connect Your Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository

2. **Configure Your Service**
   - Name: my-city (or your preferred name)
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Select the Free plan (or paid if needed)

3. **Set Environment Variables**
   Required variables to set in Render dashboard:
   ```
   NODE_ENV=production
   MONGODB_URI=your-mongodb-atlas-uri
   JWT_SECRET=your-secret-key
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   EMAIL_USER=your-email (optional)
   EMAIL_PASSWORD=your-email-password (optional)
   ALLOWED_ORIGINS=your-render-app-url
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy your app
   - Wait for the build and deploy to complete

5. **Verify Deployment**
   - Click the generated URL to view your app
   - Test the main functionality
   - Check logs in Render dashboard if needed

## Post-Deployment Steps

1. **Update CORS Settings**
   - Add your Render URL to ALLOWED_ORIGINS
   - Format: `https://your-app-name.onrender.com`

2. **MongoDB Atlas Configuration**
   - Add Render's IP to MongoDB Atlas whitelist
   - Or allow access from all IPs (0.0.0.0/0) for dynamic IPs

3. **Testing**
   - Test image uploads to Cloudinary
   - Test MongoDB connections
   - Test email notifications if configured

## Monitoring and Maintenance

1. **View Logs**
   - Go to your service in Render dashboard
   - Click "Logs" to view application logs

2. **Auto-Deploy**
   - Render automatically deploys when you push to your GitHub repository
   - You can disable auto-deploy in service settings

3. **Custom Domain (Optional)**
   - Add your domain in Render dashboard
   - Configure DNS settings as instructed
   - Wait for SSL certificate provisioning

## Troubleshooting

1. **Build Failures**
   - Check build logs in Render dashboard
   - Verify package.json is correct
   - Ensure node version is compatible

2. **Runtime Errors**
   - Check application logs
   - Verify environment variables
   - Check MongoDB connection
   - Verify Cloudinary settings

3. **Database Issues**
   - Confirm MongoDB Atlas network access
   - Check connection string in environment variables
   - Verify database user permissions

## Cost Optimization

- Free tier limitations:
  * Spins down after 15 minutes of inactivity
  * 750 hours of runtime per month
  * 100 GB bandwidth
  * Shared CPU
  * 512 MB RAM

- Consider upgrading if you need:
  * Always-on service
  * More resources
  * Better performance
  * Custom domains with SSL

## Scaling

If your application grows, you can:
1. Upgrade to a paid plan
2. Add more services
3. Configure auto-scaling
4. Set up a CDN for static assets

## Useful Commands

```bash
# Install Render CLI (optional)
npm install -g @render/cli

# Deploy via CLI
render deploy

# View service info
render list

# Check service status
render status
```

Remember to keep your environment variables secure and never commit them to your repository. Use the .env.example file as a template for required variables.