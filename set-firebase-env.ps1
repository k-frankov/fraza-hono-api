# Set Firebase environment variables in Azure Container Apps
# IMPORTANT: Store credentials in .env file, NEVER commit them to Git

$CONTAINER_APP_NAME = "fraza-hono-api"
$RESOURCE_GROUP = "fraza_dev"

# Load Firebase credentials from .env file
if (-Not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Create a .env file with the following variables:" -ForegroundColor Yellow
    Write-Host "  FIREBASE_PROJECT_ID=your-project-id" -ForegroundColor Cyan
    Write-Host "  FIREBASE_CLIENT_EMAIL=your-client-email@project.iam.gserviceaccount.com" -ForegroundColor Cyan
    Write-Host "  FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----..." -ForegroundColor Cyan
    exit 1
}

# Parse .env file
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        Set-Variable -Name $name -Value $value -Scope Script
    }
}

if (-Not $FIREBASE_PROJECT_ID -or -Not $FIREBASE_CLIENT_EMAIL -or -Not $FIREBASE_PRIVATE_KEY) {
    Write-Host "❌ Error: Missing required environment variables in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "Setting Firebase environment variables in Azure Container Apps..." -ForegroundColor Green

az containerapp update `
    --name $CONTAINER_APP_NAME `
    --resource-group $RESOURCE_GROUP `
    --set-env-vars `
        "FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID" `
        "FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL" `
        "FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Environment variables set successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now rebuild and redeploy your app:" -ForegroundColor Yellow
    Write-Host "  .\build-and-push.ps1" -ForegroundColor Cyan
    Write-Host "  .\deploy-to-azure.ps1" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to set environment variables" -ForegroundColor Red
}
