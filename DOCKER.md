# Docker Setup for CodeBeasts

This repository includes Docker configuration for containerized deployment of the CodeBeasts application.

## Files

- `Dockerfile` - Multi-stage Docker build configuration
- `.dockerignore` - Files excluded from Docker build context
- `docker-compose.yml` - Docker Compose configuration for easy deployment

## Quick Start

### Using Docker Compose (Recommended)

```bash
# 1. Create your environment file
cp .env.example .env
# Edit .env with your actual API keys

# 2. Build and run with docker-compose
docker-compose up --build

# 3. Access the app at http://localhost:3000
```

### Manual Docker Commands

```bash
# Build the image
docker build -t codebeasts .

# Run with environment file
docker run -p 3000:3000 --env-file .env.local codebeasts

# Or run with individual environment variables
docker run -p 3000:3000 \
  -e EVERART_API_KEY=your_key \
  -e ASTRA_DB_APPLICATION_TOKEN=your_token \
  -e LANGFLOW_API_KEY=your_key \
  codebeasts
```

### Production

```bash
# Create production environment file
cp .env.example .env.prod
# Edit .env.prod with your production values

# Run production setup
docker-compose -f docker-compose.prod.yml up --build -d
```

## Environment Variables

The application requires several environment variables at runtime:

```env
# Required API Keys
EVERART_API_KEY=your_everart_api_key
ASTRA_DB_ENDPOINT=your_astra_db_endpoint
ASTRA_DB_APPLICATION_TOKEN=your_astra_db_token
LANGFLOW_BASE_URL=your_langflow_url
LANGFLOW_FLOW_ID=your_langflow_flow_id

# Optional
OPENAI_API_KEY=your_openai_api_key
```

## Build Details

The Dockerfile uses:
- **Multi-stage build** for optimized image size
- **Node.js 18 Alpine** as base image
- **Non-root user** for security
- **Next.js standalone output** for optimal container deployment

## Security Notes

- Environment variables are not included in the built image
- Build uses dummy values that are overridden at runtime
- Container runs as non-root user (nextjs:nodejs)
- Only necessary files are copied to the container

## Troubleshooting

### Build Issues
If the build fails due to missing environment variables, ensure you have the latest Dockerfile that uses dummy values during build.

### Runtime Issues
Verify that all required environment variables are properly set in your `.env.local` or `.env.prod` file.

### Port Conflicts
If port 3000 is already in use, modify the port mapping in docker-compose.yml:
```yaml
ports:
  - "3001:3000"  # Host:Container
```