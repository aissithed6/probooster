# PROTECTION SCRIPT - VERIFICATION DES FICHIERS CRITIQUES
# Executer ce script avant et apres chaque modification

Write-Host "VERIFICATION DES FICHIERS CRITIQUES..." -ForegroundColor Yellow

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

$missingFiles = @()
$existingFiles = @()

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        $existingFiles += $file
        Write-Host "OK: $file" -ForegroundColor Green
    } else {
        $missingFiles += $file
        Write-Host "ERREUR: $file - MANQUANT !" -ForegroundColor Red
    }
}

Write-Host "`nRESUME DE LA VERIFICATION:" -ForegroundColor Cyan
Write-Host "Fichiers presents: $($existingFiles.Count)/$($criticalFiles.Count)" -ForegroundColor Green

if ($missingFiles.Count -gt 0) {
    Write-Host "`nATTENTION: FICHIERS CRITIQUES MANQUANTS!" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    Write-Host "`nRESTAUREZ CES FICHIERS IMMEDIATEMENT!" -ForegroundColor Red
} else {
    Write-Host "`nTOUS LES FICHIERS CRITIQUES SONT PRESENTS!" -ForegroundColor Green
}

Write-Host "`nConseil: Executez ce script avant et apres chaque modification importante" -ForegroundColor Yellow
