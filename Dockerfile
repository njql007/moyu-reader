# Production stage
FROM nginx:alpine
# Copy the built artifacts from the Cloud Build workspace (dist folder)
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
