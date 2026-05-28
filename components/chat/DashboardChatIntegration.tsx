'use client'

import React from 'react'
import { GlobalChatSystem } from './GlobalChatSystem'
import { GlobalChatEventListener } from './GlobalChatEventListener'
import { ChatDebugPanel } from './ChatDebugPanel'

/**
 * Composant d'intégration du chat global dans le dashboard
 * 
 * Ce composant peut être ajouté à la fin de votre dashboard existant
 * sans modifier aucun de vos composants actuels.
 * 
 * Utilisation :
 * <DashboardChatIntegration />
 */
export const DashboardChatIntegration: React.FC = () => {
  return (
    <>
      {/* Écouteur d'événements pour l'intégration hybride */}
      <GlobalChatEventListener />
      
      {/* Système de chat global */}
      <GlobalChatSystem />
      
      {/* Panneau de debug pour diagnostiquer le chat */}
      <ChatDebugPanel />
      
      {/* Note d'information pour les développeurs */}
      <div className="fixed bottom-24 right-6 z-40">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="text-xs text-blue-800">
            💬 <strong>Chat Global</strong><br />
            Système de chat synchronisé<br />
            accessible depuis partout
          </p>
        </div>
      </div>
    </>
  )
}
