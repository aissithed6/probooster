"use client"

import { supabase } from '@/lib/supabase'

export default function TestSupabaseDetailed() {
  const testTables = async () => {
    console.log('🔍 Test détaillé des tables Supabase...')

    const tables = [
      'boosting_services',
      'boosting_campaigns',
      'promotions',
      'products'
    ]

    for (const tableName of tables) {
      try {
        console.log(`\n📋 Test de la table: ${tableName}`)

        // Test de sélection simple
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (error) {
          console.error(`❌ Erreur ${tableName}:`, error)
        } else {
          console.log(`✅ ${tableName} OK - Nombre d'enregistrements:`, data?.length || 0)
          if (data && data.length > 0) {
            console.log('Exemple de données:', data[0])
          }
        }

      } catch (error) {
        console.error(`❌ Exception ${tableName}:`, error)
      }
    }

    // Test de la structure des tables
    console.log('\n📊 Test de la structure des tables...')
    try {
      const { data, error } = await supabase.rpc('get_table_info')
      if (error) {
        console.log('RPC get_table_info non disponible, test manuel...')
        // Test manuel des colonnes
        for (const tableName of tables) {
          try {
            const { data: columns, error: columnsError } = await supabase
              .from(tableName)
              .select('*')
              .limit(0)

            if (!columnsError) {
              console.log(`✅ ${tableName} - Colonnes disponibles`)
            } else {
              console.error(`❌ ${tableName} - Erreur colonnes:`, columnsError.message)
            }
          } catch (e) {
            console.error(`❌ ${tableName} - Exception colonnes:`, e)
          }
        }
      } else {
        console.log('Structure des tables:', data)
      }
    } catch (error) {
      console.error('Erreur test structure:', error)
    }
  }

  return (
    <div className="p-6">
      <h1>Test Détaillé Supabase</h1>
      <button
        onClick={testTables}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Tester toutes les tables
      </button>
    </div>
  )
}
