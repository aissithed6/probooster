#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Nouvelles informations de contact
const NEW_CONTACT_INFO = {
  phone: '+229 91 50 57 57',
  phoneLink: 'tel:+22991505757',
  email: 'support@probooster.online',
  emailLink: 'mailto:support@probooster.online',
  website: 'https://probooster.online',
  contactEmail: 'contact@probooster.online',
  address: 'Abomey-Calavi, Bénin',
  location: 'Abomey-Calavi, Bénin',
  availability: '24h/24, 7j/7'
};

// Anciennes informations à remplacer
const OLD_CONTACT_INFO = {
  phone: ['+229 91 50 57 57', '+229 91 50 57 57', '+229 91 50 57 57'],
  email: ['support@probooster.online', 'contact@probooster.online'],
  website: ['https://probooster.online', 'https://probooster.online'],
  hours: ['24h/24, 7j/7', '24h/24, 7j/7', '24h/24, 7j/7'],
  address: ['Abidjan, Côte d\'Ivoire', 'Abomey-Calavi, Bénin', 'Côte d\'Ivoire', 'Abomey-Calavi, Bénin'],
  location: ['Abidjan, Côte d\'Ivoire', 'Abomey-Calavi, Bénin', 'Côte d\'Ivoire', 'Abomey-Calavi, Bénin']
};

// Fonction pour mettre à jour les informations de contact
function updateContactInfo(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remplacer les numéros de téléphone
    OLD_CONTACT_INFO.phone.forEach(oldPhone => {
      if (content.includes(oldPhone)) {
        content = content.replace(new RegExp(oldPhone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_CONTACT_INFO.phone);
        modified = true;
      }
    });

    // Remplacer les liens téléphone
    content = content.replace(/href="tel:\+229 91 50 57 57"/g, `href="${NEW_CONTACT_INFO.phoneLink}"`);
    content = content.replace(/href="tel:\+229 91 50 57 57"/g, `href="${NEW_CONTACT_INFO.phoneLink}"`);

    // Remplacer les emails
    OLD_CONTACT_INFO.email.forEach(oldEmail => {
      if (content.includes(oldEmail)) {
        content = content.replace(new RegExp(oldEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), oldEmail.includes('contact') ? NEW_CONTACT_INFO.contactEmail : NEW_CONTACT_INFO.email);
        modified = true;
      }
    });

    // Remplacer les liens email
    content = content.replace(/href="mailto:support@probooster\.com"/g, `href="${NEW_CONTACT_INFO.emailLink}"`);
    content = content.replace(/href="mailto:contact@probooster\.com"/g, `href="mailto:${NEW_CONTACT_INFO.contactEmail}"`);

    // Remplacer les sites web
    OLD_CONTACT_INFO.website.forEach(oldWebsite => {
      if (content.includes(oldWebsite)) {
        content = content.replace(new RegExp(oldWebsite.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_CONTACT_INFO.website);
        modified = true;
      }
    });

    // Remplacer les horaires
    OLD_CONTACT_INFO.hours.forEach(oldHours => {
      if (content.includes(oldHours)) {
        content = content.replace(new RegExp(oldHours.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '24h/24, 7j/7');
        modified = true;
      }
    });

    // Mettre à jour les placeholders
    content = content.replace(/placeholder="\+229 91 50 57 57"/g, `placeholder="${NEW_CONTACT_INFO.phone}"`);

    // Remplacer les adresses de localisation
    OLD_CONTACT_INFO.address.forEach(oldAddress => {
      if (content.includes(oldAddress)) {
        content = content.replace(new RegExp(oldAddress.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_CONTACT_INFO.address);
        modified = true;
      }
    });

    // Remplacer les localisations
    OLD_CONTACT_INFO.location.forEach(oldLocation => {
      if (content.includes(oldLocation)) {
        content = content.replace(new RegExp(oldLocation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), NEW_CONTACT_INFO.location);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Mis à jour: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de ${filePath}:`, error.message);
    return false;
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
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.jsx')) {
      callback(filePath);
    }
  });
}

// Exécuter les mises à jour
console.log('🔄 Mise à jour des informations de contact...\n');

const projectRoot = process.cwd();
let updatedFiles = 0;

walkDir(projectRoot, (filePath) => {
  if (updateContactInfo(filePath)) {
    updatedFiles++;
  }
});

console.log(`\n✅ Mise à jour terminée !`);
console.log(`📊 ${updatedFiles} fichier(s) mis à jour`);
console.log(`\n📋 Nouvelles informations de contact :`);
console.log(`📞 Téléphone: ${NEW_CONTACT_INFO.phone}`);
console.log(`📧 Email: ${NEW_CONTACT_INFO.email}`);
console.log(`🌐 Site web: ${NEW_CONTACT_INFO.website}`);
console.log(`📧 Contact: ${NEW_CONTACT_INFO.contactEmail}`);
console.log(`⏰ Disponibilité: 24h/24, 7j/7`);
