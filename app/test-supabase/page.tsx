"use client"

import TestSupabaseConnection from '@/components/test-supabase-connection'

export default function TestSupabasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔧 Diagnostic Supabase
          </h1>
          <p className="text-xl text-gray-600">
            Testez la connexion et l'authentification Supabase
          </p>
        </div>
        
        <TestSupabaseConnection />
        
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📋 Instructions de Diagnostic
          </h2>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-lg">1. Test de Connexion</h3>
              <p>Cliquez sur "Tester la Connexion" pour vérifier l'accès à Supabase</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">2. Test d'Inscription</h3>
              <p>Cliquez sur "Tester l'Inscription" pour vérifier l'authentification</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">3. Vérifications à faire</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Vérifiez que votre projet Supabase est actif</li>
                <li>Vérifiez que les clés API sont correctes</li>
                <li>Vérifiez les paramètres d'authentification</li>
                <li>Vérifiez la console du navigateur</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
