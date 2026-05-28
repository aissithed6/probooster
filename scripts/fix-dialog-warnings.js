#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fonction pour corriger les DialogContent
function fixDialogContent(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Ajouter DialogDescription à l'import si nécessaire
    if (content.includes('DialogContent') && !content.includes('DialogDescription')) {
      content = content.replace(
        /import \{ ([^}]+) \} from ["']@\/components\/ui\/dialog["']/g,
        (match, imports) => {
          if (!imports.includes('DialogDescription')) {
            return `import { ${imports}, DialogDescription } from "@/components/ui/dialog"`;
          }
          return match;
        }
      );
      modified = true;
    }

    // Ajouter DialogDescription aux DialogContent qui n'en ont pas
    content = content.replace(
      /(<DialogContent[^>]*>)\s*<DialogHeader[^>]*>\s*<DialogTitle[^>]*>[^<]*<\/DialogTitle>\s*<\/DialogHeader>/g,
      (match, dialogContent, dialogHeader, dialogTitle) => {
        const titleMatch = dialogTitle.match(/<DialogTitle[^>]*>([^<]*)<\/DialogTitle>/);
        if (titleMatch) {
          const title = titleMatch[1].trim();
          let description = '';
          
          // Générer une description basée sur le titre
          if (title.includes('Points')) {
            description = 'Gérez vos points de fidélité et consultez votre solde actuel';
          } else if (title.includes('Livraison')) {
            description = 'Suivez vos commandes en temps réel et gérez vos livraisons';
          } else if (title.includes('Panier')) {
            description = 'Consultez et gérez vos articles dans le panier';
          } else if (title.includes('Comparaison')) {
            description = 'Comparez les caractéristiques et prix de vos produits sélectionnés';
          } else if (title.includes('Favoris')) {
            description = 'Consultez et gérez vos produits favoris';
          } else if (title.includes('Abonnement')) {
            description = 'Votre abonnement aux notifications WhatsApp a été activé avec succès';
          } else {
            description = 'Interface de dialogue pour ' + title.toLowerCase();
          }
          
          return `${dialogContent}\n                <DialogHeader>\n                  ${dialogTitle}\n                  <DialogDescription>\n                    ${description}\n                  </DialogDescription>\n                </DialogHeader>`;
        }
        return match;
      }
    );

    // Corriger les images avec des problèmes de ratio
    content = content.replace(
      /<Image\s+src="\/images\/logo\.png"[^>]*className="[^"]*h-10 w-auto"[^>]*>/g,
      (match) => {
        if (!match.includes('style=')) {
          return match.replace('>', ' style={{ width: "auto", height: "40px" }}>');
        }
        return match;
      }
    );

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigé: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la correction de ${filePath}:`, error.message);
  }
}

// Fonction pour parcourir récursivement les fichiers
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath, callback);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  });
}

// Exécuter les corrections
console.log('🔧 Correction des avertissements DialogContent et images...\n');

const projectRoot = process.cwd();
walkDir(projectRoot, (filePath) => {
  if (filePath.includes('DialogContent') || filePath.includes('logo.png')) {
    fixDialogContent(filePath);
  }
});

console.log('\n✅ Correction terminée !');
console.log('\n📋 Résumé des corrections :');
console.log('• Ajout de DialogDescription aux DialogContent manquants');
console.log('• Correction des ratios d\'aspect des images logo.png');
console.log('• Ajout des imports DialogDescription nécessaires');
