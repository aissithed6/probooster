"use client"

import { supabase } from '@/lib/supabase'

export default function SupabaseSchemaAnalyzer() {
  const analyzeSchema = async () => {
    console.log('🔍 Analyse complète du schéma Supabase...')

    try {
      // 1. Récupérer la liste de toutes les tables
      console.log('\n📋 1. Récupération des tables...')

      // Utiliser une requête RPC pour obtenir les informations du schéma
      // Si la fonction n'existe pas, on utilisera une approche alternative
      const { data: tablesData, error: tablesError } = await supabase.rpc('get_table_info')

      if (tablesError) {
        console.log('❌ RPC get_table_info non disponible, utilisation de la méthode alternative...')

        // Méthode alternative : essayer de lister les tables via les types
        const commonTables = [
          'users', 'user_profiles', 'user_products', 'products', 'promotions',
          'user_orders', 'order_items', 'categories', 'user_notifications',
          'user_messages', 'user_chats', 'chat_messages', 'vendor_sales',
          'payment_requests', 'product_reviews', 'user_wishlists', 'user_carts',
          'user_sessions', 'activity_logs', 'system_settings', 'user_points',
          'loyalty_points'
        ]

        console.log('📋 Tables courantes définies dans les types :')
        commonTables.forEach(table => {
          console.log(`  - ${table}`)
        })

        // Test d'accès à chaque table
        console.log('\n🔍 Test d\'accès aux tables...')
        for (const tableName of commonTables) {
          await testTableAccess(tableName)
        }
      } else {
        console.log('✅ Tables récupérées via RPC :', tablesData)
      }

      // 2. Analyser les politiques RLS
      console.log('\n🔒 2. Analyse des politiques RLS...')
      await analyzeRLSPolicies()

      // 3. Analyser les vues
      console.log('\n👁️ 3. Analyse des vues...')
      await analyzeViews()

      // 4. Analyser les fonctions
      console.log('\n⚙️ 4. Analyse des fonctions...')
      await analyzeFunctions()

      // 5. Résumé
      console.log('\n📊 RÉSUMÉ DE L\'ANALYSE :')
      console.log('========================')

    } catch (error) {
      console.error('❌ Erreur générale d\'analyse :', error)
    }
  }

  const testTableAccess = async (tableName: string) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) {
        console.error(`❌ ${tableName} : ${error.message} (Code: ${error.code})`)
        if (error.code === 'PGRST116') {
          console.log(`   💡 Cette table existe mais RLS bloque l'accès`)
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`   🚫 Cette table n'existe PAS`)
        }
      } else {
        console.log(`✅ ${tableName} : Accessible (${data?.length || 0} enregistrements)`)
      }
    } catch (error) {
      console.error(`❌ Exception ${tableName} :`, error)
    }
  }

  const analyzeRLSPolicies = async () => {
    try {
      console.log('🔍 Analyse des politiques RLS...')

      // Essaie d'accéder à des tables sensibles pour tester les RLS
      const sensitiveTables = ['users', 'user_profiles', 'user_products']

      for (const tableName of sensitiveTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)

          if (error) {
            if (error.code === 'PGRST116') {
              console.log(`🔒 ${tableName} : RLS ACTIVÉ (accès restreint)`)
            } else {
              console.log(`❌ ${tableName} : ${error.message}`)
            }
          } else {
            console.log(`⚠️ ${tableName} : RLS DÉSACTIVÉ (accès libre)`)
          }
        } catch (error) {
          console.error(`❌ Exception RLS ${tableName} :`, error)
        }
      }

      // Test d'insertion pour vérifier les permissions d'écriture
      console.log('\n📝 Test des permissions d\'écriture...')
      try {
        const testData = {
          title: 'Test RLS Analysis',
          discount_type: 'percentage',
          discount_value: 10,
          min_purchase_amount: 1000,
          start_date: '2024-12-01',
          end_date: '2024-12-31',
          is_active: false
        }

        const { error: insertError } = await supabase
          .from('promotions')
          .insert([testData])

        if (insertError) {
          if (insertError.code === 'PGRST116') {
            console.log('🔒 Permissions écriture : RLS ACTIVÉ (insertion rejetée)')
          } else {
            console.log(`❌ Permissions écriture : ${insertError.message}`)
          }
        } else {
          console.log('⚠️ Permissions écriture : RLS DÉSACTIVÉ (insertion réussie)')
        }
      } catch (error) {
        console.error('❌ Exception test écriture :', error)
      }

    } catch (error) {
      console.error('❌ Erreur analyse RLS :', error)
    }
  }

  const analyzeViews = async () => {
    try {
      console.log('🔍 Analyse des vues...')

      // Test des vues définies dans les types
      const views = ['user_stats', 'vendor_stats']

      for (const viewName of views) {
        try {
          // Les vues sont accessibles comme des tables normales
          const { data, error } = await supabase
            .from(viewName)
            .select('*')
            .limit(1)

          if (error) {
            console.error(`❌ Vue ${viewName} : ${error.message}`)
          } else {
            console.log(`✅ Vue ${viewName} : Accessible (${data?.length || 0} enregistrements)`)
          }
        } catch (error) {
          console.error(`❌ Exception vue ${viewName} :`, error)
        }
      }
    } catch (error) {
      console.error('❌ Erreur analyse vues :', error)
    }
  }

  const analyzeFunctions = async () => {
    try {
      console.log('🔍 Analyse des fonctions...')

      // Test des fonctions définies dans les types
      const functions = [
        { name: 'update_updated_at_column', args: {} },
        { name: 'generate_order_number', args: {} }
      ]

      for (const func of functions) {
        try {
          const { data, error } = await supabase.rpc(func.name, func.args)

          if (error) {
            console.error(`❌ Fonction ${func.name} : ${error.message}`)
          } else {
            console.log(`✅ Fonction ${func.name} : Disponible`)
          }
        } catch (error) {
          console.error(`❌ Exception fonction ${func.name} :`, error)
        }
      }
    } catch (error) {
      console.error('❌ Erreur analyse fonctions :', error)
    }
  }

  return (
    <div className="p-6">
      <h1>Analyseur Complet du Schéma Supabase</h1>
      <div className="space-y-4">
        <button
          onClick={analyzeSchema}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔍 Analyser le Schéma Complet
        </button>

        <div className="text-sm text-gray-600">
          <p>Ce script va analyser :</p>
          <ul className="list-disc list-inside mt-2">
            <li>Toutes les tables disponibles dans Supabase</li>
            <li>Les politiques de sécurité RLS</li>
            <li>Les vues définies</li>
            <li>Les fonctions disponibles</li>
            <li>Les permissions d'accès</li>
          </ul>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800">📋 Tables à créer pour le composant :</h3>
          <ul className="text-yellow-700 mt-2">
            <li>• boosting_services</li>
            <li>• boosting_campaigns</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
