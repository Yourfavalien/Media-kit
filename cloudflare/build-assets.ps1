$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $projectRoot '.cloudflare-public'

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

$assets = @(
  'index.html',
  'login.html',
  'styles.css',
  'portal.js',
  'privacy.html',
  'terms.html',
  'yourfavalien-banner.png',
  'yourfavalien-ufo-logo.png',
  'yfa-headquarters-logo.svg',
  'tiktok7qIOkJ4v4PNPOojBvJIWeoaKlbh6VJBE.txt',
  '.assetsignore'
)

foreach ($asset in $assets) {
  Copy-Item -LiteralPath (Join-Path $projectRoot $asset) -Destination (Join-Path $outputDir $asset) -Force
}

Write-Output "Prepared $($assets.Count) Headquarters assets."
