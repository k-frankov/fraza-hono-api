# Configuration
$SUBSCRIPTION = "FrankovAzureSubscription"
$RESOURCE_GROUP = "fraza_dev"
$LOCATION = "swedencentral"
$CONTAINER_APP_ENV = "fraza-env"
$CONTAINER_APP_NAME = "fraza-hono-api"
$GITHUB_USERNAME = "k-frankov"
$IMAGE_NAME = "fraza-hono-api"

# Prefer deploying an explicit tag (e.g. a commit SHA) to avoid stale `latest` pulls.
$IMAGE_TAG = Read-Host "Image tag to deploy (default: latest)"
if ([string]::IsNullOrWhiteSpace($IMAGE_TAG)) {
    $IMAGE_TAG = "latest"
}

$FULL_IMAGE_NAME = "ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME`:$IMAGE_TAG"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Deploying to Azure Container Apps" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Subscription: $SUBSCRIPTION" -ForegroundColor Yellow
Write-Host "Resource Group: $RESOURCE_GROUP" -ForegroundColor Yellow
Write-Host "Location: $LOCATION" -ForegroundColor Yellow
Write-Host "Image: $FULL_IMAGE_NAME" -ForegroundColor Yellow
Write-Host ""

# Set subscription (using PowerShell Az module)
Write-Host "🔧 Setting Azure subscription..." -ForegroundColor Green
az account set --subscription $SUBSCRIPTION

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set subscription" -ForegroundColor Red
    exit 1
}

# Check if Container Apps environment exists
Write-Host "🔍 Checking if Container Apps environment exists..." -ForegroundColor Green
$envExists = az containerapp env show --name $CONTAINER_APP_ENV --resource-group $RESOURCE_GROUP 2>$null

if ($null -eq $envExists) {
    Write-Host "📦 Creating Container Apps environment..." -ForegroundColor Green
    az containerapp env create `
        --name $CONTAINER_APP_ENV `
        --resource-group $RESOURCE_GROUP `
        --location $LOCATION
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create environment!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Environment ready!" -ForegroundColor Green
Write-Host ""

# Check if Container App exists
Write-Host "🔍 Checking if Container App exists..." -ForegroundColor Green
$appExists = az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP 2>$null

if ($null -eq $appExists) {
    # Create new Container App
    Write-Host "🚀 Creating new Container App..." -ForegroundColor Green
    Write-Host "Note: If your image is public, you can make it public at:" -ForegroundColor Yellow
    Write-Host "  https://github.com/users/$GITHUB_USERNAME/packages/container/$IMAGE_NAME/settings" -ForegroundColor Yellow
    Write-Host ""
    
    # Prompt for GitHub token
    $ghToken = Read-Host "Enter your GitHub Personal Access Token (or press Enter if image is public)"
    
    if ($ghToken) {
        # Deploy with authentication
        az containerapp create `
            --name $CONTAINER_APP_NAME `
            --resource-group $RESOURCE_GROUP `
            --environment $CONTAINER_APP_ENV `
            --image $FULL_IMAGE_NAME `
            --target-port 3000 `
            --ingress external `
            --registry-server ghcr.io `
            --registry-username $GITHUB_USERNAME `
            --registry-password $ghToken `
            --cpu 0.25 `
            --memory 0.5Gi `
            --min-replicas 0 `
            --max-replicas 10
    } else {
        # Deploy without authentication (public image)
        az containerapp create `
            --name $CONTAINER_APP_NAME `
            --resource-group $RESOURCE_GROUP `
            --environment $CONTAINER_APP_ENV `
            --image $FULL_IMAGE_NAME `
            --target-port 3000 `
            --ingress external `
            --cpu 0.25 `
            --memory 0.5Gi `
            --min-replicas 0 `
            --max-replicas 10
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create Container App!" -ForegroundColor Red
        exit 1
    }
} else {
    # Update existing Container App
    Write-Host "🔄 Updating existing Container App..." -ForegroundColor Green

    # For private GHCR images, we must configure registry credentials on the Container App.
    # If your image is public, you can press Enter.
    $ghToken = Read-Host "Enter your GitHub Personal Access Token for GHCR (press Enter if image is public)"

    if ($ghToken) {
        Write-Host "🔐 Configuring registry credentials for ghcr.io..." -ForegroundColor Green
        az containerapp registry set `
            --name $CONTAINER_APP_NAME `
            --resource-group $RESOURCE_GROUP `
            --server ghcr.io `
            --username $GITHUB_USERNAME `
            --password $ghToken

        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to set registry credentials!" -ForegroundColor Red
            exit 1
        }
    }

    az containerapp update `
        --name $CONTAINER_APP_NAME `
        --resource-group $RESOURCE_GROUP `
        --image $FULL_IMAGE_NAME
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to update Container App!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""

# Get the app URL
Write-Host "🌐 Getting application URL..." -ForegroundColor Green
$appUrl = az containerapp show `
    --name $CONTAINER_APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --query "properties.configuration.ingress.fqdn" `
    -o tsv

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "App URL: https://$appUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "Test endpoints:" -ForegroundColor White
Write-Host "  Health: https://$appUrl/health" -ForegroundColor Cyan
Write-Host "  API: https://$appUrl/api/hello" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
