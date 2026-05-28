const fs = require('fs');
const path = require('path');

// Fonction pour corriger les erreurs de syntaxe courantes
function fixSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let fixed = false;
    
    // Correction 1: Lignes trop longues avec addNotification
    const longNotificationPattern = /addNotification\(\s*\{\s*type:\s*['"`]([^'"`]+)['"`],\s*title:\s*['"`]([^'"`]+)['"`],\s*message:\s*['"`]([^'"`]+)['"`]\s*\}\)/g;
    
    if (longNotificationPattern.test(content)) {
      content = content.replace(longNotificationPattern, (match, type, title, message) => {
        if (match.length > 120) {
          fixed = true;
          return `addNotification({ 
  type: '${type}', 
  title: '${title}', 
  message: '${message}' 
})`;
        }
        return match;
      });
    }
    
    // Correction 2: Vérifier et corriger les guillemets non fermés
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const singleQuotes = (line.match(/'/g) || []).length;
      const doubleQuotes = (line.match(/"/g) || []).length;
      const backticks = (line.match(/`/g) || []).length;
      
      if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0) {
        console.log(`⚠️  Ligne ${i + 1} dans ${filePath}: Guillemets non fermés détectés`);
        fixed = true;
      }
    }
    
    // Correction 3: Vérifier les parenthèses, accolades et crochets
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    
    if (openParens !== closeParens) {
      console.log(`⚠️  ${filePath}: Parenthèses non fermées (${openParens} ouvertes, ${closeParens} fermées)`);
      fixed = true;
    }
    
    if (openBraces !== closeBraces) {
      console.log(`⚠️  ${filePath}: Accolades non fermées (${openBraces} ouvertes, ${closeBraces} fermées)`);
      fixed = true;
    }
    
    if (openBrackets !== closeBrackets) {
      console.log(`⚠️  ${filePath}: Crochets non fermés (${openBrackets} ouverts, ${closeBrackets} fermés)`);
      fixed = true;
    }
    
    if (fixed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${filePath}: Corrigé`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors de la correction de ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour scanner et corriger récursivement un dossier
function fixDirectory(dirPath, fileExtensions = ['.tsx', '.ts', '.js', '.jsx']) {
  let totalFixed = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== '.next') {
        totalFixed += fixDirectory(fullPath, fileExtensions);
      } else if (stat.isFile() && fileExtensions.some(ext => item.endsWith(ext))) {
        if (fixSyntaxErrors(fullPath)) {
          totalFixed++;
        }
      }
    }
  } catch (error) {
    console.error(`Erreur lors du scan de ${dirPath}:`, error.message);
  }
  
  return totalFixed;
}

// Fonction principale
function main() {
  console.log('🔧 Correction automatique des erreurs de syntaxe...\n');
  
  const projectRoot = process.cwd();
  const totalFixed = fixDirectory(projectRoot);
  
  if (totalFixed === 0) {
    console.log('✅ Aucune erreur de syntaxe à corriger !');
  } else {
    console.log(`\n🎉 ${totalFixed} fichier(s) corrigé(s) avec succès !`);
  }
  
  console.log('\n💡 Prochaines étapes :');
  console.log('   1. Relancez le serveur de développement : npm run dev');
  console.log('   2. Vérifiez que l\'erreur "Invalid or unexpected token" a disparu');
  console.log('   3. Testez la fonctionnalité du site');
}

// Exécuter la correction
if (require.main === module) {
  main();
}

module.exports = { fixSyntaxErrors, fixDirectory };
