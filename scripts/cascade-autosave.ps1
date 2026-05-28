$ErrorActionPreference = 'SilentlyContinue'

$ProjectPath = 'd:\Probooster\Ecommerce\MP1'
$LogFile = Join-Path $ProjectPath 'CASCADE_LOG.md'
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$DesktopCopy = Join-Path $DesktopPath 'MP1_CASCADE_LOG.md'

while ($true) {
  $ts = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')

  if (Test-Path $LogFile) {
    Add-Content -Path $LogFile -Value "`n- Auto-save heartbeat: $ts" -Encoding UTF8
    Copy-Item -Path $LogFile -Destination $DesktopCopy -Force
  }

  Start-Sleep -Seconds 60
}
