"use client"

import { supabase } from '@/lib/supabase'

export default function DiagnosePermissionsIssues() {
  const diagnosePermissions = async () => {
    console.log('🔍 Diagnostic approfondi des permissions Supabase...')

    // 1. Test de l'authentification
    console.log('\n1️⃣ Test de l\'authentification...')
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('❌ Erreur session:', sessionError)
      } else if (session?.user) {
        console.log('✅ Utilisateur connecté:', session.user.email)
        console.log('🆔 User ID:', session.user.id)
        console.log('👤 Rôle:', session.user.user_metadata?.role || 'non défini')
      } else {
        console.log('⚠️ Aucun utilisateur connecté')
      }
    } catch (error) {
      console.error('❌ Exception auth:', error)
    }

    // 2. Test d'accès aux tables problématiques
    console.log('\n2️⃣ Test d\'accès aux tables boosting...')
    const testTableAccess = async (tableName: string) => {
      try {
        console.log(`\n📋 Test de ${tableName}:`)

        // Test SELECT simple
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        if (error) {
          console.error(`❌ Erreur SELECT ${tableName}:`, error.message)
          console.error('Code:', error.code)
          console.error('Détails:', error.details)
          console.error('Hint:', error.hint)

          // Test si c'est un problème de permissions
          if (error.code === 'PGRST116') {
            console.log('💡 RLS bloque l\'accès - vérifiez les politiques de sécurité')
          } else if (error.message.includes('permission denied')) {
            console.log('💡 Problème de permissions PostgreSQL')
          }
        } else {
          console.log(`✅ ${tableName}: ${data?.length || 0} enregistrements trouvés`)
          if (data && data.length > 0) {
            console.log('Exemple:', data[0])
          }
        }
      } catch (error) {
        console.error(`❌ Exception ${tableName}:`, error)
      }
    }

    await testTableAccess('boosting_services')
    await testTableAccess('boosting_campaigns')
    await testTableAccess('promotions')

    // 3. Test avec différents niveaux de permissions
    console.log('\n3️⃣ Test des politiques RLS spécifiques...')

    // Essaie de créer une requête qui devrait fonctionner
    try {
      console.log('🔍 Test requête personnalisée boosting_services...')

      // Test requête avec filtre
      const { data: filteredData, error: filteredError } = await supabase
        .from('boosting_services')
        .select('id, name, is_active')
        .eq('is_active', true)
        .limit(1)

      if (filteredError) {
        console.error('❌ Erreur requête filtrée:', filteredError.message)
      } else {
        console.log('✅ Requête filtrée OK:', filteredData?.length || 0, 'résultats')
      }
    } catch (error) {
      console.error('❌ Exception requête filtrée:', error)
    }

    // 4. Test de la table promotions avec la nouvelle structure
    console.log('\n4️⃣ Test de la table promotions...')
    try {
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select('*')
        .limit(1)

      if (promotionsError) {
        console.error('❌ Erreur promotions:', promotionsError.message)
        console.error('Code:', promotionsError.code)
      } else {
        console.log('✅ Promotions OK:', promotionsData?.length || 0, 'enregistrements')
        if (promotionsData && promotionsData.length > 0) {
          console.log('Structure promotions:', Object.keys(promotionsData[0]))
        }
      }
    } catch (error) {
      console.error('❌ Exception promotions:', error)
    }

    // 5. Test de connexion directe PostgreSQL
    console.log('\n5️⃣ Test de connexion directe...')
    try {
      // Essaie une requête très simple pour tester la connectivité
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      if (error) {
        console.error('❌ Même users échoue:', error.message)
      } else {
        console.log('✅ Connexion de base OK - users accessible')
      }
    } catch (error) {
      console.error('❌ Exception connexion de base:', error)
    }

    // 6. Analyse des politiques RLS pour les tables problématiques
    console.log('\n6️⃣ Analyse des politiques RLS...')
    try {
      // Test d'insertion pour voir si les politiques permettent l'écriture
      const testInsert = {
        name: 'Test Diagnostic',
        type: 'recommendation',
        base_price: 1000,
        pricing_model: 'per_page_day',
        is_active: true
      }

      const { error: insertError } = await supabase
        .from('boosting_services')
        .insert([testInsert])

      if (insertError) {
        console.error('❌ Permissions écriture boosting_services:', insertError.message)
        if (insertError.code === 'PGRST116') {
          console.log('💡 RLS bloque l\'écriture aussi')
        }
      } else {
        console.log('✅ Permissions écriture OK')
      }
    } catch (error) {
      console.error('❌ Exception test écriture:', error)
    }
  }

  return (
    <div className="p-6">
      <h1>Diagnostic Avancé des Permissions Supabase</h1>
      <div className="space-y-4">
        <button
          onClick={diagnosePermissions}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          🔍 Diagnostiquer les Permissions
        </button>

        <div className="text-sm text-gray-600">
          <p>Ce diagnostic va tester :</p>
          <ul className="list-disc list-inside mt-2">
            <li>L'authentification utilisateur</li>
            <li>L'accès aux tables boosting_services et boosting_campaigns</li>
            <li>Les politiques RLS configurées</li>
            <li>Les permissions d'écriture</li>
            <li>La structure des tables</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">✅ BONNES NOUVELLES :</h3>
          <p className="text-blue-700">Les tables boosting_services et boosting_campaigns existent !</p>
          <p className="text-sm text-blue-600 mt-1">Le problème est probablement lié aux permissions RLS.</p>
        </div>
      </div>
    </div>
  )
}
