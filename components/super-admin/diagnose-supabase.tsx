"use client"

import { supabase } from '@/lib/supabase'

export default function DiagnoseSupabaseIssues() {
  const diagnoseIssues = async () => {
    console.log('🔍 Diagnostic complet des problèmes Supabase...')

    // 1. Test de connexion basique
    console.log('\n1️⃣ Test de connexion de base...')
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Session:', session ? '✅ Connecté' : '❌ Non connecté')
      if (sessionError) console.error('Erreur session:', sessionError)
    } catch (error) {
      console.error('❌ Exception session:', error)
    }

    // 2. Test des tables qui existent vraiment
    console.log('\n2️⃣ Test des tables disponibles...')
    const testTables = async (tableName: string) => {
      try {
        console.log(`\n📋 Test de ${tableName}:`)

        // Test SELECT simple
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (error) {
          console.error(`❌ Erreur SELECT ${tableName}:`, error.message)
          console.error('Détails erreur:', error)
          return false
        } else {
          console.log(`✅ ${tableName}: ${data?.length || 0} enregistrements trouvés`)
          return true
        }
      } catch (error) {
        console.error(`❌ Exception ${tableName}:`, error)
        return false
      }
    }

    // Test des tables qui devraient exister selon les types
    const tablesToTest = [
      'users', 'user_profiles', 'products', 'promotions',
      'user_notifications', 'user_orders', 'categories'
    ]

    for (const table of tablesToTest) {
      await testTables(table)
    }

    // 3. Test des tables problématiques du composant
    console.log('\n3️⃣ Test des tables problématiques du composant...')
    const problematicTables = ['boosting_services', 'boosting_campaigns']

    for (const table of problematicTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        if (error) {
          console.error(`❌ ${table} n'existe PAS:`, error.message)
          console.error('Code erreur:', error.code)
          console.error('Détails:', error.details)
        } else {
          console.log(`✅ ${table} existe et fonctionne`)
        }
      } catch (error) {
        console.error(`❌ Exception ${table}:`, error)
      }
    }

    // 4. Test des permissions RLS
    console.log('\n4️⃣ Test des permissions RLS...')
    try {
      // Essaie d'accéder à une table qui devrait exister
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      if (error) {
        console.error('❌ Problème de permissions RLS:', error.message)
        console.error('Code:', error.code)
        if (error.code === 'PGRST116') {
          console.log('💡 RLS activé - vérifiez les politiques de sécurité')
        }
      } else {
        console.log('✅ Permissions OK pour la table users')
      }
    } catch (error) {
      console.error('❌ Exception permissions:', error)
    }

    // 5. Vérification de la configuration
    console.log('\n5️⃣ Vérification de la configuration...')
    console.log('URL Supabase:', supabase.supabaseUrl)
    console.log('Clé publique présente:', !!supabase.supabaseKey)

    // 6. Test d'insertion pour vérifier les permissions d'écriture
    console.log('\n6️⃣ Test des permissions d\'écriture...')
    try {
      const testInsert = {
        title: 'Test Diagnostic',
        discount_type: 'percentage',
        discount_value: 10,
        min_purchase_amount: 1000,
        start_date: '2024-12-01',
        end_date: '2024-12-31',
        is_active: false
      }

      const { error: insertError } = await supabase
        .from('promotions')
        .insert([testInsert])

      if (insertError) {
        console.error('❌ Permissions écriture:', insertError.message)
        console.error('Code:', insertError.code)
      } else {
        console.log('✅ Permissions écriture OK')
      }
    } catch (error) {
      console.error('❌ Exception écriture:', error)
    }
  }

  return (
    <div className="p-6">
      <h1>Diagnostic Complet Supabase</h1>
      <button
        onClick={diagnoseIssues}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Diagnostiquer les problèmes
      </button>
    </div>
  )
}
