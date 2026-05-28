const fs = require('fs');
const path = require('path');

const dashboardPath = 'app/dashboard/page.tsx';

try {
  // Lire le fichier dashboard
  let content = fs.readFileSync(dashboardPath, 'utf8');
  
  // Trouver la dernière occurrence de })} avant la fermeture
  const lastNotificationEnd = content.lastIndexOf('              )}');
  
  if (lastNotificationEnd !== -1) {
    // Ajouter la section système après
    const beforeEnd = content.substring(0, lastNotificationEnd + 15);
    const afterEnd = content.substring(lastNotificationEnd + 15);
    
    const systemSettingsSection = `

            {activeTab === 'settings' && (
              <SystemSettingsSection />
            )}`;
    
    const newContent = beforeEnd + systemSettingsSection + afterEnd;
    
    // Écrire le fichier modifié
    fs.writeFileSync(dashboardPath, newContent, 'utf8');
    console.log('✅ Section Paramètres Système intégrée avec succès !');
  } else {
    console.log('❌ Pattern de fin non trouvé');
  }
} catch (error) {
  console.error('❌ Erreur:', error.message);
}

