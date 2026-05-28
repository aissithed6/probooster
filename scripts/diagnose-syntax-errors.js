const fs = require('fs');
const path = require('path');

// Fonction pour vérifier la syntaxe d'un fichier
function checkFileSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Vérifier les lignes trop longues
      if (line.length > 120) {
        issues.push({
          line: lineNumber,
          type: 'Ligne trop longue',
          length: line.length,
          preview: line.substring(0, 100) + '...'
        });
      }
      
      // Vérifier les guillemets non fermés
      const singleQuotes = (line.match(/'/g) || []).length;
      const doubleQuotes = (line.match(/"/g) || []).length;
      const backticks = (line.match(/`/g) || []).length;
      
      if (singleQuotes % 2 !== 0) {
        issues.push({
          line: lineNumber,
          type: 'Guillemets simples non fermés',
          preview: line.trim()
        });
      }
      
      if (doubleQuotes % 2 !== 0) {
        issues.push({
          line: lineNumber,
          type: 'Guillemets doubles non fermés',
          preview: line.trim()
        });
      }
      
      if (backticks % 2 !== 0) {
        issues.push({
          line: lineNumber,
          type: 'Backticks non fermés',
          preview: line.trim()
        });
      }
      
      // Vérifier les parenthèses non fermées
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      
      if (openParens !== closeParens) {
        issues.push({
          line: lineNumber,
          type: 'Parenthèses non fermées',
          preview: line.trim()
        });
      }
      
      // Vérifier les accolades non fermées
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      
      if (openBraces !== closeBraces) {
        issues.push({
          line: lineNumber,
          type: 'Accolades non fermées',
          preview: line.trim()
        });
      }
      
      // Vérifier les crochets non fermés
      const openBrackets = (line.match(/\[/g) || []).length;
      const closeBrackets = (line.match(/\]/g) || []).length;
      
      if (openBrackets !== closeBrackets) {
        issues.push({
          line: lineNumber,
          type: 'Crochets non fermés',
          preview: line.trim()
        });
      }
    });
    
    return issues;
  } catch (error) {
    return [{
      line: 0,
      type: 'Erreur de lecture',
      error: error.message
    }];
  }
}

// Fonction pour scanner récursivement un dossier
function scanDirectory(dirPath, fileExtensions = ['.tsx', '.ts', '.js', '.jsx']) {
  const results = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        results.push(...scanDirectory(fullPath, fileExtensions));
      } else if (stat.isFile() && fileExtensions.some(ext => item.endsWith(ext))) {
        const issues = checkFileSyntax(fullPath);
        if (issues.length > 0) {
          results.push({
            file: fullPath,
            issues
          });
        }
      }
    }
  } catch (error) {
    console.error(`Erreur lors du scan de ${dirPath}:`, error.message);
  }
  
  return results;
}

// Fonction principale
function main() {
  console.log('🔍 Diagnostic des erreurs de syntaxe...\n');
  
  const projectRoot = process.cwd();
  const results = scanDirectory(projectRoot);
  
  if (results.length === 0) {
    console.log('✅ Aucune erreur de syntaxe détectée !');
    return;
  }
  
  console.log(`❌ ${results.length} fichier(s) avec des problèmes détectés :\n`);
  
  results.forEach(({ file, issues }) => {
    const relativePath = path.relative(projectRoot, file);
    console.log(`📁 ${relativePath}:`);
    
    issues.forEach(issue => {
      if (issue.line > 0) {
        console.log(`   Ligne ${issue.line}: ${issue.type}`);
        if (issue.preview) {
          console.log(`     ${issue.preview}`);
        }
      } else {
        console.log(`   ${issue.type}: ${issue.error}`);
      }
    });
    console.log('');
  });
  
  console.log('💡 Conseils pour résoudre ces problèmes :');
  console.log('   - Vérifiez que tous les guillemets, parenthèses, accolades et crochets sont fermés');
  console.log('   - Évitez les lignes trop longues (plus de 120 caractères)');
  console.log('   - Utilisez un éditeur avec coloration syntaxique pour détecter les erreurs');
  console.log('   - Vérifiez la syntaxe avec ESLint ou TypeScript');
}

// Exécuter le diagnostic
if (require.main === module) {
  main();
}

module.exports = { checkFileSyntax, scanDirectory };
