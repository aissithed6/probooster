# 🛡️ PROCÉDURE DE SÉCURITÉ - ÉVITER LA SUPPRESSION ACCIDENTELLE

## 🚨 AVANT CHAQUE MODIFICATION

### **Étape 1: Vérification des Fichiers Critiques**
```powershell
# Exécuter le script de vérification
.\check-critical-files.ps1
```

### **Étape 2: Sauvegarde Automatique**
```powershell
# Créer une sauvegarde de sécurité
.\backup-critical-files.ps1
```

### **Étape 3: Vérification Git**
```bash
# Vérifier l'état du repository
git status
git add .
git commit -m "Sauvegarde avant modification: [description]"
```

## ⚠️ RÈGLES D'OR

### **❌ NE JAMAIS FAIRE :**
- Supprimer des fichiers sans sauvegarde
- Modifier `app/layout.tsx` sans comprendre l'impact
- Supprimer des composants sans vérifier les dépendances
- Ignorer les erreurs de compilation

### **✅ TOUJOURS FAIRE :**
- Sauvegarder avant modification
- Tester après modification
- Vérifier les imports et dépendances
- Utiliser git pour le versioning

## 🔄 PROCÉDURE DE RÉCUPÉRATION

### **Si un fichier critique est supprimé :**

1. **Arrêter immédiatement** toute modification
2. **Exécuter** `.\check-critical-files.ps1` pour identifier les manquants
3. **Restaurer** depuis la dernière sauvegarde
4. **Vérifier** la cohérence des imports
5. **Tester** l'application complètement

### **Commandes de récupération :**
```powershell
# Restaurer depuis la dernière sauvegarde
$latestBackup = Get-ChildItem "backups" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Copy-Item "$latestBackup\*" . -Recurse -Force

# Vérifier que tout est restauré
.\check-critical-files.ps1
```

## 📞 CONTACT D'URGENCE

En cas de problème critique :
1. **Ne pas paniquer**
2. **Arrêter** toute modification
3. **Utiliser** les scripts de récupération
4. **Documenter** ce qui s'est passé

## 🎯 OBJECTIF

**Maintenir l'intégrité de l'application en tout temps !**

