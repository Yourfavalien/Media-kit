$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $projectRoot '.cloudflare-public'

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

$assets = @(
  '06_YFA_Chrome_Monogram.png',
  '06_YFA_Chrome_Monogram_Clean.png',
  '03b_Four_Point_Chrome_Star.png',
  'favicon.png',
  'favicon.ico',
  'apple-touch-icon.png',
  '01_Primary_Chrome_Wordmark.png',
  '01_Primary_Chrome_Wordmark_Clean.png',
  'index.html',
  'login.html',
  'styles.css',
  'portal.js',
  'business-guide.js',
  'xilo-control.html',
  'xilo-control.css',
  'xilo-control.js',
  'privacy.html',
  'terms.html',
  'yourfavalien-banner.png',
  'yourfavalien-ufo-logo.png',
  'yourfavalien-ufo-clean.png',
  'yfa-headquarters-logo.svg',
  'tiktok7qIOkJ4v4PNPOojBvJIWeoaKlbh6VJBE.txt',
  '.assetsignore'
)

foreach ($asset in $assets) {
  Copy-Item -LiteralPath (Join-Path $projectRoot $asset) -Destination (Join-Path $outputDir $asset) -Force
}

Write-Output "Prepared $($assets.Count) Headquarters assets."
