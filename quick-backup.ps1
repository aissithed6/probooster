# SAUVEGARDE RAPIDE DES FICHIERS CRITIQUES
# Executer avant chaque modification

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFolder = "backup_$timestamp"

Write-Host "Creation de la sauvegarde: $backupFolder" -ForegroundColor Yellow

# Creer le dossier de sauvegarde
New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null

# Fichiers critiques a sauvegarder
$files = @(
    "app/layout.tsx",
    "app/page.tsx", 
    "lib/chat-context.tsx",
    "components/ui/modern-notification.tsx",
    "components/layout/header-modular.tsx",
    "components/layout/footer.tsx",
    "components/chat/global-chat-widget.tsx",
    "components/chat/chat-widget.tsx",
    "components/seller-dashboard/messaging-section.tsx",
    "components/seller-dashboard/ranking-section.tsx",
    "components/seller-dashboard/payment-requests-section.tsx",
    "components/seller-dashboard/order-management.tsx"
)

$saved = 0
foreach ($file in $files) {
    if (Test-Path $file) {
        $backupFile = "$backupFolder\$($file.Replace('/', '_'))"
        Copy-Item $file $backupFile -Force
        $saved++
        Write-Host "OK: $file" -ForegroundColor Green
    }
}

Write-Host "`nSauvegarde terminee: $saved fichiers sauvegardes dans $backupFolder" -ForegroundColor Green
Write-Host "Vous pouvez maintenant modifier en toute securite!" -ForegroundColor Yellow

