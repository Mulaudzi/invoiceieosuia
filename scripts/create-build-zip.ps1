$ErrorActionPreference = 'Stop'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$distDir = Join-Path $projectRoot 'dist'
$apiDir = Join-Path $projectRoot 'api'
$apiEnv = Join-Path $apiDir '.env'
$preferredOutputZip = Join-Path $projectRoot 'build-package.zip'
$outputZip = $preferredOutputZip
$maxAttempts = 5

Write-Host 'Preparing build zip...'

if (-not (Test-Path $distDir)) {
  throw 'dist directory not found. Run the frontend build first.'
}

if (-not (Test-Path $apiDir)) {
  throw 'api directory not found.'
}

if (-not (Test-Path $apiEnv)) {
  throw 'api/.env not found. The deployment package requires the production environment file.'
}

if (Test-Path $preferredOutputZip) {
  Write-Host 'Removing previous build-package.zip...'
  try {
    Remove-Item -LiteralPath $preferredOutputZip -Force
  }
  catch {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $outputZip = Join-Path $projectRoot ("build-package-" + $timestamp + ".zip")
    Write-Host "build-package.zip is locked; using $([System.IO.Path]::GetFileName($outputZip)) instead."
  }
}

Write-Host 'Creating zip archive (api folder + dist contents)...'
$distItems = Get-ChildItem -LiteralPath $distDir -Force | ForEach-Object { $_.FullName }
$archivePaths = @($apiDir) + $distItems

$zipCreated = $false
for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
  try {
    if (Test-Path $outputZip) {
      Remove-Item -LiteralPath $outputZip -Force -ErrorAction SilentlyContinue
    }

    Compress-Archive -Path $archivePaths -DestinationPath $outputZip -Force
    $zipCreated = $true
    break
  }
  catch {
    if ($attempt -eq $maxAttempts) {
      throw
    }

    Write-Host "Zip attempt $attempt failed, retrying..."
    Start-Sleep -Milliseconds 750
  }
}

if (-not $zipCreated) {
  throw 'Failed to create zip after retries.'
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($outputZip)
try {
  $hasEnvironment = $archive.Entries | Where-Object {
    $_.FullName.Replace('\', '/') -eq 'api/.env'
  }

  if (-not $hasEnvironment) {
    throw 'Deployment archive is missing api/.env.'
  }
}
finally {
  $archive.Dispose()
}

$zipSize = (Get-Item $outputZip).Length
Write-Host "Created $([System.IO.Path]::GetFileName($outputZip)) ($zipSize bytes)"
