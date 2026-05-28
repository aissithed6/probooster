param(
  [string]$BaseUrl = "http://localhost:3000",
  [int]$IntervalSeconds = 60
)

# Boucle qui envoie le contenu du presse-papiers à l'API d'append.
# Usage:
# 1) Lance ton app Next.js
# 2) Ouvre PowerShell puis:
#    powershell -ExecutionPolicy Bypass -File .\tools\chat-autosave.ps1 -BaseUrl "http://localhost:3000" -IntervalSeconds 60
# 3) Copie/colle régulièrement la discussion dans ton presse-papiers (Ctrl+A puis Ctrl+C dans Windsurf)

$lastHash = ""

function Append-LocalAutosave {
  param(
    [Parameter(Mandatory = $true)][string]$Text
  )

  try {
    $projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
    $autosaveDir = Join-Path $projectRoot "_chat_logs"
    $autosaveFile = Join-Path $autosaveDir "auto-save.md"
    if (!(Test-Path $autosaveDir)) {
      New-Item -ItemType Directory -Path $autosaveDir -Force | Out-Null
    }

    $stamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    $block = "`n`n---`n`n## $stamp`n`n$Text`n"
    Add-Content -Path $autosaveFile -Value $block -Encoding UTF8
  } catch {
    # noop
  }
}

while ($true) {
  try {
    $clip = Get-Clipboard -Raw
    if ($null -ne $clip) {
      $text = $clip.Trim()
      if ($text.Length -gt 0) {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
        $hash = [System.BitConverter]::ToString((New-Object System.Security.Cryptography.SHA256Managed).ComputeHash($bytes))

        if ($hash -ne $lastHash) {
          $payload = @{ text = $text } | ConvertTo-Json -Depth 5
          try {
            Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/internal/chat-history/append" -ContentType "application/json" -Body $payload | Out-Null
          } catch {
            Append-LocalAutosave -Text $text
          }
          $lastHash = $hash
        }
      }
    }
  } catch {
    # noop
  }

  Start-Sleep -Seconds $IntervalSeconds
}
