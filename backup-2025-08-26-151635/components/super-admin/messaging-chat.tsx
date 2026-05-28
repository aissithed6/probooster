"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  MessageCircle, Users, Clock, AlertTriangle, CheckCircle, XCircle, 
  Archive, Trash2, Copy, Star, Send, Search, Filter, Eye, 
  Phone, Mail, MapPin, ShoppingBag, User, Bot, Shield, 
  Volume2, Mic, Paperclip, Smile, MoreHorizontal, RefreshCw,
  TrendingUp, BarChart3, Download, Settings, Globe, Key, FileText, FileSpreadsheet, Upload,
  Bell, Plus, Edit
} from 'lucide-react'

// Interfaces pour le système de chat
interface ChatUser {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  type: 'customer' | 'vendor' | 'admin'
  status: 'online' | 'offline' | 'away'
  lastSeen: string
  location?: string
}

interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  senderName: string
  senderType: 'customer' | 'vendor' | 'admin' | 'super_admin'
  content: string
  type: 'text' | 'image' | 'file' | 'voice' | 'product_link'
  timestamp: string
  isRead: boolean
  isFlagged: boolean
  flagReason?: string
  attachments?: string[]
  productId?: string
  productName?: string
  // Nouvelles propriétés pour la synchronisation
  isFromGlobalChat?: boolean
  originalChatId?: string
  syncStatus?: 'synced' | 'pending' | 'failed'
  // Nouvelles propriétés pour le statut des messages
  messageStatus: 'sent' | 'delivered' | 'read'
  isOnline?: boolean
}

interface ChatSession {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  vendorId?: string
  vendorName?: string
  productId?: string
  productName?: string
  status: 'active' | 'pending' | 'resolved' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'support' | 'sales' | 'technical' | 'complaint' | 'general'
  createdAt: string
  lastMessageAt: string
  unreadCount: number
  totalMessages: number
  assignedTo?: string
  tags: string[]
  notes?: string
  // Nouvelles propriétés pour la supervision
  source: 'global_chat' | 'product_chat' | 'vendor_chat' | 'support_chat'
  location?: string
  deviceInfo?: string
  browserInfo?: string
  ipAddress?: string
  isMonitored: boolean
  lastSupervisorAction?: string
  escalationLevel: 'normal' | 'escalated' | 'critical'
}

interface ChatStats {
  totalConversations: number
  activeConversations: number
  pendingConversations: number
  resolvedToday: number
  averageResponseTime: number
  satisfactionRate: number
  messagesToday: number
  flaggedMessages: number
  // Nouvelles statistiques pour la supervision
  globalChats: number
  productChats: number
  vendorChats: number
  supportChats: number
  escalatedChats: number
  monitoredChats: number
  syncErrors: number
  realTimeConnections: number
}

// Nouvelle interface pour la synchronisation
interface ChatSyncStatus {
  isConnected: boolean
  lastSync: string
  syncErrors: number
  activeConnections: number
  pendingMessages: number
  syncProgress: number
}

// Nouvelle interface pour les actions de supervision
interface SupervisorAction {
  id: string
  chatId: string
  supervisorId: string
  supervisorName: string
  action: 'monitor' | 'escalate' | 'resolve' | 'assign' | 'flag' | 'block' | 'config' | 'test'
  timestamp: string
  details: string
  result: 'success' | 'pending' | 'failed'
}

// Interfaces pour la Messagerie Interne
interface InternalMessage {
  id: string
  title: string
  content: string
  type: 'announcement' | 'change' | 'alert' | 'information' | 'congratulation' | 'reminder'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  senderId: string
  senderName: string
  senderRole: 'super_admin' | 'admin'
  recipients: MessageRecipient[]
  status: 'draft' | 'sent' | 'delivered' | 'read'
  createdAt: string
  scheduledFor?: string
  expiresAt?: string
  isPinned: boolean
  requiresConfirmation: boolean
  tags: string[]
  attachments?: string[]
}

interface MessageRecipient {
  id: string
  name: string
  email: string
  type: 'individual' | 'role' | 'group'
  role?: 'buyer' | 'vendor' | 'admin'
  groupId?: string
  groupName?: string
  readAt?: string
  confirmedAt?: string
  response?: string
}

interface MessageTemplate {
  id: string
  name: string
  title: string
  content: string
  type: 'announcement' | 'change' | 'alert' | 'information' | 'congratulation' | 'reminder'
  category: 'general' | 'technical' | 'marketing' | 'support' | 'security'
  isDefault: boolean
  usageCount: number
  lastUsed: string
  createdAt: string
}

interface MessageGroup {
  id: string
  name: string
  description: string
  members: string[]
  memberCount: number
  createdAt: string
  isActive: boolean
}

export default function MessagingChat() {
  // États principaux
  const [activeTab, setActiveTab] = useState('conversations')
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null)
  const [showChatModal, setShowChatModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [assignedFilter, setAssignedFilter] = useState('all')
  
  // États pour le chat
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  
  // États pour les données
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [chatStats, setChatStats] = useState<ChatStats>({
    totalConversations: 1247,
    activeConversations: 89,
    pendingConversations: 15,
    resolvedToday: 23,
    averageResponseTime: 2.3,
    satisfactionRate: 98.5,
    messagesToday: 892,
    flaggedMessages: 7,
    globalChats: 0,
    productChats: 0,
    vendorChats: 0,
    supportChats: 0,
    escalatedChats: 0,
    monitoredChats: 0,
    syncErrors: 0,
    realTimeConnections: 0
  })
  
  // Nouveaux états pour la synchronisation et supervision
  const [syncStatus, setSyncStatus] = useState<ChatSyncStatus>({
    isConnected: true,
    lastSync: new Date().toISOString(),
    syncErrors: 0,
    activeConnections: 45,
    pendingMessages: 12,
    syncProgress: 100
  })
  
  const [supervisorActions, setSupervisorActions] = useState<SupervisorAction[]>([])
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [showSupervisionModal, setShowSupervisionModal] = useState(false)
  const [selectedChatForSupervision, setSelectedChatForSupervision] = useState<ChatSession | null>(null)
  const [showMessageDetailsModal, setShowMessageDetailsModal] = useState(false)
  const [selectedFlaggedMessage, setSelectedFlaggedMessage] = useState<ChatMessage | null>(null)
  const [showSupervisionActionModal, setShowSupervisionActionModal] = useState(false)
  const [selectedSupervisionAction, setSelectedSupervisionAction] = useState<'monitor' | 'escalate' | 'block' | null>(null)
  const [selectedChatForSupervisionAction, setSelectedChatForSupervisionAction] = useState<ChatSession | null>(null)
  
  // Nouveaux états pour la configuration de la synchronisation et gestion des notifications
  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false)
  const [showNotificationsManageModal, setShowNotificationsManageModal] = useState(false)
  const [syncConfig, setSyncConfig] = useState({
    realTimeEnabled: true,
    syncFrequency: 5,
    maxConnections: 100,
    autoRetry: true,
    retryAttempts: 3,
    logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error'
  })
  const [notificationsConfig, setNotificationsConfig] = useState({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    urgentChats: true,
    newMessages: true,
    systemAlerts: true,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00'
  })

  // Nouveaux états pour les fonctionnalités avancées
  const [showEmojiPickerModal, setShowEmojiPickerModal] = useState(false)
  const [showFileUploadModal, setShowFileUploadModal] = useState(false)
  const [showQuickResponseModal, setShowQuickResponseModal] = useState(false)
  const [showMessageTemplateModal, setShowMessageTemplateModal] = useState(false)
  const [showModerationToolsModal, setShowModerationToolsModal] = useState(false)
  const [showAIToolsModal, setShowAIToolsModal] = useState(false)
  const [showThemeCustomizationModal, setShowThemeCustomizationModal] = useState(false)
  const [showProductivityToolsModal, setShowProductivityToolsModal] = useState(false)
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  
  // Nouveaux états pour les boutons d'en-tête
  const [showNewConversationModal, setShowNewConversationModal] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // États pour les fonctionnalités avancées
  const [selectedEmoji, setSelectedEmoji] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedQuickResponse, setSelectedQuickResponse] = useState<string>('')
  const [selectedMessageTemplate, setSelectedMessageTemplate] = useState<string>('')
  const [selectedModerationAction, setSelectedModerationAction] = useState<string>('')
  const [selectedAIFeature, setSelectedAIFeature] = useState<string>('')
  const [selectedTheme, setSelectedTheme] = useState<string>('blue')
  const [selectedProductivityTool, setSelectedProductivityTool] = useState<string>('')
  const [selectedIntegration, setSelectedIntegration] = useState<string>('')
  const [selectedExportFormat, setSelectedExportFormat] = useState<string>('')
  
  // Configuration des fonctionnalités avancées
  const [advancedFeaturesConfig, setAdvancedFeaturesConfig] = useState({
    emojisEnabled: true,
    fileUploadEnabled: true,
    voiceRecordingEnabled: true,
    quickResponsesEnabled: true,
    messageTemplatesEnabled: true,
    autoModerationEnabled: true,
    aiChatbotsEnabled: true,
    sentimentAnalysisEnabled: true,
    themeCustomizationEnabled: true,
    productivityToolsEnabled: true,
    integrationsEnabled: true,
    autoBackupEnabled: true
  })

  // États pour la Messagerie Interne
  const [internalMessages, setInternalMessages] = useState<InternalMessage[]>([])
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([])
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([])
  const [showComposeMessageModal, setShowComposeMessageModal] = useState(false)
  const [showMessageHistoryModal, setShowMessageHistoryModal] = useState(false)
  const [showTemplateManagerModal, setShowTemplateManagerModal] = useState(false)
  const [showGroupManagerModal, setShowGroupManagerModal] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<InternalMessage | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<MessageGroup | null>(null)
  
  // États pour la composition de messages
  const [composeForm, setComposeForm] = useState({
    title: '',
    content: '',
    type: 'announcement' as InternalMessage['type'],
    priority: 'medium' as InternalMessage['priority'],
    recipients: [] as MessageRecipient[],
    scheduledFor: '',
    expiresAt: '',
    isPinned: false,
    requiresConfirmation: false,
    tags: [] as string[],
    attachments: [] as string[]
  })
  
  // États pour la recherche et filtrage des messages
  const [messageSearchTerm, setMessageSearchTerm] = useState('')
  const [messageTypeFilter, setMessageTypeFilter] = useState('all')
  const [messagePriorityFilter, setMessagePriorityFilter] = useState('all')
  const [messageStatusFilter, setMessageStatusFilter] = useState('all')
  const [messageDateFilter, setMessageDateFilter] = useState('all')

  // États pour la création de templates
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    content: '',
    type: 'announcement' as InternalMessage['type'],
    category: 'general' as MessageTemplate['category']
  })

  // État pour la navigation principale (Chat ou Messagerie Interne)
  const [mainMode, setMainMode] = useState<'chat' | 'messaging'>('chat')

  // États pour la gestion des groupes
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    category: 'general' as const
  })
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([])
  const [groupSearchTerm, setGroupSearchTerm] = useState('')
  const [groupRoleFilter, setGroupRoleFilter] = useState<string>('all')

  // États pour la sélection des destinataires
  const [showRecipientSelector, setShowRecipientSelector] = useState(false)
  const [recipientSearchTerm, setRecipientSearchTerm] = useState('')
  const [recipientRoleFilter, setRecipientRoleFilter] = useState('all')
  const [selectedRecipients, setSelectedRecipients] = useState<MessageRecipient[]>([])
  const [availableUsers, setAvailableUsers] = useState<Array<{
    id: string
    name: string
    email: string
    phone: string
    role: 'buyer' | 'vendor' | 'admin'
    status: 'active' | 'inactive'
    avatar?: string
  }>>([])
  
  // Référence pour le scroll automatique
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Chargement des données au montage
  useEffect(() => {
    loadMockData()
    startRealTimeSync()
  }, [])
  
  // Scroll automatique vers le bas des messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])
  
  // Simulation de la synchronisation en temps réel
  const startRealTimeSync = () => {
    // Simuler la réception de nouveaux messages en temps réel
    const syncInterval = setInterval(() => {
      // Mettre à jour le statut de synchronisation
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date().toISOString(),
        activeConnections: Math.floor(Math.random() * 20) + 40,
        pendingMessages: Math.floor(Math.random() * 10) + 5
      }))
      
      // Simuler de nouveaux messages de chats globaux
      if (Math.random() > 0.7) {
        simulateNewGlobalChat()
      }

      // Simuler la progression du statut des messages
      simulateMessageStatusProgression()
    }, 5000) // Toutes les 5 secondes
    
    return () => clearInterval(syncInterval)
  }
  
  // Générateur d'ID unique pour éviter les collisions
  const generateUniqueId = (prefix: string = '') => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000)
    const counter = Math.floor(Math.random() * 1000)
    return `${prefix}${timestamp}_${random}_${counter}`
  }

  // Composant pour afficher les marqueurs de statut des messages
  const MessageStatusIndicator = ({ message, isOwnMessage }: { message: ChatMessage, isOwnMessage: boolean }) => {
    if (!isOwnMessage) return null

    const getStatusIcon = () => {
      switch (message.messageStatus) {
        case 'sent':
          return (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
          )
        case 'delivered':
          return (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
          )
        case 'read':
          return (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          )
        default:
          return null
      }
    }

    return (
      <div className="flex items-center justify-end mt-1">
        <div className="flex items-center gap-1 text-xs opacity-70">
          {getStatusIcon()}
          <span className="ml-1 text-xs">
            {message.messageStatus === 'sent' && 'Envoyé'}
            {message.messageStatus === 'delivered' && 'Livré'}
            {message.messageStatus === 'read' && 'Lu'}
          </span>
        </div>
      </div>
    )
  }

  // Simulation de nouveaux chats globaux
  const simulateNewGlobalChat = () => {
    const uniqueId = generateUniqueId('chat_')
    const customerId = generateUniqueId('c_')
    const newChat: ChatSession = {
      id: uniqueId,
      customerId: customerId,
      customerName: `Client ${Math.floor(Math.random() * 1000)}`,
      customerEmail: `client_${Date.now()}_${Math.floor(Math.random() * 1000)}@email.com`,
      status: 'active',
      priority: Math.random() > 0.7 ? 'high' : 'medium',
      category: 'general',
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      unreadCount: 1,
      totalMessages: 1,
      tags: ['nouveau', 'global'],
      source: 'global_chat',
      isMonitored: false,
      escalationLevel: 'normal'
    }
    
    setChatSessions(prev => [newChat, ...prev])
    
    // Mettre à jour les statistiques
    setChatStats(prev => ({
      ...prev,
      totalConversations: prev.totalConversations + 1,
      activeConversations: prev.activeConversations + 1,
      globalChats: prev.globalChats + 1,
      messagesToday: prev.messagesToday + 1
    }))
  }

  // Simulation de la progression du statut des messages
  const simulateMessageStatusProgression = () => {
    setChatMessages(prev => prev.map(message => {
      if (message.senderType === 'super_admin' && message.messageStatus === 'sent') {
        // Simuler la progression du statut
        if (Math.random() > 0.8) {
          return { ...message, messageStatus: 'delivered' as const }
        }
      } else if (message.senderType === 'super_admin' && message.messageStatus === 'delivered') {
        // Simuler la lecture du message
        if (Math.random() > 0.7) {
          return { ...message, messageStatus: 'read' as const }
        }
      }
      return message
    }))
  }
  
  const loadMockData = () => {
    // Sessions de chat simulées
    const mockChatSessions: ChatSession[] = [
      {
        id: 'chat1',
        customerId: 'c1',
        customerName: 'Jean Dupont',
        customerEmail: 'jean.dupont@email.com',
        vendorId: 'v1',
        vendorName: 'TechStore Pro',
        productId: 'p1',
        productName: 'iPhone 15 Pro',
        status: 'active',
        priority: 'high',
        category: 'support',
        createdAt: '2024-12-19T10:30:00Z',
        lastMessageAt: '2024-12-19T14:25:00Z',
        unreadCount: 3,
        totalMessages: 15,
        assignedTo: 'Super Admin',
        tags: ['urgent', 'support', 'iphone'],
        notes: 'Client insatisfait, demande remboursement',
        source: 'global_chat',
        isMonitored: true,
        escalationLevel: 'normal'
      },
      {
        id: 'chat2',
        customerId: 'c2',
        customerName: 'Marie Martin',
        customerEmail: 'marie.martin@email.com',
        vendorId: 'v2',
        vendorName: 'Electronics Plus',
        productId: 'p2',
        productName: 'Samsung Galaxy S24',
        status: 'pending',
        priority: 'medium',
        category: 'sales',
        createdAt: '2024-12-19T09:15:00Z',
        lastMessageAt: '2024-12-19T13:45:00Z',
        unreadCount: 1,
        totalMessages: 8,
        tags: ['question', 'prix', 'disponibilité'],
        source: 'product_chat',
        isMonitored: true,
        escalationLevel: 'normal'
      },
      {
        id: 'chat3',
        customerId: 'c3',
        customerName: 'Pierre Durand',
        customerEmail: 'pierre.durand@email.com',
        vendorId: 'v3',
        vendorName: 'Beaute Naturelle',
        productId: 'p3',
        productName: 'Kit Soin Visage',
        status: 'resolved',
        priority: 'low',
        category: 'general',
        createdAt: '2024-12-18T16:20:00Z',
        lastMessageAt: '2024-12-19T11:30:00Z',
        unreadCount: 0,
        totalMessages: 12,
        assignedTo: 'Super Admin',
        tags: ['résolu', 'satisfait'],
        source: 'vendor_chat',
        isMonitored: true,
        escalationLevel: 'normal'
      }
    ]
    
    // Messages simulés
    const mockMessages: ChatMessage[] = [
      {
        id: 'msg1',
        chatId: 'chat1',
        senderId: 'c1',
        senderName: 'Jean Dupont',
        senderType: 'customer',
        content: 'Bonjour, j\'ai reçu mon iPhone 15 Pro mais il y a un problème avec l\'écran. Pouvez-vous m\'aider ?',
        type: 'text',
        timestamp: '2024-12-19T10:30:00Z',
        isRead: true,
        isFlagged: false,
        isFromGlobalChat: true,
        originalChatId: 'chat1',
        messageStatus: 'read',
        isOnline: true
      },
      {
        id: 'msg2',
        chatId: 'chat1',
        senderId: 'admin1',
        senderName: 'Support Probooster',
        senderType: 'admin',
        content: 'Bonjour Jean, je suis désolé pour ce problème. Pouvez-vous me décrire plus en détail ce qui se passe avec l\'écran ?',
        type: 'text',
        timestamp: '2024-12-19T10:32:00Z',
        isRead: true,
        isFlagged: false,
        isFromGlobalChat: true,
        originalChatId: 'chat1',
        messageStatus: 'read',
        isOnline: false
      },
      {
        id: 'msg3',
        chatId: 'chat1',
        senderId: 'c1',
        senderName: 'Jean Dupont',
        senderType: 'customer',
        content: 'L\'écran s\'éteint de manière aléatoire et parfois il ne répond plus au toucher. C\'est très frustrant !',
        type: 'text',
        timestamp: '2024-12-19T10:35:00Z',
        isRead: true,
        isFlagged: false,
        isFromGlobalChat: true,
        originalChatId: 'chat1',
        messageStatus: 'read',
        isOnline: true
      },
      {
        id: 'msg4',
        chatId: 'chat1',
        senderId: 'c1',
        senderName: 'Jean Dupont',
        senderType: 'customer',
        content: 'Je veux un remboursement immédiat !',
        type: 'text',
        timestamp: '2024-12-19T14:25:00Z',
        isRead: false,
        isFlagged: true,
        flagReason: 'Client en colère, demande remboursement',
        isFromGlobalChat: true,
        originalChatId: 'chat1',
        messageStatus: 'delivered',
        isOnline: true
      }
    ]
    
    setChatSessions(mockChatSessions)
    setChatMessages(mockMessages)

    // Données mock pour la Messagerie Interne
    const mockInternalMessages: InternalMessage[] = [
      {
        id: 'int1',
        title: 'Maintenance Planifiée - Système de Paiement',
        content: 'Chers utilisateurs, une maintenance du système de paiement est prévue le 25 décembre de 02h00 à 06h00. Pendant cette période, les transactions seront temporairement suspendues. Nous nous excusons pour la gêne occasionnée.',
        type: 'announcement',
        priority: 'high',
        senderId: 'admin1',
        senderName: 'Super Admin',
        senderRole: 'super_admin',
        recipients: [
          { id: 'u1', name: 'Tous les utilisateurs', email: 'all@probooster.com', type: 'role', role: 'buyer' },
          { id: 'u2', name: 'Tous les vendeurs', email: 'vendors@probooster.com', type: 'role', role: 'vendor' }
        ],
        status: 'sent',
        createdAt: '2024-12-19T10:00:00Z',
        isPinned: true,
        requiresConfirmation: true,
        tags: ['maintenance', 'paiement', 'système']
      },
      {
        id: 'int2',
        title: 'Nouvelle Fonctionnalité : Système de Points Avancé',
        content: 'Nous sommes ravis d\'annoncer le lancement de notre nouveau système de points avancé ! Désormais, gagnez des points pour chaque action et échangez-les contre des récompenses exclusives.',
        type: 'change',
        priority: 'medium',
        senderId: 'admin1',
        senderName: 'Super Admin',
        senderRole: 'super_admin',
        recipients: [
          { id: 'u1', name: 'Tous les utilisateurs', email: 'all@probooster.com', type: 'role', role: 'buyer' }
        ],
        status: 'sent',
        createdAt: '2024-12-18T15:30:00Z',
        isPinned: false,
        requiresConfirmation: false,
        tags: ['nouveauté', 'points', 'récompenses']
      },
      {
        id: 'int3',
        title: 'Alerte Sécurité - Mise à Jour des Mots de Passe',
        content: 'Pour des raisons de sécurité, nous vous demandons de mettre à jour votre mot de passe dans les 48 heures. Cette mesure est obligatoire pour tous les comptes.',
        type: 'alert',
        priority: 'urgent',
        senderId: 'admin1',
        senderName: 'Super Admin',
        senderRole: 'super_admin',
        recipients: [
          { id: 'u1', name: 'Tous les utilisateurs', email: 'all@probooster.com', type: 'role', role: 'buyer' },
          { id: 'u2', name: 'Tous les vendeurs', email: 'vendors@probooster.com', type: 'role', role: 'vendor' },
          { id: 'u3', name: 'Tous les admins', email: 'admins@probooster.com', type: 'role', role: 'admin' }
        ],
        status: 'sent',
        createdAt: '2024-12-19T08:00:00Z',
        isPinned: true,
        requiresConfirmation: true,
        tags: ['sécurité', 'mot de passe', 'obligatoire']
      }
    ]

    const mockMessageTemplates: MessageTemplate[] = [
      {
        id: 'tpl1',
        name: 'Maintenance Planifiée',
        title: 'Maintenance Planifiée - {service}',
        content: 'Chers utilisateurs, une maintenance du {service} est prévue le {date} de {heure_debut} à {heure_fin}. Pendant cette période, le service sera temporairement suspendu. Nous nous excusons pour la gêne occasionnée.',
        type: 'announcement',
        category: 'technical',
        isDefault: true,
        usageCount: 15,
        lastUsed: '2024-12-19T10:00:00Z',
        createdAt: '2024-11-01T00:00:00Z'
      },
      {
        id: 'tpl2',
        name: 'Nouvelle Fonctionnalité',
        title: 'Nouvelle Fonctionnalité : {feature}',
        content: 'Nous sommes ravis d\'annoncer le lancement de notre nouvelle fonctionnalité : {feature} ! Cette amélioration apporte {benefits}. Découvrez-la dès maintenant !',
        type: 'change',
        category: 'marketing',
        isDefault: true,
        usageCount: 8,
        lastUsed: '2024-12-18T15:30:00Z',
        createdAt: '2024-11-15T00:00:00Z'
      },
      {
        id: 'tpl3',
        name: 'Alerte Sécurité',
        title: 'Alerte Sécurité - {action}',
        content: 'Pour des raisons de sécurité, nous vous demandons de {action} dans les {delai}. Cette mesure est {obligatoire_ou_recommandee} pour tous les comptes.',
        type: 'alert',
        category: 'security',
        isDefault: true,
        usageCount: 12,
        lastUsed: '2024-12-19T08:00:00Z',
        createdAt: '2024-10-01T00:00:00Z'
      }
    ]

    const mockMessageGroups: MessageGroup[] = [
      {
        id: 'grp1',
        name: 'Vendeurs Premium',
        description: 'Groupe des vendeurs avec un statut premium',
        members: ['v1', 'v2', 'v3'],
        memberCount: 3,
        createdAt: '2024-11-01T00:00:00Z',
        isActive: true
      },
      {
        id: 'grp2',
        name: 'Clients VIP',
        description: 'Groupe des clients avec un statut VIP',
        members: ['c1', 'c2', 'c3', 'c4'],
        memberCount: 4,
        createdAt: '2024-11-15T00:00:00Z',
        isActive: true
      },
      {
        id: 'grp3',
        name: 'Support Technique',
        description: 'Équipe de support technique',
        members: ['admin1', 'admin2', 'admin3'],
        memberCount: 3,
        createdAt: '2024-10-01T00:00:00Z',
        isActive: true
      }
    ]

    setInternalMessages(mockInternalMessages)
    setMessageTemplates(mockMessageTemplates)
    setMessageGroups(mockMessageGroups)

    // Données mock pour les utilisateurs disponibles
    const mockAvailableUsers = [
      {
        id: 'u1',
        name: 'Jean Dupont',
        email: 'jean.dupont@email.com',
        phone: '+225 01234567',
        role: 'buyer' as const,
        status: 'active' as const,
        avatar: 'JD'
      },
      {
        id: 'u2',
        name: 'Marie Martin',
        email: 'marie.martin@email.com',
        phone: '+225 01234568',
        role: 'buyer' as const,
        status: 'active' as const,
        avatar: 'MM'
      },
      {
        id: 'u3',
        name: 'Pierre Durand',
        email: 'pierre.durand@email.com',
        phone: '+225 01234569',
        role: 'buyer' as const,
        status: 'active' as const,
        avatar: 'PD'
      },
      {
        id: 'u4',
        name: 'Sophie Bernard',
        email: 'sophie.bernard@email.com',
        phone: '+225 01234570',
        role: 'buyer' as const,
        status: 'inactive' as const,
        avatar: 'SB'
      },
      {
        id: 'v1',
        name: 'TechStore Pro',
        email: 'contact@techstore.com',
        phone: '+225 01234571',
        role: 'vendor' as const,
        status: 'active' as const,
        avatar: 'TP'
      },
      {
        id: 'v2',
        name: 'Electronics Plus',
        email: 'info@electronicsplus.com',
        phone: '+225 01234572',
        role: 'vendor' as const,
        status: 'active' as const,
        avatar: 'EP'
      },
      {
        id: 'v3',
        name: 'Beaute Naturelle',
        email: 'contact@beaute-naturelle.com',
        phone: '+225 01234573',
        role: 'vendor' as const,
        status: 'active' as const,
        avatar: 'BN'
      },
      {
        id: 'admin1',
        name: 'Admin Principal',
        email: 'admin@probooster.com',
        phone: '+225 01234574',
        role: 'admin' as const,
        status: 'active' as const,
        avatar: 'AP'
      },
      {
        id: 'admin2',
        name: 'Admin Support',
        email: 'support@probooster.com',
        phone: '+225 01234575',
        role: 'admin' as const,
        status: 'active' as const,
        avatar: 'AS'
      }
    ]

    setAvailableUsers(mockAvailableUsers)
  }
  
  // Fonctions utilitaires
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `Il y a ${diffInMinutes} min`
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`
    } else {
      return date.toLocaleDateString('fr-FR')
    }
  }
  
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '⚪' },
      medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🟡' },
      high: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '🟠' },
      urgent: { color: 'bg-red-100 text-red-800 border-red-200', icon: '🔴' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low
    
    return (
      <Badge variant="outline" className={config.color}>
        {config.icon} {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }
  
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default', text: 'Active' },
      pending: { variant: 'secondary', text: 'En Attente' },
      resolved: { variant: 'outline', text: 'Résolue' },
      archived: { variant: 'secondary', text: 'Archivée' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <Badge variant={config.variant as any}>
        {config.text}
      </Badge>
    )
  }
  
  // Gestionnaires d'événements
  const handleChatSelect = (chat: ChatSession) => {
    setSelectedChat(chat)
    setShowChatModal(true)
    // Marquer comme lu
    setChatSessions(prev => prev.map(c => 
      c.id === chat.id ? { ...c, unreadCount: 0 } : c
    ))
  }
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return
    
    const message: ChatMessage = {
      id: generateUniqueId('msg_'),
      chatId: selectedChat.id,
      senderId: 'super_admin',
      senderName: 'Super Admin',
      senderType: 'super_admin',
      content: newMessage,
      type: 'text',
      timestamp: new Date().toISOString(),
      isRead: false,
      isFlagged: false,
      isFromGlobalChat: false,
      originalChatId: selectedChat.id,
      messageStatus: 'sent',
      isOnline: true
    }
    
    setChatMessages(prev => [...prev, message])
    setNewMessage('')
    
    // Mettre à jour la session
    setChatSessions(prev => prev.map(c => 
      c.id === selectedChat.id 
        ? { ...c, lastMessageAt: new Date().toISOString(), totalMessages: c.totalMessages + 1 }
        : c
    ))
    
    // Notification de succès
    console.log('Message envoyé avec succès')
  }
  
  const handleChatStatusChange = (chatId: string, newStatus: string) => {
    setChatSessions(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, status: newStatus as any } : chat
    ))
    
    console.log(`Statut modifié en "${newStatus}"`)
  }
  
  const handleFlagMessage = (messageId: string, reason: string) => {
    setChatMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, isFlagged: true, flagReason: reason } : msg
    ))
    
    console.log('Message signalé pour modération')
  }
  
  // Nouvelles fonctions pour la supervision et synchronisation
  const handleMonitorChat = (chat: ChatSession) => {
    setChatSessions(prev => prev.map(c =>
      c.id === chat.id ? { ...c, isMonitored: true } : c
    ))
    
    // Enregistrer l'action de supervision
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: chat.id,
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'monitor',
      timestamp: new Date().toISOString(),
      details: `Chat mis sous surveillance: ${chat.customerName}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
    
    // Mettre à jour les statistiques
    setChatStats(prev => ({
      ...prev,
      monitoredChats: prev.monitoredChats + 1
    }))
    
    console.log('Chat mis sous surveillance')
  }

  // Fonctions pour la Messagerie Interne
  const handleComposeMessage = () => {
    setShowComposeMessageModal(true)
  }

  const handleSendInternalMessage = () => {
    if (!composeForm.title.trim() || !composeForm.content.trim() || composeForm.recipients.length === 0) {
      console.log('Veuillez remplir tous les champs obligatoires')
      return
    }

    const newInternalMessage: InternalMessage = {
      id: generateUniqueId('int_'),
      title: composeForm.title,
      content: composeForm.content,
      type: composeForm.type,
      priority: composeForm.priority,
      senderId: 'super_admin',
      senderName: 'Super Admin',
      senderRole: 'super_admin',
      recipients: composeForm.recipients,
      status: 'sent',
      createdAt: new Date().toISOString(),
      scheduledFor: composeForm.scheduledFor || undefined,
      expiresAt: composeForm.expiresAt || undefined,
      isPinned: composeForm.isPinned,
      requiresConfirmation: composeForm.requiresConfirmation,
      tags: composeForm.tags,
      attachments: composeForm.attachments
    }

    setInternalMessages(prev => [newInternalMessage, ...prev])
    
    // Réinitialiser le formulaire
    setComposeForm({
      title: '',
      content: '',
      type: 'announcement',
      priority: 'medium',
      recipients: [],
      scheduledFor: '',
      expiresAt: '',
      isPinned: false,
      requiresConfirmation: false,
      tags: [],
      attachments: []
    })

    setShowComposeMessageModal(false)
    console.log('Message interne envoyé avec succès')
  }

  const handleMessageTemplateSelect = (template: MessageTemplate) => {
    setComposeForm(prev => ({
      ...prev,
      title: template.title,
      content: template.content,
      type: template.type
    }))
    setShowTemplateManagerModal(false)
  }



  const getMessageTypeIcon = (type: InternalMessage['type']) => {
    const iconConfig = {
      announcement: '📢',
      change: '🔄',
      alert: '⚠️',
      information: 'ℹ️',
      congratulation: '🎉',
      reminder: '🔔'
    }
    return iconConfig[type] || '📝'
  }

  const getMessageTypeColor = (type: InternalMessage['type']) => {
    const colorConfig = {
      announcement: 'bg-blue-100 text-blue-800 border-blue-200',
      change: 'bg-green-100 text-green-800 border-green-200',
      alert: 'bg-red-100 text-red-800 border-red-200',
      information: 'bg-gray-100 text-gray-800 border-gray-200',
      congratulation: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      reminder: 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return colorConfig[type] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getMessageStatusIcon = (status: InternalMessage['status']) => {
    const statusConfig = {
      draft: '📝',
      sent: '📤',
      delivered: '📨',
      read: '✅'
    }
    return statusConfig[status] || '📝'
  }

  // Fonctions pour la gestion des destinataires
  const handleAddRecipient = (user: typeof availableUsers[0]) => {
    const newRecipient: MessageRecipient = {
      id: user.id,
      name: user.name,
      email: user.email,
      type: 'individual',
      role: user.role
    }
    
    if (!selectedRecipients.find(r => r.id === user.id)) {
      setSelectedRecipients(prev => [...prev, newRecipient])
      setComposeForm(prev => ({ ...prev, recipients: [...prev.recipients, newRecipient] }))
    }
  }

  const handleRemoveRecipient = (recipientId: string) => {
    setSelectedRecipients(prev => prev.filter(r => r.id !== recipientId))
    setComposeForm(prev => ({ ...prev, recipients: prev.recipients.filter(r => r.id !== recipientId) }))
  }

  const handleAddRoleRecipients = (role: 'buyer' | 'vendor' | 'admin') => {
    const roleUsers = availableUsers.filter(user => user.role === role && user.status === 'active')
    const roleRecipient: MessageRecipient = {
      id: `role_${role}`,
      name: `Tous les ${role === 'buyer' ? 'Acheteurs' : role === 'vendor' ? 'Vendeurs' : 'Admins'}`,
      email: `${role}s@probooster.com`,
      type: 'role',
      role: role
    }
    
    // Vérifier si le rôle n'est pas déjà sélectionné
    if (!selectedRecipients.find(r => r.id === `role_${role}`)) {
      setSelectedRecipients(prev => [...prev, roleRecipient])
      setComposeForm(prev => ({ ...prev, recipients: [...prev.recipients, roleRecipient] }))
    }
  }

  const handleRemoveRoleRecipients = (role: 'buyer' | 'vendor' | 'admin') => {
    setSelectedRecipients(prev => prev.filter(r => r.id !== `role_${role}`))
    setComposeForm(prev => ({ ...prev, recipients: prev.recipients.filter(r => r.id !== `role_${role}`) }))
  }

  const handleSelectAllUsers = () => {
    const activeUsers = availableUsers.filter(user => user.status === 'active')
    
    // Si tous les utilisateurs sont déjà sélectionnés, on les désélectionne tous
    if (isAllUsersSelected()) {
      setSelectedRecipients([])
      setComposeForm(prev => ({ ...prev, recipients: [] }))
    } else {
      // Sinon, on sélectionne tous les utilisateurs actifs
      const allRecipients: MessageRecipient[] = activeUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        type: 'individual',
        role: user.role
      }))
      
      setSelectedRecipients(allRecipients)
      setComposeForm(prev => ({ ...prev, recipients: allRecipients }))
    }
  }

  const handleClearAllRecipients = () => {
    setSelectedRecipients([])
    setComposeForm(prev => ({ ...prev, recipients: [] }))
  }

  const getFilteredUsers = () => {
    return availableUsers.filter(user => {
      const matchesSearch = recipientSearchTerm === '' || 
        user.name.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(recipientSearchTerm.toLowerCase()) ||
        user.phone.includes(recipientSearchTerm)
      
      const matchesRole = recipientRoleFilter === 'all' || user.role === recipientRoleFilter
      
      return matchesSearch && matchesRole
    })
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      buyer: 'Acheteur',
      vendor: 'Vendeur',
      admin: 'Admin'
    }
    return roleNames[role as keyof typeof roleNames] || role
  }

  const getStatusDisplayName = (status: string) => {
    const statusNames = {
      active: 'Actif',
      inactive: 'Inactif'
    }
    return statusNames[status as keyof typeof statusNames] || status
  }

  // Fonctions pour la gestion des templates
  const handleCreateTemplate = () => {
    if (!templateForm.name.trim() || !templateForm.title.trim() || !templateForm.content.trim()) {
      console.log('Veuillez remplir tous les champs obligatoires')
      return
    }

    const newTemplate: MessageTemplate = {
      id: generateUniqueId('tpl_'),
      name: templateForm.name,
      title: templateForm.title,
      content: templateForm.content,
      type: templateForm.type,
      category: templateForm.category,
      isDefault: false,
      usageCount: 0,
      lastUsed: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    setMessageTemplates(prev => [newTemplate, ...prev])
    
    // Réinitialiser le formulaire
    setTemplateForm({
      name: '',
      title: '',
      content: '',
      type: 'announcement',
      category: 'general'
    })

    setShowCreateTemplateModal(false)
    console.log('Template créé avec succès')
  }

  const handleEditTemplate = (template: MessageTemplate) => {
    setTemplateForm({
      name: template.name,
      title: template.title,
      content: template.content,
      type: template.type,
      category: template.category
    })
    setShowCreateTemplateModal(true)
  }

  const handleDeleteTemplate = (templateId: string) => {
    setMessageTemplates(prev => prev.filter(t => t.id !== templateId))
    console.log('Template supprimé avec succès')
  }

  const handleDuplicateTemplate = (template: MessageTemplate) => {
    const duplicatedTemplate: MessageTemplate = {
      ...template,
      id: generateUniqueId('tpl_'),
      name: `${template.name} (Copie)`,
      createdAt: new Date().toISOString(),
      usageCount: 0,
      lastUsed: new Date().toISOString()
    }

    setMessageTemplates(prev => [duplicatedTemplate, ...prev])
    console.log('Template dupliqué avec succès')
  }

  const getCategoryDisplayName = (category: string) => {
    const categoryNames = {
      general: 'Général',
      technical: 'Technique',
      marketing: 'Marketing',
      support: 'Support',
      security: 'Sécurité'
    }
    return categoryNames[category as keyof typeof categoryNames] || category
  }

  // Fonctions pour la gestion des groupes
  const handleCreateGroup = () => {
    if (!groupForm.name.trim() || selectedGroupMembers.length === 0) {
      console.log('Veuillez remplir le nom du groupe et sélectionner au moins un membre')
      return
    }

    const newGroup: MessageGroup = {
      id: generateUniqueId('grp_'),
      name: groupForm.name,
      description: groupForm.description,
      members: selectedGroupMembers,
      memberCount: selectedGroupMembers.length,
      isActive: true,
      createdAt: new Date().toISOString()
    }

    setMessageGroups(prev => [newGroup, ...prev])
    
    // Réinitialiser le formulaire
    setGroupForm({
      name: '',
      description: '',
      category: 'general'
    })
    setSelectedGroupMembers([])
    setShowCreateGroupModal(false)
    console.log('Groupe créé avec succès')
  }

  const handleEditGroup = (group: MessageGroup) => {
    setGroupForm({
      name: group.name,
      description: group.description,
      category: 'general'
    })
    setSelectedGroupMembers(group.members)
    setShowCreateGroupModal(true)
  }

  const handleDeleteGroup = (groupId: string) => {
    setMessageGroups(prev => prev.filter(g => g.id !== groupId))
    console.log('Groupe supprimé avec succès')
  }

  const handleAddGroupMember = (userId: string) => {
    if (!selectedGroupMembers.includes(userId)) {
      setSelectedGroupMembers(prev => [...prev, userId])
    }
  }

  const handleRemoveGroupMember = (userId: string) => {
    setSelectedGroupMembers(prev => prev.filter(id => id !== userId))
  }

  const handleAddRoleToGroup = (role: string) => {
    const usersWithRole = availableUsers.filter(user => user.role === role)
    const newMemberIds = usersWithRole.map(user => user.id)
    setSelectedGroupMembers(prev => [...new Set([...prev, ...newMemberIds])])
  }

  const getFilteredGroupUsers = () => {
    return availableUsers.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(groupSearchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(groupSearchTerm.toLowerCase()) ||
                           user.phone.includes(groupSearchTerm)
      const matchesRole = groupRoleFilter === 'all' || user.role === groupRoleFilter
      return matchesSearch && matchesRole
    })
  }

  // Fonction pour vérifier si tous les utilisateurs sont sélectionnés
  const isAllUsersSelected = () => {
    const activeUsers = availableUsers.filter(user => user.status === 'active')
    return activeUsers.length > 0 && activeUsers.every(user => 
      selectedRecipients.some(r => r.id === user.id)
    )
  }
  
  const handleEscalateChat = (chat: ChatSession, level: 'escalated' | 'critical') => {
    setChatSessions(prev => prev.map(c =>
      c.id === chat.id ? { ...c, escalationLevel: level } : c
    ))
    
    // Enregistrer l'action d'escalade
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: chat.id,
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'escalate',
      timestamp: new Date().toISOString(),
      details: `Chat escaladé au niveau: ${level}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
    
    // Mettre à jour les statistiques
    setChatStats(prev => ({
      ...prev,
      escalatedChats: prev.escalatedChats + 1
    }))
    
    console.log(`Chat ${chat.customerName} escaladé au niveau ${level}`)
  }
  
  const handleAssignChat = (chatId: string, assignedTo: string) => {
    setChatSessions(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, assignedTo } : chat
    ))
    
    // Enregistrer l'action d'assignation
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId,
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'assign',
      timestamp: new Date().toISOString(),
      details: `Chat assigné à: ${assignedTo}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
    
    console.log(`Conversation assignée à ${assignedTo}`)
  }
  
  const handleSyncChats = () => {
    // Simuler la synchronisation avec tous les chats du site
    setSyncStatus(prev => ({
      ...prev,
      syncProgress: 0,
      isConnected: true
    }))
    
    // Simulation de la progression de synchronisation
    let progress = 0
    const syncInterval = setInterval(() => {
      progress += 20
      setSyncStatus(prev => ({
        ...prev,
        syncProgress: progress
      }))
      
      if (progress >= 100) {
        clearInterval(syncInterval)
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date().toISOString(),
          syncProgress: 100,
          syncErrors: 0
        }))
        
        console.log('Synchronisation terminée avec succès')
      }
    }, 200)
  }
  
  const handleBlockUser = (chat: ChatSession) => {
    // Enregistrer l'action de blocage
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: chat.id,
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'block',
      timestamp: new Date().toISOString(),
      details: `Utilisateur bloqué: ${chat.customerName}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
    
    console.log(`Utilisateur ${chat.customerName} bloqué`)
  }

  // Fonction pour afficher les détails d'un message signalé
  const handleViewFlaggedMessage = (message: ChatMessage) => {
    setSelectedFlaggedMessage(message)
    setShowMessageDetailsModal(true)
    
    // Enregistrer l'action de consultation
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: message.chatId,
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'flag',
      timestamp: new Date().toISOString(),
      details: `Message signalé consulté: ${message.content.substring(0, 50)}...`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
    
    console.log('Détails du message signalé affichés')
  }

  // Fonction pour résoudre un message signalé
  const handleResolveFlaggedMessage = (messageId: string) => {
    setChatMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, isFlagged: false, flagReason: undefined } : msg
    ))
    
    // Mettre à jour les statistiques
    setChatStats(prev => ({
      ...prev,
      flaggedMessages: Math.max(0, prev.flaggedMessages - 1)
    }))
    
    // Enregistrer l'action de résolution
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: selectedFlaggedMessage?.chatId || '',
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'resolve',
      timestamp: new Date().toISOString(),
      details: `Message signalé résolu: ${selectedFlaggedMessage?.content.substring(0, 50)}...`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
    
    setShowMessageDetailsModal(false)
    setSelectedFlaggedMessage(null)
    
    console.log('Message signalé résolu avec succès')
  }

  // Fonction pour ouvrir le modal d'action de supervision
  const handleSupervisionAction = (action: 'monitor' | 'escalate' | 'block') => {
    setSelectedSupervisionAction(action)
    setShowSupervisionActionModal(true)
  }

  // Fonction pour appliquer l'action de supervision sur un chat spécifique
  const handleApplySupervisionAction = (chatId: string, action: 'monitor' | 'escalate' | 'block') => {
    const chat = chatSessions.find(c => c.id === chatId)
    if (!chat) return

    switch (action) {
      case 'monitor':
        handleMonitorChat(chat)
        break
      case 'escalate':
        handleEscalateChat(chat, 'escalated')
        break
      case 'block':
        handleBlockUser(chat)
        break
    }

    setShowSupervisionActionModal(false)
    setSelectedSupervisionAction(null)
    setSelectedChatForSupervisionAction(null)
  }

  // Nouvelles fonctions pour la configuration de la synchronisation et gestion des notifications
  const handleSyncConfiguration = () => {
    setShowSyncConfigModal(true)
  }

  const handleNotificationsManagement = () => {
    setShowNotificationsManageModal(true)
  }

  const handleSaveSyncConfig = () => {
    // Appliquer la nouvelle configuration
    setSyncStatus(prev => ({
      ...prev,
      activeConnections: Math.min(prev.activeConnections, syncConfig.maxConnections)
    }))

    // Enregistrer l'action de configuration
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: 'system',
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'config',
      timestamp: new Date().toISOString(),
      details: `Configuration de synchronisation mise à jour - Fréquence: ${syncConfig.syncFrequency}s, Connexions max: ${syncConfig.maxConnections}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
    
    setShowSyncConfigModal(false)
    console.log('Configuration de synchronisation sauvegardée')
  }

  const handleSaveNotificationsConfig = () => {
    // Appliquer la nouvelle configuration des notifications
    setChatStats(prev => ({
      ...prev,
      realTimeConnections: notificationsConfig.pushEnabled ? prev.realTimeConnections : 0
    }))

    // Enregistrer l'action de configuration
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: 'system',
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'config',
      timestamp: new Date().toISOString(),
      details: `Configuration des notifications mise à jour - Push: ${notificationsConfig.pushEnabled}, Email: ${notificationsConfig.emailEnabled}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
    
    setShowNotificationsManageModal(false)
    console.log('Configuration des notifications sauvegardée')
  }

  const handleTestSyncConnection = () => {
    // Simuler un test de connexion
    setSyncStatus(prev => ({
      ...prev,
      syncProgress: 0
    }))

    let progress = 0
    const testInterval = setInterval(() => {
      progress += 25
      setSyncStatus(prev => ({
        ...prev,
        syncProgress: progress
      }))

      if (progress >= 100) {
        clearInterval(testInterval)
        setSyncStatus(prev => ({
          ...prev,
          syncProgress: 100,
          syncErrors: 0
        }))
        
        // Enregistrer l'action de test
        const action: SupervisorAction = {
          id: generateUniqueId('action_'),
          chatId: 'system',
          supervisorId: 'super_admin',
          supervisorName: 'Super Admin',
          action: 'test',
          timestamp: new Date().toISOString(),
          details: 'Test de connexion de synchronisation réussi',
          result: 'success'
        }
        
        setSupervisorActions(prev => [action, ...prev])
        
        console.log('Test de connexion de synchronisation réussi')
      }
    }, 200)
  }

  const handleTestNotification = (type: 'push' | 'email' | 'sms') => {
    // Simuler l'envoi d'une notification de test
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: 'system',
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'test',
      timestamp: new Date().toISOString(),
      details: `Notification de test ${type} envoyée avec succès`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
    
    console.log(`Notification de test ${type} envoyée`)
  }

  // Nouvelles fonctions pour les fonctionnalités avancées
  const handleEmojiSelection = (emoji: string) => {
    setSelectedEmoji(emoji)
    setShowEmojiPickerModal(true)
    
    // Enregistrer l'action
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: 'system',
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'config',
      timestamp: new Date().toISOString(),
      details: `Emoji sélectionné: ${emoji}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
  }

  const handleFileUpload = (type: 'file' | 'audio' | 'voice' | 'gif') => {
    setShowFileUploadModal(true)
    
    // Enregistrer l'action
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: 'system',
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'config',
      timestamp: new Date().toISOString(),
      details: `Upload de ${type} initié`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
  }

  const handleQuickResponseSelection = (response: string) => {
    setSelectedQuickResponse(response)
    setShowQuickResponseModal(true)
    
    // Enregistrer l'action
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: 'system',
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'config',
      timestamp: new Date().toISOString(),
      details: `Réponse rapide sélectionnée: ${response}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
  }

  const handleMessageTemplateSelection = (template: string) => {
    setSelectedMessageTemplate(template)
    setShowMessageTemplateModal(true)
    
    // Enregistrer l'action
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: 'system',
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'config',
      timestamp: new Date().toISOString(),
      details: `Modèle de message sélectionné: ${template}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
  }

  const handleModerationAction = (action: string) => {
    setSelectedModerationAction(action)
    setShowModerationToolsModal(true)
    
    // Enregistrer l'action
    const supervisorAction: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: 'system',
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'config',
      timestamp: new Date().toISOString(),
      details: `Action de modération sélectionnée: ${action}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [supervisorAction, ...prev])
  }

  const handleAIFeature = (feature: string) => {
    setSelectedAIFeature(feature)
    setShowAIToolsModal(true)
    
    // Enregistrer l'action
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: 'system',
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'config',
      timestamp: new Date().toISOString(),
      details: `Fonctionnalité IA sélectionnée: ${feature}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
  }

  const handleThemeSelection = (theme: string) => {
    setSelectedTheme(theme)
    setShowThemeCustomizationModal(true)
    
    // Enregistrer l'action
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: 'system',
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'config',
      timestamp: new Date().toISOString(),
      details: `Thème sélectionné: ${theme}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
  }

  const handleProductivityTool = (tool: string) => {
    setSelectedProductivityTool(tool)
    setShowProductivityToolsModal(true)
    
    // Enregistrer l'action
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: 'system',
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'config',
      timestamp: new Date().toISOString(),
      details: `Outil de productivité sélectionné: ${tool}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
  }

  const handleIntegration = (integration: string) => {
    setSelectedIntegration(integration)
    setShowIntegrationsModal(true)
    
    // Enregistrer l'action
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: 'system',
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'config',
      timestamp: new Date().toISOString(),
      details: `Intégration sélectionnée: ${integration}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
  }

  const handleExportFormat = (format: string) => {
    setSelectedExportFormat(format)
    setShowExportModal(true)
    
    // Enregistrer l'action
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: 'system',
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'config',
      timestamp: new Date().toISOString(),
      details: `Format d'export sélectionné: ${format}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
  }

  const handleSaveAdvancedFeaturesConfig = () => {
    // Sauvegarder la configuration des fonctionnalités avancées
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: 'system',
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'config',
      timestamp: new Date().toISOString(),
      details: 'Configuration des fonctionnalités avancées sauvegardée',
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
    
    // Fermer tous les modaux
    setShowEmojiPickerModal(false)
    setShowFileUploadModal(false)
    setShowQuickResponseModal(false)
    setShowMessageTemplateModal(false)
    setShowModerationToolsModal(false)
    setShowAIToolsModal(false)
    setShowThemeCustomizationModal(false)
    setShowProductivityToolsModal(false)
    setShowIntegrationsModal(false)
    setShowExportModal(false)
    
    console.log('Configuration des fonctionnalités avancées sauvegardée')
  }

  // Nouvelles fonctions pour les boutons d'en-tête
  const handleRefresh = () => {
    setIsRefreshing(true)
    
    // Simuler le rechargement des données
    setTimeout(() => {
      // Recharger les données mock
      loadMockData()
      
      // Mettre à jour les statistiques
      setChatStats(prev => ({
        ...prev,
        totalConversations: Math.floor(Math.random() * 100) + prev.totalConversations,
        activeConversations: Math.floor(Math.random() * 20) + 80,
        pendingConversations: Math.floor(Math.random() * 10) + 10,
        resolvedToday: Math.floor(Math.random() * 10) + 20
      }))
      
      // Mettre à jour le statut de synchronisation
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date().toISOString(),
        activeConnections: Math.floor(Math.random() * 20) + 40,
        pendingMessages: Math.floor(Math.random() * 10) + 5
      }))
      
      // Enregistrer l'action
      const action: SupervisorAction = {
        id: generateUniqueId('action_'),
        chatId: 'system',
        supervisorId: 'super_admin',
        supervisorName: 'Super Admin',
        action: 'config',
        timestamp: new Date().toISOString(),
        details: 'Actualisation des données de messagerie effectuée',
        result: 'success'
      }
      
      setSupervisorActions(prev => [action, ...prev])
      
      setIsRefreshing(false)
      console.log('Données actualisées avec succès')
    }, 2000) // 2 secondes pour simuler le chargement
  }

  const handleNewConversation = () => {
    setShowNewConversationModal(true)
  }

  const handleCreateNewConversation = (customerName: string, subject: string, priority: 'low' | 'medium' | 'high' | 'urgent') => {
    // Créer une nouvelle conversation
    const newConversation: ChatSession = {
      id: generateUniqueId('chat_'),
      customerId: generateUniqueId('customer_'),
      customerName: customerName,
      customerEmail: `${customerName.toLowerCase().replace(' ', '.')}@email.com`,
      vendorId: undefined,
      vendorName: undefined,
      productId: undefined,
      productName: undefined,
      status: 'active',
      priority: priority,
      category: 'general',
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      totalMessages: 1,
      assignedTo: undefined,
      tags: [],
      notes: subject,
      source: 'global_chat',
      location: 'France',
      deviceInfo: 'Desktop',
      browserInfo: 'Chrome',
      ipAddress: '192.168.1.1',
      isMonitored: false,
      lastSupervisorAction: undefined,
      escalationLevel: 'normal'
    }
    
    // Ajouter la conversation à la liste
    setChatSessions(prev => [newConversation, ...prev])
    
    // Mettre à jour les statistiques
    setChatStats(prev => ({
      ...prev,
      totalConversations: prev.totalConversations + 1,
      activeConversations: prev.activeConversations + 1
    }))
    
    // Enregistrer l'action
    const action: SupervisorAction = {
      id: generateUniqueId('action_'),
      chatId: newConversation.id,
      supervisorId: 'super_admin',
      supervisorName: 'Super Admin',
      action: 'config',
      timestamp: new Date().toISOString(),
      details: `Nouvelle conversation créée avec ${customerName}`,
      result: 'success'
    }
    
    setSupervisorActions(prev => [action, ...prev])
    
    setShowNewConversationModal(false)
    console.log(`Nouvelle conversation créée avec ${customerName}`)
  }
  
  // Filtrage des conversations
  const filteredChats = chatSessions.filter(chat => {
    const matchesSearch = chat.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.productName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || chat.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || chat.priority === priorityFilter
    const matchesCategory = categoryFilter === 'all' || chat.category === categoryFilter
    const matchesAssigned = assignedFilter === 'all' || 
                           (assignedFilter === 'unassigned' && !chat.assignedTo) ||
                           (assignedFilter === 'assigned' && chat.assignedTo)
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssigned
  })
  
  return (
    <div className="space-y-6">
      {/* En-tête principal avec navigation */}
      <div className="bg-gradient-to-r from-[#ff6600]/10 to-[#535455]/10 border border-[#ff6600]/20 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#535455]">Messagerie & Chat</h2>
            <p className="text-[#535455]/80 mt-2">
              Supervision et gestion complète de tous les chats du site
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors duration-200"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualisation...' : 'Actualiser'}
            </Button>
            <Button 
              className={`${mainMode === 'chat' ? 'bg-[#ff6600] text-white' : 'bg-white text-[#ff6600] border-[#ff6600]'} hover:bg-[#ff6600] hover:text-white transition-all duration-200 shadow-md`}
              onClick={() => setMainMode('chat')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Button>
            <Button 
              className={`${mainMode === 'messaging' ? 'bg-[#ff6600] text-white' : 'bg-white text-[#ff6600] border-[#ff6600]'} hover:bg-[#ff6600] hover:text-white transition-all duration-200 shadow-md`}
              onClick={() => setMainMode('messaging')}
            >
              <Mail className="h-4 w-4 mr-2" />
              Messagerie Interne
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-all duration-200 border-[#ff6600]/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-8 w-8 text-[#ff6600]" />
              <div>
                <p className="text-2xl font-bold text-[#535455]">{chatStats.totalConversations.toLocaleString()}</p>
                <p className="text-sm text-[#535455]/70">Conversations totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-200 border-[#ff6600]/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-[#ff6600]" />
              <div>
                <p className="text-2xl font-bold text-[#535455]">{chatStats.activeConversations}</p>
                <p className="text-sm text-[#535455]/70">Conversations actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-200 border-[#ff6600]/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-[#ff6600]" />
              <div>
                <p className="text-2xl font-bold text-[#535455]">{chatStats.pendingConversations}</p>
                <p className="text-sm text-[#535455]/70">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-200 border-[#ff6600]/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-[#ff6600]" />
              <div>
                <p className="text-2xl font-bold text-[#535455]">{chatStats.averageResponseTime}min</p>
                <p className="text-sm text-[#535455]/70">Temps de réponse</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation par onglets - Mode Chat */}
      {mainMode === 'chat' && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="conversations" 
              className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 ease-in-out hover:bg-[#ff6600]/10 data-[state=active]:hover:bg-[#ff6600] rounded-md"
            >
              Conversations
            </TabsTrigger>
            <TabsTrigger 
              value="moderation" 
              className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 ease-in-out hover:bg-[#ff6600]/10 data-[state=active]:hover:bg-[#ff6600] rounded-md"
            >
              Modération
            </TabsTrigger>
            <TabsTrigger 
              value="supervision" 
              className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 ease-in-out hover:bg-[#ff6600]/10 data-[state=active]:hover:bg-[#ff6600] rounded-md"
            >
              Supervision
            </TabsTrigger>
            <TabsTrigger 
              value="synchronisation" 
              className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 ease-in-out hover:bg-[#ff6600]/10 data-[state=active]:hover:bg-[#ff6600] rounded-md"
            >
              Synchronisation
            </TabsTrigger>
            <TabsTrigger 
              value="avancees" 
              className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 ease-in-out hover:bg-[#ff6600]/10 data-[state=active]:hover:bg-[#ff6600] rounded-md"
            >
              Fonctions Avancées
            </TabsTrigger>
            <TabsTrigger 
              value="statistiques" 
              className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 ease-in-out hover:bg-[#ff6600]/10 data-[state=active]:hover:bg-[#ff6600] rounded-md"
            >
              Statistiques
            </TabsTrigger>
          </TabsList>

        {/* Onglet Conversations */}
        <TabsContent value="conversations" className="space-y-4">
          <div className="space-y-4">
            {/* En-tête avec bouton Nouvelle Conversation */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher par nom client, produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <Button
                onClick={() => setShowNewConversationModal(true)}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Nouvelle Conversation
              </Button>
            </div>

            {/* Filtres et recherche */}
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="resolved">Résolue</SelectItem>
                  <SelectItem value="archived">Archivée</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes priorités</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="sales">Ventes</SelectItem>
                  <SelectItem value="technical">Technique</SelectItem>
                  <SelectItem value="complaint">Réclamation</SelectItem>
                  <SelectItem value="general">Général</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Assignation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="assigned">Assignées</SelectItem>
                  <SelectItem value="unassigned">Non assignées</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Liste des conversations */}
            <div className="space-y-3">
              {filteredChats.map((chat) => (
                <Card key={chat.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-[#ff6600]/10 hover:border-[#ff6600]/30" 
                      onClick={() => handleChatSelect(chat)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-[#ff6600] to-[#ff6600]/80 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                          {chat.customerName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-[#535455]">{chat.customerName}</h3>
                            {chat.assignedTo && (
                              <Badge variant="outline" className="text-xs border-[#535455] text-[#535455] bg-[#535455]/5">
                                Assigné à {chat.assignedTo}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-[#535455]/70">{chat.productName}</p>
                          <p className="text-xs text-[#535455]/50">{formatTime(chat.lastMessageAt)}</p>
                          {/* Nouvelles informations de supervision */}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs border-[#ff6600] text-[#ff6600] bg-[#ff6600]/5">
                              {chat.source.replace('_', ' ')}
                            </Badge>
                            {chat.isMonitored && (
                              <Badge variant="secondary" className="text-xs bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/20">
                                Surveillé
                              </Badge>
                            )}
                            {chat.escalationLevel !== 'normal' && (
                              <Badge variant="destructive" className="text-xs">
                                {chat.escalationLevel === 'escalated' ? 'Escaladé' : 'Critique'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {chat.unreadCount > 0 && (
                          <Badge variant="destructive" className="bg-[#ff6600] text-white">{chat.unreadCount}</Badge>
                        )}
                        {getPriorityBadge(chat.priority)}
                        {getStatusBadge(chat.status)}
                        <div className="flex gap-1">
                          {chat.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-[#535455] text-[#535455] bg-[#535455]/5">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button size="sm" variant="outline" className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors duration-200">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {/* Nouveaux boutons d'action de supervision */}
                        <div className="flex gap-1">
                          {!chat.isMonitored && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMonitorChat(chat)
                              }}
                              className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors duration-200"
                            >
                              <Shield className="h-3 w-3" />
                            </Button>
                          )}
                          {chat.escalationLevel === 'normal' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEscalateChat(chat, 'escalated')
                              }}
                              className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors duration-200"
                            >
                              <AlertTriangle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleBlockUser(chat)
                            }}
                            className="text-red-600 border-red-300 hover:bg-red-50 transition-colors duration-200"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Onglet Messagerie Interne */}
        <TabsContent value="messagerie_interne" className="space-y-4">
          {/* En-tête avec boutons d'action */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Messagerie Interne</h2>
              <p className="text-gray-600 mt-2">
                Envoyez des messages internes aux utilisateurs : annonces, changements, alertes et plus
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleComposeMessage}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Nouveau Message
              </Button>
              <Button
                onClick={() => setShowTemplateManagerModal(true)}
                variant="outline"
                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button
                onClick={() => setShowGroupManagerModal(true)}
                variant="outline"
                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Groupes
              </Button>
            </div>
          </div>

          {/* Filtres et recherche */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Rechercher des messages..."
                    value={messageSearchTerm}
                    onChange={(e) => setMessageSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={messageTypeFilter} onValueChange={setMessageTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type de message" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="announcement">📢 Annonces</SelectItem>
                    <SelectItem value="change">🔄 Changements</SelectItem>
                    <SelectItem value="alert">⚠️ Alertes</SelectItem>
                    <SelectItem value="information">ℹ️ Informations</SelectItem>
                    <SelectItem value="congratulation">🎉 Félicitations</SelectItem>
                    <SelectItem value="reminder">🔔 Rappels</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={messagePriorityFilter} onValueChange={setMessagePriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes priorités</SelectItem>
                    <SelectItem value="low">⚪ Faible</SelectItem>
                    <SelectItem value="medium">🟡 Moyenne</SelectItem>
                    <SelectItem value="high">🟠 Haute</SelectItem>
                    <SelectItem value="urgent">🔴 Urgente</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={messageStatusFilter} onValueChange={setMessageStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    <SelectItem value="draft">📝 Brouillon</SelectItem>
                    <SelectItem value="sent">📤 Envoyé</SelectItem>
                    <SelectItem value="delivered">📨 Livré</SelectItem>
                    <SelectItem value="read">✅ Lu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste des messages */}
          <div className="space-y-4">
            {internalMessages
              .filter(msg => {
                const matchesSearch = messageSearchTerm === '' || 
                  msg.title.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
                  msg.content.toLowerCase().includes(messageSearchTerm.toLowerCase())
                const matchesType = messageTypeFilter === 'all' || msg.type === messageTypeFilter
                const matchesPriority = messagePriorityFilter === 'all' || msg.priority === messagePriorityFilter
                const matchesStatus = messageStatusFilter === 'all' || msg.status === messageStatusFilter
                return matchesSearch && matchesType && matchesPriority && matchesStatus
              })
              .map((message) => (
                <Card key={message.id} className="border-l-4 border-l-[#ff6600] hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{getMessageTypeIcon(message.type)}</span>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{message.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getMessageTypeColor(message.type)}>
                                {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
                              </Badge>
                              {getPriorityBadge(message.priority)}
                              <Badge variant="outline" className="text-xs">
                                {getMessageStatusIcon(message.status)} {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                              </Badge>
                              {message.isPinned && (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                  📌 Épinglé
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-4 leading-relaxed">{message.content}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>👤 {message.senderName}</span>
                          <span>📅 {formatTime(message.createdAt)}</span>
                          <span>👥 {message.recipients.length} destinataire(s)</span>
                          {message.tags.length > 0 && (
                            <span>🏷️ {message.tags.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedMessage(message)}
                          className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setComposeForm({
                              title: message.title,
                              content: message.content,
                              type: message.type,
                              priority: message.priority,
                              recipients: message.recipients,
                              scheduledFor: '',
                              expiresAt: '',
                              isPinned: message.isPinned,
                              requiresConfirmation: message.requiresConfirmation,
                              tags: message.tags,
                              attachments: message.attachments || []
                            })
                            setShowComposeMessageModal(true)
                          }}
                          className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Dupliquer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Onglet Modération */}
        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Modération des Messages
              </CardTitle>
              <CardDescription>
                Gestion des messages signalés et modération en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chatMessages.filter(msg => msg.isFlagged).map((message) => (
                  <Card key={message.id} className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{message.senderName}</span>
                            <Badge variant="destructive">Signalé</Badge>
                            <span className="text-sm text-gray-500">{formatTime(message.timestamp)}</span>
                          </div>
                          <p className="text-gray-800 mb-2">{message.content}</p>
                          <div className="text-sm text-red-600">
                            <strong>Raison:</strong> {message.flagReason}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewFlaggedMessage(message)}
                            className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors duration-200"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Supervision */}
        <TabsContent value="supervision" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Gestion de la Supervision
              </CardTitle>
              <CardDescription>
                Configuration et gestion de la supervision des chats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-medium">Configuration de la Supervision</h4>
                <p className="text-sm text-gray-600">
                  Définissez les niveaux d'escalade et les actions de supervision pour les chats.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium mb-2">Niveaux d'Escalade</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                        <span className="text-sm">Niveau Bas</span>
                        <Badge variant="outline">Normal</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                        <span className="text-sm">Niveau Moyen</span>
                        <Badge variant="outline">Escaladé</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                        <span className="text-sm">Niveau Haut</span>
                        <Badge variant="outline">Critique</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium mb-2">Actions de Supervision</h5>
                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full justify-start border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors duration-200"
                        onClick={() => handleSupervisionAction('monitor')}
                      >
                        <Shield className="h-4 w-4 mr-2" /> Surveiller
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full justify-start border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors duration-200"
                        onClick={() => handleSupervisionAction('escalate')}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" /> Escalader
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full justify-start border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors duration-200"
                        onClick={() => handleSupervisionAction('block')}
                      >
                        <XCircle className="h-4 w-4 mr-2" /> Bloquer
                      </Button>
                    </div>
                  </div>
                </div>

                <h4 className="font-medium mt-6">Historique des Actions de Supervision</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {supervisorActions.slice(0, 5).map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <div>
                        <span className="font-medium">{action.action}</span>
                        <span className="text-gray-600 ml-2">{action.details}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={action.result === 'success' ? 'default' : 'destructive'}>
                          {action.result}
                        </Badge>
                        <span className="text-xs text-gray-500">{formatTime(action.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                  {supervisorActions.length === 0 && (
                    <p className="text-gray-500 text-sm">Aucune action récente</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Synchronisation */}
        <TabsContent value="synchronisation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronisation & Intégration</CardTitle>
              <CardDescription>
                Configuration de la synchronisation avec tous les chats du site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Statut de synchronisation en temps réel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium mb-2">Statut de Synchronisation</h4>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${syncStatus.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm ${syncStatus.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {syncStatus.isConnected ? 'Connecté' : 'Déconnecté'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>Dernière sync: {formatTime(syncStatus.lastSync)}</div>
                    <div>Connexions actives: {syncStatus.activeConnections}</div>
                    <div>Messages en attente: {syncStatus.pendingMessages}</div>
                    <div>Erreurs: {syncStatus.syncErrors}</div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Progression</span>
                      <span>{syncStatus.syncProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${syncStatus.syncProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-3 w-full"
                    onClick={handleSyncChats}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Synchroniser Maintenant
                  </Button>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium mb-2">Sources de Chats</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm">Chats Globaux</span>
                      <Badge variant="outline">{chatStats.globalChats}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm">Chats Produits</span>
                      <Badge variant="outline">{chatStats.productChats}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                      <span className="text-sm">Chats Vendeurs</span>
                      <Badge variant="outline">{chatStats.vendorChats}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <span className="text-sm">Support</span>
                      <Badge variant="outline">{chatStats.supportChats}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration de la synchronisation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium mb-2">Synchronisation Temps Réel</h4>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                  <p className="text-sm text-gray-600">Tous les chats sont synchronisés en temps réel</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Fréquence: 5 secondes<br/>
                    Connexions: {syncStatus.activeConnections}
                  </div>
                  <Button size="sm" variant="outline" className="mt-2" onClick={handleSyncConfiguration}>Configurer</Button>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium mb-2">Notifications Push</h4>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-600">Actif</span>
                  </div>
                  <p className="text-sm text-gray-600">Notifications instantanées pour nouveaux messages</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Nouveaux chats: {chatStats.activeConversations}<br/>
                    Messages urgents: {chatStats.escalatedChats}
                  </div>
                  <Button size="sm" variant="outline" className="mt-2" onClick={handleNotificationsManagement}>Gérer</Button>
                </div>
              </div>

              {/* Actions de supervision récentes */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium mb-3">Actions de Supervision Récentes</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {supervisorActions.slice(0, 5).map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <div>
                        <span className="font-medium">{action.action}</span>
                        <span className="text-gray-600 ml-2">{action.details}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={action.result === 'success' ? 'default' : 'destructive'}>
                          {action.result}
                        </Badge>
                        <span className="text-xs text-gray-500">{formatTime(action.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                  {supervisorActions.length === 0 && (
                    <p className="text-gray-500 text-sm">Aucune action récente</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Fonctionnalités Avancées */}
        <TabsContent value="avancees" className="space-y-4">
          {/* Outils de Communication Avancés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Outils de Communication Avancés
              </CardTitle>
              <CardDescription>
                Emojis, réactions, pièces jointes et messages vocaux
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Emojis et Réactions */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Emojis & Réactions</h4>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {['😊', '👍', '❤️', '🎉', '🔥', '💯', '👏', '🙏', '🤔', '😅', '😢', '😡'].map((emoji) => (
                        <Button 
                          key={emoji} 
                          size="sm" 
                          variant="outline" 
                          className="text-lg hover:scale-110 transition-transform"
                          onClick={() => handleEmojiSelection(emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">
                      Cliquez sur un emoji pour l'ajouter à votre message ou réagir à un message existant
                    </div>
                  </div>
                </div>

                {/* Pièces Jointes et Médias */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Pièces Jointes & Médias</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="flex items-center gap-2" onClick={() => handleFileUpload('file')}>
                        <Paperclip className="h-4 w-4" />
                        Fichier
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2" onClick={() => handleFileUpload('audio')}>
                        <Volume2 className="h-4 w-4" />
                        Audio
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2" onClick={() => handleFileUpload('voice')}>
                        <Mic className="h-4 w-4" />
                        Enregistrer
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2" onClick={() => handleFileUpload('gif')}>
                        <Smile className="h-4 w-4" />
                        GIF
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      Support pour images, documents, audio et vidéo jusqu'à 10MB
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Réponses Rapides et Modèles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="h-5 w-5" />
                Réponses Rapides & Modèles
              </CardTitle>
              <CardDescription>
                Réponses prédéfinies et modèles de messages pour une communication efficace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Réponses Rapides */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Réponses Rapides</h4>
                  <div className="space-y-2">
                    {[
                      'Merci pour votre message, je vais vous aider',
                      'Je comprends votre préoccupation',
                      'Laissez-moi vérifier cela pour vous',
                      'Pouvez-vous me donner plus de détails ?',
                      'Je vais transférer votre demande à l\'équipe appropriée',
                      'Votre demande est en cours de traitement'
                    ].map((response, index) => (
                      <Button 
                        key={index}
                        size="sm" 
                        variant="outline" 
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleQuickResponseSelection(response)}
                      >
                        {response}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Modèles de Messages */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Modèles de Messages</h4>
                  <div className="space-y-2">
                    {[
                      'Accueil et Bienvenue',
                      'Demande d\'Informations',
                      'Résolution de Problème',
                      'Confirmation de Commande',
                      'Suivi de Livraison',
                      'Réclamation Client'
                    ].map((template, index) => (
                      <Button 
                        key={index}
                        size="sm" 
                        variant="outline" 
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleMessageTemplateSelection(template)}
                      >
                        {template}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outils de Modération Avancés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Outils de Modération Avancés
              </CardTitle>
              <CardDescription>
                Filtres automatiques, détection de spam et outils de modération intelligents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Filtres Automatiques */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Filtres Automatiques</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm">Détection de Spam</span>
                      <Badge variant="default">Actif</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm">Contenu Inapproprié</span>
                      <Badge variant="default">Actif</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm">Langage Abusif</span>
                      <Badge variant="default">Actif</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm">Publicité Non Autorisée</span>
                      <Badge variant="default">Actif</Badge>
                    </div>
                  </div>
                </div>

                {/* Actions de Modération */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Actions de Modération</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleModerationAction('Avertissement Automatique')}>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Avertissement Automatique
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleModerationAction('Suspension Temporaire')}>
                      <Clock className="h-4 w-4 mr-2" />
                      Suspension Temporaire
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleModerationAction('Bannissement Permanent')}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Bannissement Permanent
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleModerationAction('Modération Manuelle')}>
                      <Eye className="h-4 w-4 mr-2" />
                      Modération Manuelle
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intelligence Artificielle et Automatisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-4" />
                Intelligence Artificielle & Automatisation
              </CardTitle>
              <CardDescription>
                Chatbots intelligents, analyse de sentiment et automatisation des réponses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chatbots Intelligents */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Chatbots Intelligents</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm">Bot de Support</span>
                      <Badge variant="default">Actif</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm">Bot de Ventes</span>
                      <Badge variant="default">Actif</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm">Bot de FAQ</span>
                      <Badge variant="default">Actif</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Les chatbots gèrent automatiquement les questions fréquentes et transfèrent les cas complexes
                    </div>
                  </div>
                </div>

                {/* Analyse de Sentiment */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Analyse de Sentiment</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm">Détection d'Émotion</span>
                      <Badge variant="default">Actif</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm">Priorisation Auto</span>
                      <Badge variant="default">Actif</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-sm">Alerte Urgence</span>
                      <Badge variant="default">Actif</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Analyse automatique du ton et de l'émotion pour prioriser les réponses
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personnalisation et Thèmes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-4" />
                Personnalisation & Thèmes
              </CardTitle>
              <CardDescription>
                Personnalisation de l'interface, thèmes et préférences utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Thèmes d'Interface */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Thèmes d'Interface</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleThemeSelection('blue')}>
                      <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                      Thème Bleu (Défaut)
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleThemeSelection('green')}>
                      <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                      Thème Vert
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleThemeSelection('purple')}>
                      <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
                      Thème Violet
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleThemeSelection('dark')}>
                      <div className="w-4 h-4 bg-gray-800 rounded mr-2"></div>
                      Mode Sombre
                    </Button>
                  </div>
                </div>

                {/* Préférences Utilisateur */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Préférences Utilisateur</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Notifications Push</span>
                      <Badge variant="default">Activées</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Son de Notification</span>
                      <Badge variant="default">Activé</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mode Hors Ligne</span>
                      <Badge variant="secondary">Désactivé</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sauvegarde Auto</span>
                      <Badge variant="default">Activée</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outils de Productivité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-4" />
                Outils de Productivité
              </CardTitle>
              <CardDescription>
                Raccourcis clavier, macros et outils pour améliorer l'efficacité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Raccourcis Clavier */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Raccourcis Clavier</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Nouveau Chat</span>
                      <kbd className="px-2 py-1 text-xs bg-gray-200 rounded">Ctrl + N</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Recherche</span>
                      <kbd className="px-2 py-1 text-xs bg-gray-200 rounded">Ctrl + F</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Envoyer Message</span>
                      <kbd className="px-2 py-1 text-xs bg-gray-200 rounded">Ctrl + Enter</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">Fermer Chat</span>
                      <kbd className="px-2 py-1 text-xs bg-gray-200 rounded">Esc</kbd>
                    </div>
                  </div>
                </div>

                {/* Macros et Automatisation */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Macros & Automatisation</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleProductivityTool('Réponse Automatique')}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Réponse Automatique
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleProductivityTool('Planification de Messages')}>
                      <Clock className="h-4 w-4 mr-2" />
                      Planification de Messages
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleProductivityTool('Transfert Automatique')}>
                      <Users className="h-4 w-4 mr-2" />
                      Transfert Automatique
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleProductivityTool('Sauvegarde de Favoris')}>
                      <Star className="h-4 w-4 mr-2" />
                      Sauvegarde de Favoris
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intégrations et API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-4" />
                Intégrations & API
              </CardTitle>
              <CardDescription>
                Connexions avec d'autres services et outils de communication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Services Intégrés */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Services Intégrés</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm">Slack</span>
                      <Badge variant="default">Connecté</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm">Discord</span>
                      <Badge variant="default">Connecté</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm">Teams</span>
                      <Badge variant="secondary">Déconnecté</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm">WhatsApp Business</span>
                      <Badge variant="secondary">Déconnecté</Badge>
                    </div>
                  </div>
                </div>

                {/* API et Webhooks */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">API & Webhooks</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleIntegration('Documentation API')}>
                      <Download className="h-4 w-4 mr-2" />
                      Documentation API
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleIntegration('Configuration Webhooks')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configuration Webhooks
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleIntegration('Gestion des Clés API')}>
                      <Key className="h-4 w-4 mr-2" />
                      Gestion des Clés API
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleIntegration('Statistiques API')}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Statistiques API
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export et Sauvegarde */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-4" />
                Export & Sauvegarde
              </CardTitle>
              <CardDescription>
                Sauvegarde des conversations, export des données et gestion des archives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Formats d'Export */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Formats d'Export</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleExportFormat('PDF')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleExportFormat('Excel')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleExportFormat('CSV')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleExportFormat('JSON')}>
                      <Archive className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                  </div>
                </div>

                {/* Sauvegarde et Restauration */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Sauvegarde & Restauration</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleProductivityTool('Sauvegarde Complète')}>
                      <Download className="h-4 w-4 mr-2" />
                      Sauvegarde Complète
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleProductivityTool('Restaurer Sauvegarde')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Restaurer Sauvegarde
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => handleProductivityTool('Sauvegarde Automatique')}>
                      <Clock className="h-4 w-4 mr-2" />
                      Sauvegarde Automatique
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Nettoyer Archives
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Statistiques */}
        <TabsContent value="statistiques" className="space-y-4">
          <Card>
            <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-[#535455]">
              <BarChart3 className="h-5 w-5 text-[#ff6600]" />
              Statistiques de Messagerie
            </CardTitle>
            <CardDescription className="text-[#535455]/70">
              Analyse des performances et métriques de communication
            </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Statistiques principales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 border border-[#ff6600]/20 rounded-lg bg-gradient-to-b from-[#ff6600]/5 to-transparent hover:shadow-md transition-all duration-200">
                  <p className="text-2xl font-bold text-[#ff6600]">{chatStats.satisfactionRate}%</p>
                  <p className="text-sm text-[#535455]">Taux de satisfaction</p>
                </div>
                <div className="text-center p-4 border border-[#ff6600]/20 rounded-lg bg-gradient-to-b from-[#ff6600]/5 to-transparent hover:shadow-md transition-all duration-200">
                  <p className="text-2xl font-bold text-[#ff6600]">{chatStats.averageResponseTime}min</p>
                  <p className="text-sm text-[#535455]">Temps de réponse moyen</p>
                </div>
                <div className="text-center p-4 border border-[#ff6600]/20 rounded-lg bg-gradient-to-b from-[#ff6600]/5 to-transparent hover:shadow-md transition-all duration-200">
                  <p className="text-2xl font-bold text-[#ff6600]">{chatStats.messagesToday}</p>
                  <p className="text-sm text-[#535455]">Messages aujourd'hui</p>
                </div>
                <div className="text-center p-4 border border-[#ff6600]/20 rounded-lg bg-gradient-to-b from-[#ff6600]/5 to-transparent hover:shadow-md transition-all duration-200">
                  <p className="text-2xl font-bold text-[#ff6600]">{chatStats.activeConversations}</p>
                  <p className="text-sm text-[#535455]">Conversations actives</p>
                </div>
              </div>

              {/* Nouvelles statistiques de supervision */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-lg text-[#535455]">Sources de Chats</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#ff6600]/10 rounded-lg border border-[#ff6600]/20 hover:bg-[#ff6600]/15 transition-colors duration-200">
                      <span className="text-sm text-[#535455]">Chats Globaux</span>
                      <span className="font-bold text-[#ff6600]">{chatStats.globalChats}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#ff6600]/10 rounded-lg border border-[#ff6600]/20 hover:bg-[#ff6600]/15 transition-colors duration-200">
                      <span className="text-sm text-[#535455]">Chats Produits</span>
                      <span className="font-bold text-[#ff6600]">{chatStats.productChats}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#ff6600]/10 rounded-lg border border-[#ff6600]/20 hover:bg-[#ff6600]/15 transition-colors duration-200">
                      <span className="text-sm text-[#535455]">Chats Vendeurs</span>
                      <span className="font-bold text-[#ff6600]">{chatStats.vendorChats}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#ff6600]/10 rounded-lg border border-[#ff6600]/20 hover:bg-[#ff6600]/15 transition-colors duration-200">
                      <span className="text-sm text-[#535455]">Support</span>
                      <span className="font-bold text-[#ff6600]">{chatStats.supportChats}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-lg text-[#535455]">Supervision & Modération</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#ff6600]/10 rounded-lg border border-[#ff6600]/20 hover:bg-[#ff6600]/15 transition-colors duration-200">
                      <span className="text-sm text-[#535455]">Chats Surveillés</span>
                      <span className="font-bold text-[#ff6600]">{chatStats.monitoredChats}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#ff6600]/10 rounded-lg border border-[#ff6600]/20 hover:bg-[#ff6600]/15 transition-colors duration-200">
                      <span className="text-sm text-[#535455]">Chats Escaladés</span>
                      <span className="font-bold text-[#ff6600]">{chatStats.escalatedChats}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#535455]/10 rounded-lg border border-[#535455]/20 hover:bg-[#535455]/15 transition-colors duration-200">
                      <span className="text-sm text-[#535455]">Messages Signalés</span>
                      <span className="font-bold text-[#535455]">{chatStats.flaggedMessages}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#ff6600]/10 rounded-lg border border-[#ff6600]/20 hover:bg-[#ff6600]/15 transition-colors duration-200">
                      <span className="text-sm text-[#535455]">Connexions Temps Réel</span>
                      <span className="font-bold text-[#ff6600]">{syncStatus.activeConnections}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statut de synchronisation */}
              <div className="mt-6 p-4 bg-gradient-to-r from-[#ff6600]/5 to-[#535455]/5 rounded-lg border border-[#ff6600]/20">
                <h4 className="font-medium mb-3 text-[#535455]">Statut de Synchronisation</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${syncStatus.isConnected ? 'bg-[#ff6600]' : 'bg-red-500'}`}></div>
                    <p className="text-sm text-[#535455]">Connexion</p>
                    <p className="font-medium text-[#535455]">{syncStatus.isConnected ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#ff6600] mb-1">{syncStatus.syncProgress}%</p>
                    <p className="text-sm text-[#535455]">Synchronisation</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#ff6600] mb-1">{syncStatus.pendingMessages}</p>
                    <p className="text-sm text-[#535455]">En Attente</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      )}

      {/* Navigation par onglets - Mode Messagerie Interne */}
      {mainMode === 'messaging' && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="composer" 
              className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 ease-in-out hover:bg-[#ff6600]/10 data-[state=active]:hover:bg-[#ff6600] rounded-md"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Composer
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 ease-in-out hover:bg-[#ff6600]/10 data-[state=active]:hover:bg-[#ff6600] rounded-md"
            >
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger 
              value="groupes" 
              className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 ease-in-out hover:bg-[#ff6600]/10 data-[state=active]:hover:bg-[#ff6600] rounded-md"
            >
              <Users className="h-4 w-4 mr-2" />
              Groupes
            </TabsTrigger>
            <TabsTrigger 
              value="historique" 
              className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 ease-in-out hover:bg-[#ff6600]/10 data-[state=active]:hover:bg-[#ff6600] rounded-md"
            >
              <Clock className="h-4 w-4 mr-2" />
              Historique
            </TabsTrigger>
            <TabsTrigger 
              value="statistiques_messaging" 
              className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 ease-in-out hover:bg-[#ff6600]/10 data-[state=active]:hover:bg-[#ff6600] rounded-md"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistiques
            </TabsTrigger>
          </TabsList>

          {/* Onglet Composer */}
          <TabsContent value="composer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Nouveau Message Interne
                </CardTitle>
                <CardDescription>
                  Composez et envoyez un message interne aux utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Titre du message</Label>
                    <Input
                      id="title"
                      placeholder="Entrez le titre du message..."
                      value={composeForm.title}
                      onChange={(e) => setComposeForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type de message</Label>
                    <Select value={composeForm.type} onValueChange={(value) => setComposeForm(prev => ({ ...prev, type: value as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="announcement">📢 Annonce</SelectItem>
                        <SelectItem value="change">🔄 Changement</SelectItem>
                        <SelectItem value="alert">⚠️ Alerte</SelectItem>
                        <SelectItem value="information">ℹ️ Information</SelectItem>
                        <SelectItem value="congratulation">🎉 Félicitation</SelectItem>
                        <SelectItem value="reminder">🔔 Rappel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="content">Contenu du message</Label>
                  <Textarea
                    id="content"
                    placeholder="Tapez votre message..."
                    value={composeForm.content}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                  />
                </div>

                {/* Section Sélection des Destinataires */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Destinataires</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={isAllUsersSelected() ? "default" : "outline"}
                        onClick={handleSelectAllUsers}
                        className={`text-xs ${
                          isAllUsersSelected() 
                            ? 'bg-[#ff6600] text-white hover:bg-[#ff6600]/90' 
                            : 'border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white'
                        }`}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Tous les utilisateurs {isAllUsersSelected() && '(Sélectionné)'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleClearAllRecipients}
                        disabled={selectedRecipients.length === 0}
                        className={`text-xs ${
                          selectedRecipients.length === 0
                            ? 'border-gray-300 text-gray-300 cursor-not-allowed'
                            : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                        }`}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Tout effacer
                      </Button>
                    </div>
                  </div>

                  {/* Sélection par rôle */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Sélection rapide par rôle :</Label>
                    <div className="flex flex-wrap gap-2">
                      {(['buyer', 'vendor', 'admin'] as const).map((role) => {
                        const isSelected = selectedRecipients.some(r => r.id === `role_${role}`)
                        const roleUsers = availableUsers.filter(user => user.role === role && user.status === 'active')
                        
                        return (
                          <Button
                            key={role}
                            type="button"
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => isSelected ? handleRemoveRoleRecipients(role) : handleAddRoleRecipients(role)}
                            className={`text-xs ${isSelected ? 'bg-[#ff6600] text-white' : 'border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white'}`}
                          >
                            {role === 'buyer' ? '👥' : role === 'vendor' ? '🏪' : '👨‍💼'} 
                            {getRoleDisplayName(role)} ({roleUsers.length})
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Destinataires sélectionnés */}
                  {selectedRecipients.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Destinataires sélectionnés ({selectedRecipients.length}) :
                      </Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {selectedRecipients.map((recipient) => (
                          <div key={recipient.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{recipient.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {recipient.type === 'role' ? 'Rôle' : getRoleDisplayName(recipient.role || '')}
                              </Badge>
                              {recipient.type === 'individual' && (
                                <span className="text-xs text-gray-500">{recipient.email}</span>
                              )}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveRecipient(recipient.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sélecteur de destinataires individuels */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">Ajouter des destinataires individuels :</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowRecipientSelector(!showRecipientSelector)}
                        className="text-xs border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                      >
                        {showRecipientSelector ? 'Masquer' : 'Afficher'} le sélecteur
                      </Button>
                    </div>

                    {showRecipientSelector && (
                      <Card className="border border-gray-200">
                        <CardContent className="p-4 space-y-3">
                          {/* Filtres de recherche */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="recipientSearch" className="text-xs">Rechercher</Label>
                              <Input
                                id="recipientSearch"
                                placeholder="Nom, email ou téléphone..."
                                value={recipientSearchTerm}
                                onChange={(e) => setRecipientSearchTerm(e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="recipientRoleFilter" className="text-xs">Filtrer par rôle</Label>
                              <Select value={recipientRoleFilter} onValueChange={setRecipientRoleFilter}>
                                <SelectTrigger className="text-sm">
                                  <SelectValue placeholder="Tous les rôles" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Tous les rôles</SelectItem>
                                  <SelectItem value="buyer">Acheteurs</SelectItem>
                                  <SelectItem value="vendor">Vendeurs</SelectItem>
                                  <SelectItem value="admin">Admins</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Liste des utilisateurs disponibles */}
                          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                            {getFilteredUsers().map((user) => {
                              const isSelected = selectedRecipients.some(r => r.id === user.id)
                              
                              return (
                                <div
                                  key={user.id}
                                  className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer ${
                                    isSelected ? 'bg-[#ff6600]/10 border-l-4 border-l-[#ff6600]' : ''
                                  }`}
                                  onClick={() => handleAddRecipient(user)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-[#ff6600] to-[#ff6600]/80 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                      {user.avatar}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{user.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {getRoleDisplayName(user.role)}
                                        </Badge>
                                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                          {getStatusDisplayName(user.status)}
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-gray-500 space-x-3">
                                        <span>{user.email}</span>
                                        <span>{user.phone}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isSelected ? (
                                      <CheckCircle className="h-4 w-4 text-[#ff6600]" />
                                    ) : (
                                      <Plus className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="priority">Priorité</Label>
                    <Select value={composeForm.priority} onValueChange={(value) => setComposeForm(prev => ({ ...prev, priority: value as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">⚪ Faible</SelectItem>
                        <SelectItem value="medium">🟡 Moyenne</SelectItem>
                        <SelectItem value="high">🟠 Haute</SelectItem>
                        <SelectItem value="urgent">🔴 Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="scheduledFor">Programmer pour</Label>
                    <Input
                      id="scheduledFor"
                      type="datetime-local"
                      value={composeForm.scheduledFor}
                      onChange={(e) => setComposeForm(prev => ({ ...prev, scheduledFor: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiresAt">Expire le</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={composeForm.expiresAt}
                      onChange={(e) => setComposeForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPinned"
                      checked={composeForm.isPinned}
                      onChange={(e) => setComposeForm(prev => ({ ...prev, isPinned: e.target.checked }))}
                    />
                    <Label htmlFor="isPinned">Épingler le message</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requiresConfirmation"
                      checked={composeForm.requiresConfirmation}
                      onChange={(e) => setComposeForm(prev => ({ ...prev, requiresConfirmation: e.target.checked }))}
                    />
                    <Label htmlFor="requiresConfirmation">Confirmation requise</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setComposeForm({
                    title: '',
                    content: '',
                    type: 'announcement',
                    priority: 'medium',
                    recipients: [],
                    scheduledFor: '',
                    expiresAt: '',
                    isPinned: false,
                    requiresConfirmation: false,
                    tags: [],
                    attachments: []
                  })}>
                    Réinitialiser
                  </Button>
                  <Button onClick={handleSendInternalMessage} className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white">
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer le Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Templates */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Gestion des Templates
                    </CardTitle>
                    <CardDescription>
                      Créez et gérez des modèles de messages réutilisables
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowCreateTemplateModal(true)}
                    className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messageTemplates.map((template) => (
                    <Card key={template.id} className="border-l-4 border-l-[#ff6600]">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            <p className="text-gray-600 mt-1">{template.title}</p>
                            <p className="text-gray-700 mt-2">{template.content}</p>
                            <div className="flex items-center gap-2 mt-3">
                              <Badge className={getMessageTypeColor(template.type)}>
                                {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                              </Badge>
                              <Badge variant="outline">
                                {getCategoryDisplayName(template.category)}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                Utilisé {template.usageCount} fois
                              </span>
                              <span className="text-sm text-gray-500">
                                Créé le {new Date(template.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMessageTemplateSelect(template)}
                              className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Utiliser
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTemplate(template)}
                              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDuplicateTemplate(template)}
                              className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Dupliquer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Groupes */}
          <TabsContent value="groupes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestion des Groupes
                </CardTitle>
                <CardDescription>
                  Créez et gérez des groupes de destinataires
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Bouton pour créer un nouveau groupe */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setShowCreateGroupModal(true)}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau Groupe
                    </Button>
                  </div>

                  {/* Liste des groupes existants */}
                  {messageGroups.map((group) => (
                    <Card key={group.id} className="border-l-4 border-l-[#535455] hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{group.name}</h3>
                            <p className="text-gray-600 mt-1">{group.description}</p>
                            <div className="flex items-center gap-2 mt-3">
                              <Badge variant="outline">
                                {group.memberCount} membres
                              </Badge>
                              <Badge variant={group.isActive ? "default" : "secondary"}>
                                {group.isActive ? "Actif" : "Inactif"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Créé le {new Date(group.createdAt).toLocaleDateString('fr-FR')}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditGroup(group)}
                              className="text-[#535455] hover:bg-[#535455] hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteGroup(group.id)}
                              className="text-red-600 hover:bg-red-600 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Message si aucun groupe */}
                  {messageGroups.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun groupe créé pour le moment</p>
                      <p className="text-sm">Créez votre premier groupe pour organiser vos destinataires</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Historique */}
          <TabsContent value="historique" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Historique des Messages
                </CardTitle>
                <CardDescription>
                  Consultez l'historique de tous les messages envoyés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {internalMessages.map((message) => (
                    <Card key={message.id} className="border-l-4 border-l-[#ff6600] hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">{getMessageTypeIcon(message.type)}</span>
                              <div>
                                <h3 className="font-semibold text-lg">{message.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getMessageTypeColor(message.type)}>
                                    {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
                                  </Badge>
                                  {getPriorityBadge(message.priority)}
                                  <Badge variant="outline" className="text-xs">
                                    {getMessageStatusIcon(message.status)} {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <p className="text-gray-700 mb-3">{message.content}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>👤 {message.senderName}</span>
                              <span>📅 {formatTime(message.createdAt)}</span>
                              <span>👥 {message.recipients.length} destinataire(s)</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Statistiques Messaging */}
          <TabsContent value="statistiques_messaging" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Statistiques de la Messagerie Interne
                </CardTitle>
                <CardDescription>
                  Analysez les performances de vos messages internes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-[#ff6600]/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-[#ff6600] mb-2">
                        {internalMessages.length}
                      </div>
                      <p className="text-gray-600">Messages envoyés</p>
                    </CardContent>
                  </Card>
                  <Card className="border-[#535455]/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-[#535455] mb-2">
                        {messageTemplates.length}
                      </div>
                      <p className="text-gray-600">Templates disponibles</p>
                    </CardContent>
                  </Card>
                  <Card className="border-[#ff6600]/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-[#ff6600] mb-2">
                        {messageGroups.length}
                      </div>
                      <p className="text-gray-600">Groupes actifs</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Modal de Création/Édition de Template */}
      <Dialog open={showCreateTemplateModal} onOpenChange={setShowCreateTemplateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden border-[#ff6600]/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#535455]">
              <FileText className="h-5 w-5 text-[#ff6600]" />
              {templateForm.name ? 'Modifier le Template' : 'Nouveau Template'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">Nom du template</Label>
                <Input
                  id="templateName"
                  placeholder="Entrez le nom du template..."
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="border-[#535455]/20 focus:border-[#ff6600] focus:ring-[#ff6600]/20"
                />
              </div>
              <div>
                <Label htmlFor="templateType">Type de message</Label>
                <Select value={templateForm.type} onValueChange={(value) => setTemplateForm(prev => ({ ...prev, type: value as any }))}>
                  <SelectTrigger className="border-[#535455]/20 focus:border-[#ff6600] focus:ring-[#ff6600]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">📢 Annonce</SelectItem>
                    <SelectItem value="change">🔄 Changement</SelectItem>
                    <SelectItem value="alert">⚠️ Alerte</SelectItem>
                    <SelectItem value="information">ℹ️ Information</SelectItem>
                    <SelectItem value="congratulation">🎉 Félicitation</SelectItem>
                    <SelectItem value="reminder">🔔 Rappel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="templateTitle">Titre du message</Label>
              <Input
                id="templateTitle"
                placeholder="Entrez le titre du message..."
                value={templateForm.title}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                className="border-[#535455]/20 focus:border-[#ff6600] focus:ring-[#ff6600]/20"
              />
            </div>

            <div>
              <Label htmlFor="templateCategory">Catégorie</Label>
              <Select value={templateForm.category} onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category: value as any }))}>
                <SelectTrigger className="border-[#535455]/20 focus:border-[#ff6600] focus:ring-[#ff6600]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Général</SelectItem>
                  <SelectItem value="technical">Technique</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="security">Sécurité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="templateContent">Contenu du message</Label>
              <Textarea
                id="templateContent"
                placeholder="Tapez le contenu du template..."
                value={templateForm.content}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                className="border-[#535455]/20 focus:border-[#ff6600] focus:ring-[#ff6600]/20 min-h-[120px]"
                rows={6}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateTemplateModal(false)
                  setTemplateForm({
                    name: '',
                    title: '',
                    content: '',
                    type: 'announcement',
                    category: 'general'
                  })
                }}
                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateTemplate}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                {templateForm.name ? 'Modifier' : 'Créer'} le Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Création/Édition de Groupe */}
      <Dialog open={showCreateGroupModal} onOpenChange={setShowCreateGroupModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden border-[#ff6600]/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#535455]">
              <Users className="h-5 w-5 text-[#ff6600]" />
              {groupForm.name ? 'Modifier le Groupe' : 'Nouveau Groupe'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Informations du groupe */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="groupName">Nom du groupe *</Label>
                <Input
                  id="groupName"
                  placeholder="Entrez le nom du groupe..."
                  value={groupForm.name}
                  onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                  className="border-[#535455]/20 focus:border-[#ff6600] focus:ring-[#ff6600]/20"
                />
              </div>
              <div>
                <Label htmlFor="groupCategory">Catégorie</Label>
                <Select value={groupForm.category} onValueChange={(value) => setGroupForm(prev => ({ ...prev, category: value as any }))}>
                  <SelectTrigger className="border-[#535455]/20 focus:border-[#ff6600] focus:ring-[#ff6600]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="technical">Technique</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="security">Sécurité</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="groupDescription">Description</Label>
              <Textarea
                id="groupDescription"
                placeholder="Décrivez le but de ce groupe..."
                value={groupForm.description}
                onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                className="border-[#535455]/20 focus:border-[#ff6600] focus:ring-[#ff6600]/20"
                rows={3}
              />
            </div>

            {/* Sélection des membres */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Membres du groupe</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddRoleToGroup('buyer')}
                    className="text-[#535455] hover:bg-[#535455] hover:text-white"
                  >
                    + Tous les Acheteurs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddRoleToGroup('vendor')}
                    className="text-[#535455] hover:bg-[#535455] hover:text-white"
                  >
                    + Tous les Vendeurs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddRoleToGroup('admin')}
                    className="text-[#535455] hover:bg-[#535455] hover:text-white"
                  >
                    + Tous les Admins
                  </Button>
                </div>
              </div>

              {/* Membres sélectionnés */}
              {selectedGroupMembers.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-sm font-medium text-gray-700 mb-2">
                    Membres sélectionnés ({selectedGroupMembers.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedGroupMembers.map(memberId => {
                      const user = availableUsers.find(u => u.id === memberId)
                      return user ? (
                        <Badge key={memberId} variant="secondary" className="flex items-center gap-1">
                          {user.name}
                          <button
                            onClick={() => handleRemoveGroupMember(memberId)}
                            className="ml-1 hover:text-red-600"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {/* Recherche et sélection de nouveaux membres */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Rechercher par nom, email ou téléphone..."
                    value={groupSearchTerm}
                    onChange={(e) => setGroupSearchTerm(e.target.value)}
                    className="flex-1 border-[#535455]/20 focus:border-[#ff6600] focus:ring-[#ff6600]/20"
                  />
                  <Select value={groupRoleFilter} onValueChange={setGroupRoleFilter}>
                    <SelectTrigger className="w-40 border-[#535455]/20 focus:border-[#ff6600] focus:ring-[#ff6600]/20">
                      <SelectValue placeholder="Rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les rôles</SelectItem>
                      <SelectItem value="buyer">Acheteurs</SelectItem>
                      <SelectItem value="vendor">Vendeurs</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Liste des utilisateurs disponibles */}
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {getFilteredGroupUsers().map(user => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-100 ${
                        selectedGroupMembers.includes(user.id) ? 'bg-[#ff6600]/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#535455] rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">{user.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {user.role === 'buyer' ? 'Acheteur' : user.role === 'vendor' ? 'Vendeur' : 'Admin'}
                        </Badge>
                        <Button
                          variant={selectedGroupMembers.includes(user.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => selectedGroupMembers.includes(user.id) 
                            ? handleRemoveGroupMember(user.id) 
                            : handleAddGroupMember(user.id)
                          }
                          className={selectedGroupMembers.includes(user.id) 
                            ? "bg-[#ff6600] hover:bg-[#ff6600]/90" 
                            : "border-[#535455]/20 hover:bg-[#535455] hover:text-white"
                          }
                        >
                          {selectedGroupMembers.includes(user.id) ? 'Retirer' : 'Ajouter'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateGroupModal(false)
                setGroupForm({
                  name: '',
                  description: '',
                  category: 'general'
                })
                setSelectedGroupMembers([])
              }}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateGroup}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
              disabled={!groupForm.name.trim() || selectedGroupMembers.length === 0}
            >
              {groupForm.name ? 'Modifier le Groupe' : 'Créer le Groupe'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Chat */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden border-[#ff6600]/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#535455]">
              <MessageCircle className="h-5 w-5 text-[#ff6600]" />
              {selectedChat?.customerName} - {selectedChat?.productName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedChat && (
            <div className="flex flex-col h-[70vh]">
              {/* En-tête du chat */}
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#ff6600]/5 to-[#535455]/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#ff6600] to-[#ff6600]/80 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                    {selectedChat.customerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-[#535455]">{selectedChat.customerName}</h3>
                    <p className="text-sm text-[#535455]/70">{selectedChat.customerEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(selectedChat.priority)}
                  {getStatusBadge(selectedChat.status)}
                  <Select value={selectedChat.status} onValueChange={(value) => handleChatStatusChange(selectedChat.id, value)}>
                    <SelectTrigger className="w-32 border-[#535455] text-[#535455]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="resolved">Résolue</SelectItem>
                      <SelectItem value="archived">Archivée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-[#ff6600]/5">
                {chatMessages
                  .filter(msg => msg.chatId === selectedChat.id)
                  .map((message) => (
                    <div key={message.id} className={`flex ${message.senderType === 'super_admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-lg shadow-sm transition-all duration-200 ${
                        message.senderType === 'super_admin' 
                          ? 'bg-gradient-to-r from-[#ff6600] to-[#ff6600]/90 text-white' 
                          : 'bg-white border border-[#535455]/20 text-[#535455]'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.senderName}</span>
                          <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        {message.isFlagged && (
                          <div className="mt-2 text-xs bg-red-100 text-red-800 p-2 rounded border border-red-200">
                            <strong>Signalé:</strong> {message.flagReason}
                          </div>
                        )}
                        {/* Indicateur de statut du message */}
                        <MessageStatusIndicator 
                          message={message} 
                          isOwnMessage={message.senderType === 'super_admin'} 
                        />
                      </div>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Zone de saisie */}
              <div className="p-4 border-t bg-gradient-to-r from-[#ff6600]/5 to-[#535455]/5">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Tapez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="flex-1 border-[#535455]/20 focus:border-[#ff6600] focus:ring-[#ff6600]/20 transition-colors duration-200"
                    rows={2}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim()}
                    className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal des détails du message signalé */}
      <Dialog open={showMessageDetailsModal} onOpenChange={setShowMessageDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden border-[#ff6600]/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#535455]">
              <AlertTriangle className="h-5 w-5 text-[#ff6600]" />
              Détails du Message Signalé
            </DialogTitle>
          </DialogHeader>
          
          {selectedFlaggedMessage && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Informations du message */}
              <Card className="border-l-4 border-l-red-500">
                <CardHeader>
                  <CardTitle className="text-lg text-[#535455]">Message Original</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#ff6600] to-[#ff6600]/80 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedFlaggedMessage.senderName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-[#535455]">{selectedFlaggedMessage.senderName}</h3>
                        <p className="text-sm text-[#535455]/70">{selectedFlaggedMessage.senderType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#535455]/70">{formatTime(selectedFlaggedMessage.timestamp)}</p>
                      <Badge variant="destructive" className="mt-1">Signalé</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-[#535455] font-medium mb-2">Contenu du Message:</p>
                    <p className="text-[#535455]">{selectedFlaggedMessage.content}</p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-[#535455] font-medium mb-2">Raison du Signalement:</p>
                    <p className="text-[#535455] text-red-600">{selectedFlaggedMessage.flagReason}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Contexte de la conversation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-[#535455]">Contexte de la Conversation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#ff6600]/5 rounded-lg border border-[#ff6600]/20">
                      <span className="text-sm text-[#535455]">ID de la Conversation</span>
                      <span className="font-mono text-sm text-[#535455]">{selectedFlaggedMessage.chatId}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#ff6600]/5 rounded-lg border border-[#ff6600]/20">
                      <span className="text-sm text-[#535455]">Type de Sender</span>
                      <Badge variant="outline" className="text-[#ff6600] border-[#ff6600]">
                        {selectedFlaggedMessage.senderType}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#ff6600]/5 rounded-lg border border-[#ff6600]/20">
                      <span className="text-sm text-[#535455]">Statut du Message</span>
                      <Badge variant="outline" className="text-[#535455] border-[#535455]">
                        {selectedFlaggedMessage.messageStatus}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions de modération */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-[#535455]">Actions de Modération</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-[#535455]">Actions Immédiates</h4>
                      <Button 
                        onClick={() => handleResolveFlaggedMessage(selectedFlaggedMessage.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white transition-colors duration-200"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Résoudre le Signalement
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors duration-200"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Mettre en Quarantaine
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-[#535455]">Actions Avancées</h4>
                      <Button 
                        variant="outline"
                        className="w-full border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors duration-200"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Escalader
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors duration-200"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Bloquer l'Utilisateur
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Historique des actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-[#535455]">Historique des Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {supervisorActions
                      .filter(action => action.chatId === selectedFlaggedMessage.chatId)
                      .slice(0, 5)
                      .map((action) => (
                        <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div>
                            <p className="text-sm font-medium text-[#535455]">{action.action}</p>
                            <p className="text-xs text-[#535455]/70">{action.details}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[#535455]/70">{formatTime(action.timestamp)}</p>
                            <Badge 
                              variant={action.result === 'success' ? 'default' : 'destructive'}
                              className="mt-1"
                            >
                              {action.result}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setShowMessageDetailsModal(false)}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors duration-200"
            >
              Fermer
            </Button>
            <Button 
              onClick={() => selectedFlaggedMessage && handleResolveFlaggedMessage(selectedFlaggedMessage.id)}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white shadow-md transition-all duration-200"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Résoudre et Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'action de supervision */}
      <Dialog open={showSupervisionActionModal} onOpenChange={setShowSupervisionActionModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden border-[#ff6600]/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#535455]">
              {selectedSupervisionAction === 'monitor' && <Shield className="h-5 w-5 text-[#ff6600]" />}
              {selectedSupervisionAction === 'escalate' && <AlertTriangle className="h-5 w-5 text-[#ff6600]" />}
              {selectedSupervisionAction === 'block' && <XCircle className="h-5 w-5 text-red-600" />}
              {selectedSupervisionAction === 'monitor' && 'Surveiller un Chat'}
              {selectedSupervisionAction === 'escalate' && 'Escalader un Chat'}
              {selectedSupervisionAction === 'block' && 'Bloquer un Utilisateur'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            {/* Description de l'action */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {selectedSupervisionAction === 'monitor' && (
                    <>
                      <h4 className="font-medium text-[#535455] text-lg">Surveillance de Chat</h4>
                      <p className="text-[#535455]/70">
                        Mettez un chat sous surveillance pour un suivi renforcé. Tous les messages et actions seront enregistrés et analysés.
                      </p>
                      <div className="p-3 bg-[#ff6600]/10 border border-[#ff6600]/20 rounded-lg">
                        <p className="text-sm text-[#535455]">
                          <strong>Avantages :</strong> Suivi détaillé, alertes en temps réel, historique complet des interactions
                        </p>
                      </div>
                    </>
                  )}
                  
                  {selectedSupervisionAction === 'escalate' && (
                    <>
                      <h4 className="font-medium text-[#535455] text-lg">Escalade de Chat</h4>
                      <p className="text-[#535455]/70">
                        Escaladez un chat vers un niveau de priorité supérieur pour une intervention immédiate de l'équipe de supervision.
                      </p>
                      <div className="p-3 bg-[#ff6600]/10 border border-[#ff6600]/20 rounded-lg">
                        <p className="text-sm text-[#535455]">
                          <strong>Avantages :</strong> Intervention rapide, priorité élevée, notification immédiate des superviseurs
                        </p>
                      </div>
                    </>
                  )}
                  
                  {selectedSupervisionAction === 'block' && (
                    <>
                      <h4 className="font-medium text-[#535455] text-lg">Blocage d'Utilisateur</h4>
                      <p className="text-[#535455]/70">
                        Bloquez un utilisateur pour empêcher toute nouvelle interaction. Cette action est irréversible et nécessite une validation.
                      </p>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-[#535455]">
                          <strong>Attention :</strong> Action irréversible, l'utilisateur ne pourra plus accéder au chat
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sélection du chat */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-[#535455]">Sélectionner le Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-[#535455]/70 mb-4">
                    Choisissez le chat sur lequel appliquer l'action de supervision :
                  </p>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {chatSessions.map((chat) => (
                      <div 
                        key={chat.id} 
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedChatForSupervisionAction?.id === chat.id
                            ? 'border-[#ff6600] bg-[#ff6600]/5'
                            : 'border-gray-200 hover:border-[#ff6600]/30 hover:bg-[#ff6600]/5'
                        }`}
                        onClick={() => setSelectedChatForSupervisionAction(chat)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-[#ff6600] to-[#ff6600]/80 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {chat.customerName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-medium text-[#535455]">{chat.customerName}</h4>
                              <p className="text-sm text-[#535455]/70">{chat.productName || 'Chat général'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {getPriorityBadge(chat.priority)}
                            {getStatusBadge(chat.status)}
                            {chat.isMonitored && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                Surveillé
                              </Badge>
                            )}
                            {chat.escalationLevel !== 'normal' && (
                              <Badge variant="destructive" className="mt-1 text-xs">
                                {chat.escalationLevel === 'escalated' ? 'Escaladé' : 'Critique'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions disponibles */}
            {selectedChatForSupervisionAction && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-[#535455]">Actions Disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-[#535455]">
                        <strong>Chat sélectionné :</strong> {selectedChatForSupervisionAction.customerName}
                      </p>
                      <p className="text-xs text-[#535455]/70 mt-1">
                        Statut: {selectedChatForSupervisionAction.status} | Priorité: {selectedChatForSupervisionAction.priority}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleApplySupervisionAction(selectedChatForSupervisionAction.id, selectedSupervisionAction!)}
                        className="flex-1 bg-[#ff6600] hover:bg-[#ff6600]/90 text-white transition-colors duration-200"
                        disabled={!selectedSupervisionAction}
                      >
                        {selectedSupervisionAction === 'monitor' && <Shield className="h-4 w-4 mr-2" />}
                        {selectedSupervisionAction === 'escalate' && <AlertTriangle className="h-4 w-4 mr-2" />}
                        {selectedSupervisionAction === 'block' && <XCircle className="h-4 w-4 mr-2" />}
                        Appliquer l'Action
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => setShowSupervisionActionModal(false)}
                        className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors duration-200"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Configuration de la Synchronisation */}
      <Dialog open={showSyncConfigModal} onOpenChange={setShowSyncConfigModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl text-[#535455] flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#ff6600]" />
              Configuration de la Synchronisation
            </DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-6">
            {/* Configuration Temps Réel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-[#535455]">Synchronisation Temps Réel</CardTitle>
                <CardDescription>Paramètres de la synchronisation en temps réel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="realTimeEnabled">Activer la synchronisation temps réel</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="realTimeEnabled"
                        checked={syncConfig.realTimeEnabled}
                        onChange={(e) => setSyncConfig(prev => ({ ...prev, realTimeEnabled: e.target.checked }))}
                        className="w-4 h-4 text-[#ff6600] bg-gray-100 border-gray-300 rounded focus:ring-[#ff6600] focus:ring-2"
                      />
                      <span className="text-sm text-[#535455]/70">
                        {syncConfig.realTimeEnabled ? 'Activée' : 'Désactivée'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="syncFrequency">Fréquence de synchronisation (secondes)</Label>
                    <Input
                      id="syncFrequency"
                      type="number"
                      min="1"
                      max="60"
                      value={syncConfig.syncFrequency}
                      onChange={(e) => setSyncConfig(prev => ({ ...prev, syncFrequency: parseInt(e.target.value) || 5 }))}
                      className="border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxConnections">Connexions maximales</Label>
                    <Input
                      id="maxConnections"
                      type="number"
                      min="10"
                      max="1000"
                      value={syncConfig.maxConnections}
                      onChange={(e) => setSyncConfig(prev => ({ ...prev, maxConnections: parseInt(e.target.value) || 100 }))}
                      className="border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logLevel">Niveau de journalisation</Label>
                    <Select value={syncConfig.logLevel} onValueChange={(value: 'debug' | 'info' | 'warn' | 'error') => setSyncConfig(prev => ({ ...prev, logLevel: value }))}>
                      <SelectTrigger className="border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debug">Debug</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warn">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="autoRetry">Tentatives automatiques</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="autoRetry"
                        checked={syncConfig.autoRetry}
                        onChange={(e) => setSyncConfig(prev => ({ ...prev, autoRetry: e.target.checked }))}
                        className="w-4 h-4 text-[#ff6600] bg-gray-100 border-gray-300 rounded focus:ring-[#ff6600] focus:ring-2"
                      />
                      <span className="text-sm text-[#535455]/70">Activer les tentatives automatiques</span>
                    </div>
                  </div>
                  
                  {syncConfig.autoRetry && (
                    <div className="space-y-2">
                      <Label htmlFor="retryAttempts">Nombre de tentatives</Label>
                      <Input
                        id="retryAttempts"
                        type="number"
                        min="1"
                        max="10"
                        value={syncConfig.retryAttempts}
                        onChange={(e) => setSyncConfig(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) || 3 }))}
                        className="border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test de Connexion */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-[#535455]">Test de Connexion</CardTitle>
                <CardDescription>Tester la connectivité et la synchronisation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-[#535455]">
                      <strong>Statut actuel :</strong> {syncStatus.isConnected ? 'Connecté' : 'Déconnecté'}
                    </p>
                    <p className="text-xs text-[#535455]/70 mt-1">
                      Connexions actives: {syncStatus.activeConnections} | Erreurs: {syncStatus.syncErrors}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleTestSyncConnection}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white transition-colors duration-200"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tester la Connexion
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => setShowSyncConfigModal(false)}
                      className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors duration-200"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Boutons d'action */}
          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 pb-2 border-t border-gray-200 bg-white">
            <Button 
              onClick={handleSaveSyncConfig}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white transition-colors duration-200"
            >
              <Settings className="h-4 w-4 mr-2" />
              Sauvegarder la Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Gestion des Notifications */}
      <Dialog open={showNotificationsManageModal} onOpenChange={setShowNotificationsManageModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl text-[#535455] flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#ff6600]" />
              Gestion des Notifications
            </DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-6">
            {/* Configuration des Canaux */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-[#535455]">Canaux de Notification</CardTitle>
                <CardDescription>Activer/désactiver les différents canaux de notification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pushEnabled">Notifications Push</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="pushEnabled"
                        checked={notificationsConfig.pushEnabled}
                        onChange={(e) => setNotificationsConfig(prev => ({ ...prev, pushEnabled: e.target.checked }))}
                        className="w-4 h-4 text-[#ff6600] bg-gray-100 border-gray-300 rounded focus:ring-[#ff6600] focus:ring-2"
                      />
                      <span className="text-sm text-[#535455]/70">
                        {notificationsConfig.pushEnabled ? 'Activées' : 'Désactivées'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emailEnabled">Notifications Email</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="emailEnabled"
                        checked={notificationsConfig.emailEnabled}
                        onChange={(e) => setNotificationsConfig(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                        className="w-4 h-4 text-[#ff6600] bg-gray-100 border-gray-300 rounded focus:ring-[#ff6600] focus:ring-2"
                      />
                      <span className="text-sm text-[#535455]/70">
                        {notificationsConfig.emailEnabled ? 'Activées' : 'Désactivées'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="smsEnabled">Notifications SMS</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="smsEnabled"
                        checked={notificationsConfig.smsEnabled}
                        onChange={(e) => setNotificationsConfig(prev => ({ ...prev, smsEnabled: e.target.checked }))}
                        className="w-4 h-4 text-[#ff6600] bg-gray-100 border-gray-300 rounded focus:ring-[#ff6600] focus:ring-2"
                      />
                      <span className="text-sm text-[#535455]/70">
                        {notificationsConfig.smsEnabled ? 'Activées' : 'Désactivées'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Types de Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-[#535455]">Types de Notifications</CardTitle>
                <CardDescription>Configurer les types de notifications à recevoir</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="urgentChats">Chats Urgents</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="urgentChats"
                        checked={notificationsConfig.urgentChats}
                        onChange={(e) => setNotificationsConfig(prev => ({ ...prev, urgentChats: e.target.checked }))}
                        className="w-4 h-4 text-[#ff6600] bg-gray-100 border-gray-300 rounded focus:ring-[#ff6600] focus:ring-2"
                      />
                      <span className="text-sm text-[#535455]/70">Notifications pour chats urgents</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newMessages">Nouveaux Messages</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="newMessages"
                        checked={notificationsConfig.newMessages}
                        onChange={(e) => setNotificationsConfig(prev => ({ ...prev, newMessages: e.target.checked }))}
                        className="w-4 h-4 text-[#ff6600] bg-gray-100 border-gray-300 rounded focus:ring-[#ff6600] focus:ring-2"
                      />
                      <span className="text-sm text-[#535455]/70">Notifications pour nouveaux messages</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="systemAlerts">Alertes Système</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="systemAlerts"
                        checked={notificationsConfig.systemAlerts}
                        onChange={(e) => setNotificationsConfig(prev => ({ ...prev, systemAlerts: e.target.checked }))}
                        className="w-4 h-4 text-[#ff6600] bg-gray-100 border-gray-300 rounded focus:ring-[#ff6600] focus:ring-2"
                      />
                      <span className="text-sm text-[#535455]/70">Alertes système et maintenance</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Heures Silencieuses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-[#535455]">Heures Silencieuses</CardTitle>
                <CardDescription>Configurer les périodes de silence pour les notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quietHours">Activer les heures silencieuses</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="quietHours"
                      checked={notificationsConfig.quietHours}
                      onChange={(e) => setNotificationsConfig(prev => ({ ...prev, quietHours: e.target.checked }))}
                      className="w-4 h-4 text-[#ff6600] bg-gray-100 border-gray-300 rounded focus:ring-[#ff6600] focus:ring-2"
                    />
                    <span className="text-sm text-[#535455]/70">Réduire les notifications pendant certaines heures</span>
                  </div>
                </div>
                
                {notificationsConfig.quietHours && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quietStart">Heure de début</Label>
                      <Input
                        id="quietStart"
                        type="time"
                        value={notificationsConfig.quietStart}
                        onChange={(e) => setNotificationsConfig(prev => ({ ...prev, quietStart: e.target.value }))}
                        className="border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="quietEnd">Heure de fin</Label>
                      <Input
                        id="quietEnd"
                        type="time"
                        value={notificationsConfig.quietEnd}
                        onChange={(e) => setNotificationsConfig(prev => ({ ...prev, quietEnd: e.target.value }))}
                        className="border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test des Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-[#535455]">Test des Notifications</CardTitle>
                <CardDescription>Tester l'envoi de notifications sur différents canaux</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-[#535455]">
                      <strong>Configuration actuelle :</strong> {notificationsConfig.pushEnabled ? 'Push activé' : 'Push désactivé'}, {notificationsConfig.emailEnabled ? 'Email activé' : 'Email désactivé'}
                    </p>
                    <p className="text-xs text-[#535455]/70 mt-1">
                      Heures silencieuses: {notificationsConfig.quietHours ? `${notificationsConfig.quietStart} - ${notificationsConfig.quietEnd}` : 'Désactivées'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      onClick={() => handleTestNotification('push')}
                      disabled={!notificationsConfig.pushEnabled}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white transition-colors duration-200"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Tester Push
                    </Button>
                    
                    <Button 
                      onClick={() => handleTestNotification('email')}
                      disabled={!notificationsConfig.emailEnabled}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white transition-colors duration-200"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Tester Email
                    </Button>
                    
                    <Button 
                      onClick={() => handleTestNotification('sms')}
                      disabled={!notificationsConfig.smsEnabled}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white transition-colors duration-200"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Tester SMS
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Boutons d'action */}
          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 pb-2 border-t border-gray-200 bg-white">
            <Button 
              onClick={handleSaveNotificationsConfig}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white transition-colors duration-200"
            >
              <Bell className="h-4 w-4 mr-2" />
              Sauvegarder la Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modaux pour les Fonctionnalités Avancées */}
      
      {/* Modal Sélecteur d'Emoji */}
      <Dialog open={showEmojiPickerModal} onOpenChange={setShowEmojiPickerModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#535455]">Sélecteur d'Emoji</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-[#535455]">
                <strong>Emoji sélectionné :</strong> {selectedEmoji}
              </p>
              <p className="text-xs text-[#535455]/70 mt-1">
                Cet emoji peut être ajouté à vos messages ou utilisé pour réagir
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowEmojiPickerModal(false)}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
              >
                Utiliser l'Emoji
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowEmojiPickerModal(false)}
                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Upload de Fichier */}
      <Dialog open={showFileUploadModal} onOpenChange={setShowFileUploadModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#535455]">Upload de Fichier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-[#535455]">
                <strong>Type de fichier :</strong> {selectedFile ? selectedFile.type : 'Aucun fichier sélectionné'}
              </p>
              <p className="text-xs text-[#535455]/70 mt-1">
                Support pour images, documents, audio et vidéo jusqu'à 10MB
              </p>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-[#535455]">Glissez-déposez votre fichier ici</p>
              <p className="text-xs text-[#535455]/70">ou cliquez pour sélectionner</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowFileUploadModal(false)}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
              >
                Uploader
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowFileUploadModal(false)}
                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Réponse Rapide */}
      <Dialog open={showQuickResponseModal} onOpenChange={setShowQuickResponseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#535455]">Réponse Rapide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-[#535455]">
                <strong>Réponse sélectionnée :</strong> {selectedQuickResponse}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="customResponse">Personnaliser la réponse</Label>
                <Textarea
                  id="customResponse"
                  value={selectedQuickResponse}
                  onChange={(e) => setSelectedQuickResponse(e.target.value)}
                  className="mt-1 border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowQuickResponseModal(false)}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                >
                  Utiliser la Réponse
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowQuickResponseModal(false)}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Modèle de Message */}
      <Dialog open={showMessageTemplateModal} onOpenChange={setShowMessageTemplateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#535455]">Modèle de Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-[#535455]">
                <strong>Modèle sélectionné :</strong> {selectedMessageTemplate}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="templateContent">Contenu du modèle</Label>
                <Textarea
                  id="templateContent"
                  placeholder="Contenu du modèle de message..."
                  className="mt-1 border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                  rows={6}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowMessageTemplateModal(false)}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                >
                  Utiliser le Modèle
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowMessageTemplateModal(false)}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Outils de Modération */}
      <Dialog open={showModerationToolsModal} onOpenChange={setShowModerationToolsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#535455]">Outils de Modération</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-[#535455]">
                <strong>Action sélectionnée :</strong> {selectedModerationAction}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="moderationReason">Raison de la modération</Label>
                <Textarea
                  id="moderationReason"
                  placeholder="Expliquez la raison de cette action de modération..."
                  className="mt-1 border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowModerationToolsModal(false)}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                >
                  Appliquer l'Action
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowModerationToolsModal(false)}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Outils IA */}
      <Dialog open={showAIToolsModal} onOpenChange={setShowAIToolsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#535455]">Outils d'Intelligence Artificielle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-[#535455]">
                <strong>Fonctionnalité sélectionnée :</strong> {selectedAIFeature}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="aiConfiguration">Configuration IA</Label>
                <Textarea
                  id="aiConfiguration"
                  placeholder="Paramètres de configuration pour cette fonctionnalité IA..."
                  className="mt-1 border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowAIToolsModal(false)}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                >
                  Activer la Fonctionnalité
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowAIToolsModal(false)}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Personnalisation des Thèmes */}
      <Dialog open={showThemeCustomizationModal} onOpenChange={setShowThemeCustomizationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#535455]">Personnalisation des Thèmes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-[#535455]">
                <strong>Thème sélectionné :</strong> {selectedTheme}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="themeCustomization">Personnalisation avancée</Label>
                <Textarea
                  id="themeCustomization"
                  placeholder="Paramètres de personnalisation du thème..."
                  className="mt-1 border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowThemeCustomizationModal(false)}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                >
                  Appliquer le Thème
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowThemeCustomizationModal(false)}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Outils de Productivité */}
      <Dialog open={showProductivityToolsModal} onOpenChange={setShowProductivityToolsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#535455]">Outils de Productivité</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-[#535455]">
                <strong>Outil sélectionné :</strong> {selectedProductivityTool}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="productivityConfig">Configuration de l'outil</Label>
                <Textarea
                  id="productivityConfig"
                  placeholder="Paramètres de configuration pour cet outil de productivité..."
                  className="mt-1 border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowProductivityToolsModal(false)}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                >
                  Configurer l'Outil
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowProductivityToolsModal(false)}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Intégrations */}
      <Dialog open={showIntegrationsModal} onOpenChange={setShowIntegrationsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#535455]">Gestion des Intégrations</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-[#535455]">
                <strong>Intégration sélectionnée :</strong> {selectedIntegration}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="integrationConfig">Configuration de l'intégration</Label>
                <Textarea
                  id="integrationConfig"
                  placeholder="Paramètres de configuration pour cette intégration..."
                  className="mt-1 border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowIntegrationsModal(false)}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                >
                  Configurer l'Intégration
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowIntegrationsModal(false)}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Export */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#535455]">Export de Données</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-[#535455]">
                <strong>Format sélectionné :</strong> {selectedExportFormat}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="exportOptions">Options d'export</Label>
                <Textarea
                  id="exportOptions"
                  placeholder="Paramètres d'export et filtres..."
                  className="mt-1 border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowExportModal(false)}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                >
                  Exporter les Données
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowExportModal(false)}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nouvelle Conversation */}
      <Dialog open={showNewConversationModal} onOpenChange={setShowNewConversationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg text-[#535455] flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#ff6600]" />
              Nouvelle Conversation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-[#535455]">
                <strong>Créer une nouvelle conversation</strong>
              </p>
              <p className="text-xs text-[#535455]/70 mt-1">
                Initiez une nouvelle conversation avec un client ou utilisateur
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName">Nom du client *</Label>
                <Input
                  id="customerName"
                  placeholder="Nom complet du client"
                  className="mt-1 border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                />
              </div>
              
              <div>
                <Label htmlFor="subject">Sujet de la conversation *</Label>
                <Input
                  id="subject"
                  placeholder="Sujet ou motif de la conversation"
                  className="mt-1 border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                />
              </div>
              
              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select>
                  <SelectTrigger className="mt-1 border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]">
                    <SelectValue placeholder="Sélectionner la priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="initialMessage">Message initial (optionnel)</Label>
                <Textarea
                  id="initialMessage"
                  placeholder="Premier message de la conversation..."
                  className="mt-1 border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => {
                  const customerNameInput = document.getElementById('customerName') as HTMLInputElement
                  const subjectInput = document.getElementById('subject') as HTMLInputElement
                  const prioritySelect = document.querySelector('[data-state="closed"]') as HTMLElement
                  
                  const customerName = customerNameInput?.value || 'Client Anonyme'
                  const subject = subjectInput?.value || 'Conversation générale'
                  const priority = 'medium' // Valeur par défaut
                  
                  handleCreateNewConversation(customerName, subject, priority as 'low' | 'medium' | 'high' | 'urgent')
                }}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Créer la Conversation
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowNewConversationModal(false)}
                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
