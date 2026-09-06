import fs from 'fs';

let c = fs.readFileSync('components/layout/footer.tsx', 'utf8');

// 1. Add toast import after the existing imports
c = c.replace(
  'import { usePublicGlobalSettings } from "@/contexts/PublicGlobalSettingsContext"',
  'import { usePublicGlobalSettings } from "@/contexts/PublicGlobalSettingsContext"\nimport { toast } from "react-hot-toast"'
);

// 2. Replace all alert() with toast()
c = c.replace(
  'alert("Veuillez entrer votre numéro WhatsApp")',
  'toast.error("Veuillez entrer votre numéro WhatsApp")'
);

c = c.replace(
  'alert("Veuillez entrer un numéro WhatsApp valide")',
  'toast.error("Veuillez entrer un numéro WhatsApp valide")'
);

c = c.replace(
  /alert\(data\.error \|\| "Une erreur est survenue\. Veuillez réessayer\."\)/,
  'toast.error(data.error || "Une erreur est survenue. Veuillez réessayer.")'
);

c = c.replace(
  'alert("Une erreur est survenue. Veuillez réessayer.")',
  'toast.error("Une erreur est survenue. Veuillez réessayer.")'
);

fs.writeFileSync('components/layout/footer.tsx', c);
console.log('All alerts replaced with toasts');