# Fraza Hono API

A production-ready API built with [Hono.js](https://hono.dev/) designed for deployment to Azure Container Apps using GitHub Container Registry.

## 🚀 Features

- ⚡ **Hono.js** - Ultra-fast web framework
- 🐳 **Docker** - Multi-stage builds for optimal image size
- 📦 **GitHub Container Registry** - Free private container registry
- ☁️ **Azure Container Apps** - Serverless container hosting with auto-scaling
- 🔒 **CORS & Logger** - Built-in middleware
- 💪 **TypeScript** - Full type safety

## 📋 Prerequisites

- Node.js 20+
- Docker Desktop
- Azure CLI or Azure PowerShell module
- GitHub account

## 🛠️ Local Development

### 1. Install Dependencies

```powershell
npm install
```

### 2. Run Development Server

```powershell
npm run dev
```

The API will be available at `http://localhost:3000`

### 3. Test Endpoints

- **Health Check**: `http://localhost:3000/health`
- **Chat**: `POST http://localhost:3000/api/chat`
- **User Profile**: `GET/POST http://localhost:3000/api/user/profile`
- **Studio**: `POST http://localhost:3000/api/studio/generate`
- **Scripts**: `GET http://localhost:3000/api/scripts/list`
- **Script Processing**: `POST http://localhost:3000/api/script/process`

## 🔑 Environment Variables

Create a `.env` file with the following variables:

```env
PORT=3000
DATABASE_URL=postgres://user:pass@host:port/db
AZURE_OPENAI_KEY=your_openai_key
AZURE_STORAGE_CONNECTION_STRING=your_storage_connection_string
AZURE_TTS_KEY=your_tts_key
AZURE_TTS_REGION=swedencentral
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

## 🐳 Docker

### Build Locally

```powershell
npm run docker:build
```

### Run Container Locally

```powershell
npm run docker:run
```

## 📦 Deployment to Azure Container Apps

### Recommended: GitHub Actions CD (automatic deploy)

On every push to `master`, the workflow in `.github/workflows/build-and-push-ghcr.yml` will:

- Build and push the Docker image to GHCR
- Deploy the newly built image to Azure Container Apps

#### GitHub Actions secrets required

Add these in GitHub → Settings → Secrets and variables → Actions:

**Azure auth (Option A)**

- `AZURE_CREDENTIALS` (service principal JSON)

**GHCR**

- `GHCR_PAT` (must have at least `read:packages`; used both for pushing and for Azure pulls)

Notes:

- The workflow deploys the immutable tag `${GITHUB_SHA}` (and also publishes `:latest`).
- This removes the need to paste a PAT on every manual deploy.

### Manual deployment (scripts)

### Step 1: Setup GitHub Container Registry

1. Create a GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens/new
   - Select scope: `write:packages`
   - Generate token and save it

2. Login to GitHub Container Registry:

```powershell
$env:CR_PAT = "your_token_here"
echo $env:CR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### Step 2: Configure Deployment Scripts

Edit both `build-and-push.ps1` and `deploy-to-azure.ps1`:

```powershell
$GITHUB_USERNAME = "your-github-username"  # Replace with your GitHub username
```

### Step 3: Build and Push Image

```powershell
.\build-and-push.ps1
```

This will:
- Build the Docker image
- Push it to GitHub Container Registry

### Step 4: Deploy to Azure

First, ensure you're logged in to Azure:

```powershell
Connect-AzAccount
```

Then deploy:

```powershell
.\deploy-to-azure.ps1
```

This will:
- Create an Azure Container Apps environment (if needed)
- Deploy your container
- Configure ingress and scaling
- Output your application URL

## 🌐 API Endpoints

### Public Endpoints

- `GET /` - API information
- `GET /health` - Health check

### API Routes

- `GET /api/hello?name=World` - Hello endpoint
- `POST /api/echo` - Echo JSON body
- `GET /api/profile` - Protected endpoint (requires Authorization header)

## 🔐 Authentication

The `/api/profile` endpoint demonstrates authentication. To add real authentication:

1. **Firebase Auth**: Add `firebase-admin` and validate tokens
2. **Azure AD**: Use Azure Easy Auth configuration
3. **Custom JWT**: Validate tokens in middleware

Example with Authorization header:

```bash
curl -H "Authorization: Bearer your-token" https://your-app.azurewebsites.net/api/profile
```

## 🏗️ Project Structure

```
fraza-hono-api/
├── src/
│   └── index.ts          # Main API file
├── Dockerfile            # Multi-stage Docker build
├── .dockerignore         # Docker ignore patterns
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── build-and-push.ps1    # Build and push to GHCR
└── deploy-to-azure.ps1   # Deploy to Azure Container Apps
```

## 📊 Azure Container Apps Features

- **Auto-scaling**: Scales from 0 to 10 replicas based on load
- **Zero to Scale**: Reduces costs by scaling to zero when idle
- **HTTPS**: Automatic SSL certificates
- **Health Checks**: Built-in health monitoring
- **Rolling Updates**: Zero-downtime deployments

## 🔧 Environment Variables

Set in Azure Container Apps:

```powershell
az containerapp update \
  --name fraza-hono-api \
  --resource-group fraza_dev \
  --set-env-vars "NODE_ENV=production" "API_KEY=secret"
```

## 🐛 Troubleshooting

### Cannot push to GHCR

Make sure your package is public:
1. Go to https://github.com/users/YOUR_USERNAME/packages
2. Select your package
3. Click "Package settings" → "Change visibility" → "Public"

### Azure CLI not working

Use Azure PowerShell module instead:

```powershell
Install-Module -Name Az -Repository PSGallery -Force
Connect-AzAccount
```

### Container fails to start

Check logs:

```powershell
az containerapp logs show \
  --name fraza-hono-api \
  --resource-group fraza_dev \
  --follow
```

## 📝 License

MIT
