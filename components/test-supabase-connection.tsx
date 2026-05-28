"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestSupabaseConnection() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testConnection = async () => {
    setIsLoading(true)
    setTestResults([])
    
    try {
      // Test 1: Vérifier la configuration
      addResult('🔍 Test de la configuration...')
      addResult(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'Non définie'}`)
      addResult(`Clé anonyme: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) || 'Non définie'}...`)
      
      // Test 2: Test de connexion basique
      addResult('🌐 Test de connexion basique...')
      const { data, error } = await supabase.from('system_settings').select('*').limit(1)
      
      if (error) {
        addResult(`❌ Erreur de connexion: ${error.message}`)
        addResult(`Code: ${error.code}`)
        addResult(`Hint: ${error.hint || 'Aucun hint'}`)
      } else {
        addResult('✅ Connexion réussie à la base de données')
        addResult(`Données récupérées: ${data?.length || 0} enregistrements`)
      }
      
      // Test 3: Test de l'authentification
      addResult('🔐 Test de l\'authentification...')
      const { data: authData, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        addResult(`❌ Erreur d'authentification: ${authError.message}`)
      } else {
        addResult('✅ Service d\'authentification accessible')
        addResult(`Session actuelle: ${authData.session ? 'Oui' : 'Non'}`)
      }
      
    } catch (error) {
      addResult(`💥 Erreur inattendue: ${error}`)
      console.error('Erreur de test:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testSignUp = async () => {
    setIsLoading(true)
    addResult('📝 Test d\'inscription...')
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'testpassword123'
      })
      
      if (error) {
        addResult(`❌ Erreur d'inscription: ${error.message}`)
        addResult(`Code: ${error.code}`)
      } else {
        addResult('✅ Inscription réussie')
        addResult(`User ID: ${data.user?.id}`)
        addResult(`Email: ${data.user?.email}`)
      }
    } catch (error) {
      addResult(`💥 Erreur d'inscription: ${error}`)
      console.error('Erreur d\'inscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-orange-600">
          🔧 Test de Connexion Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Boutons de test */}
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={testConnection}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? '⏳ Test en cours...' : '🌐 Tester la Connexion'}
          </Button>
          
          <Button 
            onClick={testSignUp}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? '⏳ Test en cours...' : '📝 Tester l\'Inscription'}
          </Button>
          
          <Button 
            onClick={clearResults}
            variant="outline"
            className="border-gray-300"
          >
            🗑️ Effacer les résultats
          </Button>
        </div>

        {/* Résultats des tests */}
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-3 text-gray-700">📊 Résultats des Tests:</h3>
          
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Cliquez sur un bouton de test pour commencer...
            </p>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded text-sm font-mono ${
                    result.includes('❌') ? 'bg-red-100 text-red-800' :
                    result.includes('✅') ? 'bg-green-100 text-green-800' :
                    result.includes('💥') ? 'bg-red-200 text-red-900' :
                    'bg-blue-100 text-blue-800'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informations de débogage */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-semibold text-orange-800 mb-2">🔍 Informations de Débogage:</h4>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• Vérifiez que votre projet Supabase est actif</li>
            <li>• Vérifiez que les clés API sont correctes</li>
            <li>• Vérifiez les paramètres d'authentification</li>
            <li>• Vérifiez la console du navigateur pour plus de détails</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
