param(
  [string]$ProjectRoot = $PSScriptRoot + "\..",
  [string]$SourceRelativePath = "logs\chat-history.md",
  [string]$DesktopFileName = "MP1-chat-history.md"
)

$root = Resolve-Path $ProjectRoot
$source = Join-Path $root $SourceRelativePath

if (!(Test-Path $source)) {
  Write-Error "Fichier introuvable: $source"
  exit 1
}

$desktop = [Environment]::GetFolderPath('Desktop')
$target = Join-Path $desktop $DesktopFileName

try {
  Copy-Item -Path $source -Destination $target -Force
  Write-Host "Copie OK -> $target"
  exit 0
} catch {
  Write-Error $_
  exit 1
}
