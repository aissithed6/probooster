# 🚨 SCRIPT DE SAUVEGARDE AUTOMATIQUE DES FICHIERS CRITIQUES
# Exécuter ce script avant chaque modification importante

$backupFolder = "backups/$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
$criticalFiles = @(
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

Write-Host "🚨 SAUVEGARDE AUTOMATIQUE DES FICHIERS CRITIQUES..." -ForegroundColor Yellow

# Créer le dossier de sauvegarde
if (!(Test-Path $backupFolder)) {
    New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
    Write-Host "📁 Dossier de sauvegarde créé: $backupFolder" -ForegroundColor Green
}

$backedUpFiles = 0
$failedFiles = @()

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        try {
            $backupPath = "$backupFolder/$($file.Replace('/', '_'))"
            Copy-Item $file $backupPath -Force
            $backedUpFiles++
            Write-Host "✅ $file sauvegardé" -ForegroundColor Green
        } catch {
            $failedFiles += $file
            Write-Host "❌ Erreur lors de la sauvegarde de $file" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  $file n'existe pas - impossible de sauvegarder" -ForegroundColor Yellow
    }
}

Write-Host "`n📊 RÉSUMÉ DE LA SAUVEGARDE:" -ForegroundColor Cyan
Write-Host "Fichiers sauvegardés: $backedUpFiles/$($criticalFiles.Count)" -ForegroundColor Green

if ($failedFiles.Count -gt 0) {
    Write-Host "`n❌ FICHIERS NON SAUVEGARDÉS:" -ForegroundColor Red
    foreach ($file in $failedFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
}

Write-Host "`n💾 Sauvegarde terminée dans: $backupFolder" -ForegroundColor Green
Write-Host "🔄 Pour restaurer: copiez les fichiers depuis ce dossier" -ForegroundColor Yellow

