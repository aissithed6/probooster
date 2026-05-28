// Utilitaire pour générer des spécifications techniques selon le type de produit

export interface ProductSpecifications {
  // Spécifications techniques générales
  screen?: string
  processor?: string
  memory?: string
  storage?: string
  battery?: string
  camera?: string
  os?: string
  dimensions?: string
  weight?: string
  colors?: string[]
  
  // Spécifications audio (casques)
  driver?: string
  noiseCancellation?: string
  waterResistance?: string
  
  // Spécifications gaming
  graphics?: string
  opticalDrive?: string
  
  // Spécifications connectivité
  connectivity?: string
  warranty?: string
}

export function generateProductSpecifications(productName: string, productType?: string): ProductSpecifications {
  const name = productName.toLowerCase()
  
  // Détecter le type de produit basé sur le nom
  const isSmartphone = name.includes('iphone') || name.includes('samsung') || name.includes('galaxy') || name.includes('smartphone') || name.includes('pro') || name.includes('max') || name.includes('fold') || name.includes('z')
  const isLaptop = name.includes('macbook') || name.includes('laptop') || name.includes('ordinateur')
  const isTablet = name.includes('ipad') || name.includes('tablet')
  const isHeadphone = name.includes('airpods') || name.includes('casque') || name.includes('headphone')
  const isWatch = name.includes('watch') || name.includes('montre')
  const isGaming = name.includes('playstation') || name.includes('xbox') || name.includes('gaming')
  
  if (isSmartphone) {
    return generateSmartphoneSpecs(productName)
  } else if (isLaptop) {
    return generateLaptopSpecs(productName)
  } else if (isTablet) {
    return generateTabletSpecs(productName)
  } else if (isHeadphone) {
    return generateHeadphoneSpecs(productName)
  } else if (isWatch) {
    return generateWatchSpecs(productName)
  } else if (isGaming) {
    return generateGamingSpecs(productName)
  }
  
  // Spécifications par défaut
  return {
    os: "Compatible multi-plateforme",
    connectivity: "WiFi + Bluetooth",
    warranty: "12 mois"
  }
}

function generateSmartphoneSpecs(name: string): ProductSpecifications {
  const specs: ProductSpecifications = {
    os: "iOS 17 / Android 14",
    connectivity: "5G + WiFi 6 + Bluetooth 5.3",
    warranty: "12 mois"
  }
  
  if (name.toLowerCase().includes('iphone')) {
    specs.screen = "6.7\" Super Retina XDR OLED"
    specs.processor = "A17 Pro chip"
    specs.memory = "8GB RAM"
    specs.storage = "256GB / 512GB / 1TB"
    specs.battery = "4441 mAh, 20W charge"
    specs.camera = "48MP + 12MP + 12MP"
    specs.dimensions = "159.9 x 76.7 x 8.25 mm"
    specs.weight = "221g"
    specs.colors = ["Titan naturel", "Titan bleu", "Titan blanc", "Titan noir"]
  } else if (name.toLowerCase().includes('samsung') || name.toLowerCase().includes('galaxy')) {
    specs.screen = "6.8\" Dynamic AMOLED 2X"
    specs.processor = "Snapdragon 8 Gen 3"
    specs.memory = "12GB RAM"
    specs.storage = "256GB / 512GB / 1TB"
    specs.battery = "5000 mAh, 45W charge"
    specs.camera = "200MP + 12MP + 50MP"
    specs.dimensions = "163.4 x 78.1 x 8.6 mm"
    specs.weight = "232g"
    specs.colors = ["Titanium Gray", "Titanium Black", "Titanium Violet"]
  } else {
    // Spécifications génériques pour smartphones
    specs.screen = "6.5\" AMOLED / IPS LCD"
    specs.processor = "Octa-core 2.8 GHz"
    specs.memory = "8GB RAM"
    specs.storage = "128GB / 256GB"
    specs.battery = "4500 mAh, charge rapide"
    specs.camera = "48MP + 8MP + 2MP"
    specs.dimensions = "160 x 75 x 8.5 mm"
    specs.weight = "200g"
    specs.colors = ["Noir", "Blanc", "Bleu"]
  }
  
  return specs
}

function generateLaptopSpecs(name: string): ProductSpecifications {
  const specs: ProductSpecifications = {
    os: "macOS Sonoma / Windows 11",
    connectivity: "WiFi 6E + Bluetooth 5.3",
    warranty: "12 mois"
  }
  
  if (name.includes('macbook')) {
    if (name.includes('pro')) {
      specs.screen = "14\" Liquid Retina XDR"
      specs.processor = "Apple M3 Pro / M3 Max"
      specs.memory = "18GB / 36GB / 96GB RAM"
      specs.storage = "512GB / 1TB / 2TB / 4TB / 8TB"
      specs.battery = "72.4 Wh, jusqu'à 22h"
      specs.dimensions = "312.6 x 221.2 x 15.5 mm"
      specs.weight = "1.61kg"
      specs.colors = ["Argent", "Espace gris"]
    } else {
      specs.screen = "15.3\" Liquid Retina"
      specs.processor = "Apple M3"
      specs.memory = "8GB / 16GB / 24GB RAM"
      specs.storage = "256GB / 512GB / 1TB / 2TB"
      specs.battery = "66.5 Wh, jusqu'à 18h"
      specs.dimensions = "340.4 x 233.1 x 11.5 mm"
      specs.weight = "1.51kg"
      specs.colors = ["Argent", "Espace gris", "Or", "Minuit"]
    }
  } else {
    // Spécifications génériques pour laptops
    specs.screen = "15.6\" Full HD IPS"
    specs.processor = "Intel Core i7 / AMD Ryzen 7"
    specs.memory = "16GB DDR4 RAM"
    specs.storage = "512GB SSD + 1TB HDD"
    specs.battery = "6 cellules, jusqu'à 8h"
    specs.dimensions = "360 x 240 x 20 mm"
    specs.weight = "2.2kg"
    specs.colors = ["Noir", "Argent"]
  }
  
  return specs
}

function generateTabletSpecs(name: string): ProductSpecifications {
  const specs: ProductSpecifications = {
    os: "iPadOS 17",
    connectivity: "WiFi 6 + Bluetooth 5.3",
    warranty: "12 mois"
  }
  
  if (name.includes('ipad')) {
    specs.screen = "12.9\" Liquid Retina XDR"
    specs.processor = "Apple M2 chip"
    specs.memory = "8GB RAM"
    specs.storage = "128GB / 256GB / 512GB / 1TB / 2TB"
    specs.battery = "40.88 Wh, jusqu'à 10h"
    specs.camera = "12MP + 10MP + LiDAR"
    specs.dimensions = "280.6 x 214.9 x 6.4 mm"
    specs.weight = "682g"
    specs.colors = ["Argent", "Espace gris"]
  } else {
    // Spécifications génériques pour tablettes
    specs.screen = "10.1\" IPS LCD"
    specs.processor = "Octa-core 2.0 GHz"
    specs.memory = "4GB RAM"
    specs.storage = "64GB / 128GB"
    specs.battery = "6000 mAh, jusqu'à 8h"
    specs.camera = "8MP + 2MP"
    specs.dimensions = "250 x 160 x 8 mm"
    specs.weight = "500g"
    specs.colors = ["Noir", "Blanc", "Bleu"]
  }
  
  return specs
}

function generateHeadphoneSpecs(name: string): ProductSpecifications {
  const specs: ProductSpecifications = {
    connectivity: "Bluetooth 5.3 + U1 chip",
    warranty: "12 mois"
  }
  
  if (name.includes('airpods')) {
    if (name.includes('pro')) {
      specs.driver = "Custom high-excursion driver"
      specs.noiseCancellation = "Active Noise Cancellation"
      specs.battery = "Jusqu'à 6h (30h avec boîtier)"
      specs.waterResistance = "IPX4"
      specs.colors = ["Blanc"]
    } else {
      specs.driver = "Custom high-excursion driver"
      specs.noiseCancellation = "Adaptive EQ"
      specs.battery = "Jusqu'à 6h (30h avec boîtier)"
      specs.colors = ["Blanc"]
    }
  } else {
    // Spécifications génériques pour casques
    specs.driver = "40mm Dynamic Driver"
    specs.noiseCancellation = "Passive Noise Isolation"
    specs.battery = "Jusqu'à 20h (40h avec boîtier)"
    specs.waterResistance = "IPX2"
    specs.colors = ["Noir", "Blanc", "Bleu"]
  }
  
  return specs
}

function generateWatchSpecs(name: string): ProductSpecifications {
  const specs: ProductSpecifications = {
    os: "watchOS 10",
    connectivity: "WiFi + Bluetooth 5.3 + Cellular",
    warranty: "12 mois"
  }
  
  if (name.includes('watch')) {
    specs.screen = "49mm Always-On Retina"
    specs.processor = "Apple S9 SiP"
    specs.memory = "64GB"
    specs.battery = "Jusqu'à 18h"
    specs.waterResistance = "IP6X + 50m"
    specs.dimensions = "49 x 44 x 14.4 mm"
    specs.weight = "51.5g"
    specs.colors = ["Argent", "Or", "Graphite", "Titanium"]
  } else {
    // Spécifications génériques pour montres
    specs.screen = "1.4\" AMOLED"
    specs.processor = "ARM Cortex-M4"
    specs.memory = "16MB"
    specs.battery = "Jusqu'à 7 jours"
    specs.waterResistance = "IP68 + 5ATM"
    specs.dimensions = "45 x 45 x 12 mm"
    specs.weight = "45g"
    specs.colors = ["Noir", "Argent", "Or"]
  }
  
  return specs
}

function generateGamingSpecs(name: string): ProductSpecifications {
  const specs: ProductSpecifications = {
    os: "PlayStation 5 OS",
    connectivity: "WiFi 6 + Ethernet + Bluetooth 5.1",
    warranty: "24 mois"
  }
  
  if (name.includes('playstation')) {
    specs.processor = "AMD Zen 2 (8 cores, 3.5 GHz)"
    specs.memory = "16GB GDDR6"
    specs.storage = "825GB SSD NVMe"
    specs.graphics = "AMD RDNA 2 (10.3 TFLOPs)"
    specs.opticalDrive = "4K UHD Blu-ray"
    specs.dimensions = "390 x 260 x 104 mm"
    specs.weight = "4.5kg"
    specs.colors = ["Blanc", "Noir"]
  } else if (name.includes('xbox')) {
    specs.processor = "AMD Zen 2 (8 cores, 3.8 GHz)"
    specs.memory = "16GB GDDR6"
    specs.storage = "1TB SSD NVMe"
    specs.graphics = "AMD RDNA 2 (12 TFLOPs)"
    specs.opticalDrive = "4K UHD Blu-ray"
    specs.dimensions = "301 x 151 x 151 mm"
    specs.weight = "3.2kg"
    specs.colors = ["Noir"]
  } else {
    // Spécifications génériques pour gaming
    specs.processor = "AMD Ryzen 7 / Intel Core i7"
    specs.memory = "16GB DDR4 RAM"
    specs.storage = "1TB SSD"
    specs.graphics = "NVIDIA RTX 3060 / AMD RX 6600"
    specs.dimensions = "400 x 200 x 100 mm"
    specs.weight = "3.5kg"
    specs.colors = ["Noir", "Rouge", "Bleu"]
  }
  
  return specs
}

// Fonction pour enrichir un produit avec des spécifications
export function enrichProductWithSpecs(product: any): any {
  // Forcer la régénération complète des spécifications
  product.specifications = generateProductSpecifications(product.name, product.type)
  return product
}

// Fonction pour enrichir une liste de produits
export function enrichProductsWithSpecs(products: any[]): any[] {
  return products.map(product => enrichProductWithSpecs(product))
}
