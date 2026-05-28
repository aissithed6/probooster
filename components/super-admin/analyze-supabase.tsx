"use client"

import { supabase } from '@/lib/supabase'

export default function AnalyzeSupabaseTables() {
  const analyzeTables = async () => {
    console.log('🔍 Analyse complète des tables Supabase...')

    // Liste des tables définies dans les types
    const expectedTables = [
      'users', 'user_profiles', 'user_points', 'loyalty_points',
      'user_products', 'user_notifications', 'user_messages',
      'user_chats', 'chat_messages', 'user_orders', 'order_items',
      'vendor_sales', 'payment_requests', 'products', 'categories',
      'promotions', 'product_reviews', 'user_wishlists', 'user_carts',
      'user_sessions', 'activity_logs', 'system_settings'
    ]

    // Tables que le composant essaie d'utiliser
    const componentTables = [
      'boosting_services',
      'boosting_campaigns',
      'promotions'
    ]

    console.log('📋 Tables définies dans les types TypeScript :')
    expectedTables.forEach(table => {
      console.log(`  - ${table}`)
    })

    console.log('\n📋 Tables utilisées par le composant :')
    componentTables.forEach(table => {
      console.log(`  - ${table}`)
    })

    console.log('\n🔍 Test de connexion et permissions...')

    // Test de connexion basique
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession()
      console.log('🔐 Session auth :', authData ? 'Connecté' : 'Non connecté')
      if (authError) console.error('Erreur auth :', authError)
    } catch (error) {
      console.error('❌ Exception auth :', error)
    }

    // Test de chaque table définie
    console.log('\n📊 Test des tables définies :')
    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (error) {
          console.error(`❌ ${tableName} :`, error.message)
        } else {
          console.log(`✅ ${tableName} : Accessible (${data?.length || 0} enregistrements)`)
        }
      } catch (error) {
        console.error(`❌ ${tableName} : Exception -`, error)
      }
    }

    // Test des tables du composant
    console.log('\n🚨 Test des tables du composant :')
    for (const tableName of componentTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (error) {
          console.error(`❌ ${tableName} : ${error.message}`)
        } else {
          console.log(`✅ ${tableName} : Accessible (${data?.length || 0} enregistrements)`)
        }
      } catch (error) {
        console.error(`❌ ${tableName} : Exception -`, error)
      }
    }

    // Test des politiques RLS
    console.log('\n🔒 Test des politiques RLS :')
    try {
      // Essaie d'insérer un enregistrement test (devrait échouer à cause des RLS)
      const testData = {
        email: 'test@example.com',
        role: 'client'
      }

      const { error: insertError } = await supabase
        .from('users')
        .insert([testData])

      if (insertError) {
        console.log('✅ RLS activé (insertion rejetée) :', insertError.message)
      } else {
        console.log('⚠️ RLS désactivé (insertion réussie)')
      }
    } catch (error) {
      console.error('❌ Erreur test RLS :', error)
    }
  }

  return (
    <div className="p-6">
      <h1>Analyse Complète Supabase</h1>
      <button
        onClick={analyzeTables}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Analyser les tables et permissions
      </button>
    </div>
  )
}
