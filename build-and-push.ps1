# Configuration
$GITHUB_USERNAME = "k-frankov"
$IMAGE_NAME = "fraza-hono-api"
$IMAGE_TAG = "latest"
$FULL_IMAGE_NAME = "ghcr.io/$GITHUB_USERNAME/$IMAGE_NAME`:$IMAGE_TAG"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Building and Pushing Docker Image" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Image: $FULL_IMAGE_NAME" -ForegroundColor Yellow
Write-Host ""

# Build the Docker image
Write-Host "🔨 Building Docker image..." -ForegroundColor Green
docker build -t $FULL_IMAGE_NAME .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Push to GitHub Container Registry
Write-Host "📤 Pushing to GitHub Container Registry..." -ForegroundColor Green
Write-Host "Make sure you're logged in: docker login ghcr.io -u $GITHUB_USERNAME" -ForegroundColor Yellow
Write-Host ""

docker push $FULL_IMAGE_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host "Make sure you're logged in to ghcr.io:" -ForegroundColor Yellow
    Write-Host "  docker login ghcr.io -u $GITHUB_USERNAME" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Create a GitHub Personal Access Token with 'write:packages' scope:" -ForegroundColor Yellow
    Write-Host "  https://github.com/settings/tokens/new" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Push successful!" -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run .\deploy-to-azure.ps1 to deploy to Azure" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan
