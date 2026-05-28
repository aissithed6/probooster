"use client"

import { supabase } from '@/lib/supabase'

export default function TestSupabase() {
  const testConnection = async () => {
    try {
      console.log('🔍 Test de connexion Supabase...')

      // Test de connexion simple
      const { data, error } = await supabase
        .from('boosting_services')
        .select('id')
        .limit(1)

      if (error) {
        console.error('❌ Erreur Supabase:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Connexion Supabase OK, données:', data)
      return { success: true, data }

    } catch (error) {
      console.error('❌ Erreur de connexion:', error)
      return { success: false, error: error.message }
    }
  }

  return (
    <div className="p-6">
      <h1>Test Supabase</h1>
      <button
        onClick={testConnection}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Tester la connexion
      </button>
    </div>
  )
}
