# GitHub Push Script
# Usage: .\push-to-github.ps1 -RepoUrl "https://github.com/YOUR_USERNAME/YOUR_REPO.git"

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl
)

Write-Host "Adding remote origin..." -ForegroundColor Yellow
git remote add origin $RepoUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "Repository: $RepoUrl" -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ Push failed. Check your GitHub credentials and repository URL." -ForegroundColor Red
    }
} else {
    Write-Host "`n❌ Failed to add remote. Remote may already exist." -ForegroundColor Red
    Write-Host "Run: git remote remove origin (if needed) and try again." -ForegroundColor Yellow
}

