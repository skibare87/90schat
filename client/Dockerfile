# Client Dockerfile
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy application files
COPY . /usr/share/nginx/html

# Create basic assets directory structure
RUN mkdir -p /usr/share/nginx/html/assets

# Create placeholder assets if they don't exist
RUN touch /usr/share/nginx/html/assets/favicon.ico

# Set proper permissions
RUN chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]