'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Search, MoreVertical, Phone, Video, Send, Paperclip, Smile, Mic, Square, ShoppingCart, Bell, Settings, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'vendeur' | 'client';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'file' | 'voice' | 'image' | 'video';
  fileUrl?: string;
  fileName?: string;
  source: 'dashboard' | 'product-modal' | 'product-page' | 'global-widget' | 'buyer-dashboard';
  conversationId: string;
  messageHash: string;
}

interface SyncData {
  conversationId: string;
  messages: Message[];
  lastMessageTime: Date;
  unreadCount: number;
  clientStatus: 'online' | 'offline';
  syncTimestamp: Date;
}

interface Conversation {
  id: string;
  clientName: string;
  clientAvatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  productInterest?: string;
  totalOrders?: number;
  isPinned?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
}

export default function MessagingSection() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      clientName: 'Marie Dubois',
      clientAvatar: '', // Avatar par défaut
      lastMessage: 'Bonjour, j\'aimerais commander le produit X',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
      unreadCount: 2,
      isOnline: true,
      priority: 'high',
      productInterest: 'Produit Premium X',
      totalOrders: 5,
      isPinned: false,
      isArchived: false,
      isMuted: false
    },
    {
      id: '2',
      clientName: 'Jean Martin',
      clientAvatar: '', // Avatar par défaut
      lastMessage: 'Merci pour votre réponse rapide',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
      unreadCount: 0,
      isOnline: false,
      priority: 'medium',
      productInterest: 'Service Y',
      totalOrders: 12,
      isPinned: true,
      isArchived: false,
      isMuted: false
    },
    {
      id: '3',
      clientName: 'Sophie Bernard',
      clientAvatar: '', // Avatar par défaut
      lastMessage: 'Pouvez-vous me donner plus d\'informations ?',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 5),
      unreadCount: 1,
      isOnline: true,
      priority: 'low',
      productInterest: 'Produit Z',
      totalOrders: 0,
      isPinned: false,
      isArchived: false,
      isMuted: false
    }
  ]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [showThreeDotsMenu, setShowThreeDotsMenu] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isVoiceCall, setIsVoiceCall] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    timestamp: Date;
  }>>([]);
  const [showAddQuickReply, setShowAddQuickReply] = useState(false);
  const [newQuickReply, setNewQuickReply] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'idle'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [syncInterval, setSyncInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDestinations, setTransferDestinations] = useState<Set<string>>(new Set());
  const [transferSearchTerm, setTransferSearchTerm] = useState('');
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [recordingVolume, setRecordingVolume] = useState(0);
  const [recordingWaveform, setRecordingWaveform] = useState<number[]>([]);

  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { confirm } = useConfirm();

  const quickReplies = [
    'Bonjour ! Comment puis-je vous aider ?',
    'Merci pour votre intérêt !',
    'Prix : 25 000 F CFA (250 points)',
    'Livraison gratuite à partir de 50 000 F CFA (500 points)',
    'Notre équipe support est disponible 24/7',
    'Promotion spéciale : -20% sur tous les produits',
    'Paiement sécurisé accepté',
    'Garantie 30 jours satisfait ou remboursé'
  ];

  const emojis = ['😊', '👍', '❤️', '🎉', '🔥', '💯', '✨', '🌟', '💪', '🎯', '🚀', '💎'];

  // Liste des utilisateurs disponibles pour le transfert
  const availableUsers = [
    { id: 'user1', name: 'Marie Dubois', avatar: '/avatars/marie.jpg', role: 'Client', status: 'online' },
    { id: 'user2', name: 'Jean Martin', avatar: '/avatars/jean.jpg', role: 'Client', status: 'offline' },
    { id: 'user3', name: 'Sophie Bernard', avatar: '/avatars/sophie.jpg', role: 'Client', status: 'online' },
    { id: 'user4', name: 'Pierre Durand', avatar: '/avatars/pierre.jpg', role: 'Client', status: 'offline' },
    { id: 'user5', name: 'Lucie Moreau', avatar: '/avatars/lucie.jpg', role: 'Client', status: 'online' },
    { id: 'user6', name: 'Thomas Leroy', avatar: '/avatars/thomas.jpg', role: 'Client', status: 'offline' },
    { id: 'user7', name: 'Emma Rousseau', avatar: '/avatars/emma.jpg', role: 'Client', status: 'online' },
    { id: 'user8', name: 'Hugo Blanc', avatar: '/avatars/hugo.jpg', role: 'Client', status: 'offline' }
  ];

  // Compteur pour garantir l'unicité des IDs de notification
  const notificationCounter = useRef(0);

  // Fonction unifiée pour gérer les notifications
  const manageNotification = (action: 'add' | 'remove', message?: string, type?: 'success' | 'error' | 'warning' | 'info', id?: string) => {
    if (action === 'add' && message && type) {
      notificationCounter.current += 1;
      const notificationId = `${Date.now()}-${notificationCounter.current}`;
      const notification = { id: notificationId, message, type, timestamp: new Date() };
      setNotifications(prev => [...prev, notification]);
      
      // Auto-suppression après 5 secondes
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }, 5000);
    } else if (action === 'remove' && id) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  // Fonctions d'aide pour les notifications
  const addNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    manageNotification('add', message, type);
  };

  const removeNotification = (id: string) => {
    manageNotification('remove', undefined, undefined, id);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fonction pour gérer les appels vidéo et vocaux
  const handleCall = (type: 'video' | 'voice') => {
    if (selectedConversation) {
      if (type === 'video') {
        setIsVideoCall(true);
        addNotification(`Appel vidéo en cours avec ${selectedConversation.clientName}...`, 'info');
        setTimeout(() => {
          setIsVideoCall(false);
          addNotification('Appel vidéo terminé', 'success');
        }, 3000);
      } else {
        setIsVoiceCall(true);
        addNotification(`Appel vocal en cours avec ${selectedConversation.clientName}...`, 'info');
        setTimeout(() => {
          setIsVoiceCall(false);
          addNotification('Appel vocal terminé', 'success');
        }, 3000);
      }
    } else {
      addNotification('Sélectionnez d\'abord un client', 'warning');
    }
  };

  // Fonction unifiée pour la recherche dans les conversations
  const handleSearch = (action: 'open' | 'perform') => {
    if (action === 'open') {
      if (selectedConversation) {
        setShowSearchOverlay(true);
      } else {
        addNotification('Sélectionnez d\'abord un client', 'warning');
      }
    } else if (action === 'perform') {
      if (searchQuery.trim() && selectedConversation) {
        const foundMessages = messages.filter(msg => 
          msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (foundMessages.length > 0) {
          addNotification(`${foundMessages.length} message(s) trouvé(s) contenant "${searchQuery}"`, 'success');
        } else {
          addNotification('Aucun message trouvé', 'warning');
        }
        setShowSearchOverlay(false);
        setSearchQuery('');
      }
    }
  };

  // Fonction pour épingler/dépinner une conversation
  const togglePinConversation = () => {
    if (selectedConversation) {
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation.id 
          ? { ...conv, isPinned: !conv.isPinned }
          : conv
      ));
      addNotification(
        selectedConversation.isPinned ? 'Conversation dépinnée' : 'Conversation épinglée', 
        'success'
      );
      setShowThreeDotsMenu(false);
    }
  };

  // Fonction pour archiver/désarchiver une conversation
  const toggleArchiveConversation = () => {
    if (selectedConversation) {
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation.id 
          ? { ...conv, isArchived: !conv.isArchived }
          : conv
      ));
      addNotification(
        selectedConversation.isArchived ? 'Conversation désarchivée' : 'Conversation archivée', 
        'success'
      );
      setShowThreeDotsMenu(false);
    }
  };

  // Fonction pour activer/désactiver les notifications
  const toggleNotifications = () => {
    if (selectedConversation) {
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation.id 
          ? { ...conv, isMuted: !conv.isMuted }
          : conv
      ));
      addNotification(
        selectedConversation.isMuted ? 'Notifications réactivées' : 'Notifications désactivées', 
        'success'
      );
      setShowThreeDotsMenu(false);
    }
  };

  // Fonction unifiée pour gérer les actions sur les conversations
  const handleConversationAction = async (action: 'history' | 'delete') => {
    if (!selectedConversation) return;
    
    if (action === 'history') {
      const history = `Historique de ${selectedConversation.clientName}:\n\n` +
        `- Total commandes: ${selectedConversation.totalOrders || 0}\n` +
        `- Intérêt produit: ${selectedConversation.productInterest || 'Aucun'}\n` +
        `- Priorité: ${selectedConversation.priority}\n` +
        `- Messages: ${messages.length}\n` +
        `- Dernière activité: ${new Date(selectedConversation.lastMessageTime).toLocaleString()}`;
      addNotification(history, 'info');
      setShowThreeDotsMenu(false);
    } else if (action === 'delete') {
      const accepted = await confirm({
        title: 'Supprimer la conversation',
        message: `Êtes-vous sûr de vouloir supprimer la conversation avec ${selectedConversation.clientName} ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        tone: 'destructive'
      })
      if (accepted) {
        setConversations(prev => prev.filter(conv => conv.id !== selectedConversation.id));
        setSelectedConversation(null);
        setMessages([]);
        addNotification('Conversation supprimée', 'success');
        setShowThreeDotsMenu(false);
      }
    }
  };

  // Fonction pour ajouter un emoji
  const addEmoji = (emoji: string) => {
    if (messageInputRef.current) {
      const start = messageInputRef.current.selectionStart || 0;
      const end = messageInputRef.current.selectionEnd || 0;
      const text = messageInputRef.current.value;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      messageInputRef.current.value = newText;
      messageInputRef.current.setSelectionRange(start + emoji.length, start + emoji.length);
      messageInputRef.current.focus();
    }
    setShowEmojiPicker(false);
  };

  // Fonction pour joindre un fichier
  const handleFileAttachment = () => {
    if (selectedConversation) {
      fileInputRef.current?.click();
    } else {
      addNotification('Sélectionnez d\'abord un client', 'warning');
    }
  };

  // Fonction pour générer un hash unique pour un message
  const generateMessageHash = (content: string, timestamp: Date, sender: string): string => {
    return btoa(`${content}-${timestamp.getTime()}-${sender}-${Math.random()}`).slice(0, 16);
  };

  // Fonction unifiée pour la synchronisation des messages
  const syncMessages = async (conversationId: string, action: 'send' | 'fetch', newMessage?: Message) => {
    try {
      setSyncStatus('syncing');
      
      if (action === 'send' && newMessage) {
        // Synchronisation d'envoi
        const syncData: SyncData = {
          conversationId,
          messages: [newMessage],
          lastMessageTime: new Date(),
          unreadCount: 1,
          clientStatus: selectedConversation?.isOnline ? 'online' : 'offline',
          syncTimestamp: new Date()
        };
        
        // Simulation d'un délai réseau
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        addNotification(`Message envoyé et synchronisé avec ${selectedConversation?.clientName}`, 'success');
      } else if (action === 'fetch') {
        // Récupération des messages
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        addNotification(`Messages récupérés pour ${selectedConversation?.clientName}`, 'success');
      }
      
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
      setSyncStatus('error');
      addNotification('Erreur de synchronisation', 'error');
    }
  };

  // Fonction pour forcer la synchronisation
  const forceSync = async () => {
    if (!selectedConversation) {
      addNotification('Sélectionnez d\'abord un client', 'warning');
      return;
    }
    
    await syncMessages(selectedConversation.id, 'fetch');
  };

  // Fonction pour démarrer la synchronisation automatique
  const startAutoSync = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
    }
    
    const interval = setInterval(async () => {
      if (selectedConversation) {
        await syncMessages(selectedConversation.id, 'fetch');
      }
    }, 30000); // Synchronisation toutes les 30 secondes
    
    setSyncInterval(interval);
    addNotification('Synchronisation automatique activée', 'success');
  };

  // Fonction pour arrêter la synchronisation automatique
  const stopAutoSync = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      setSyncInterval(null);
      addNotification('Synchronisation automatique désactivée', 'info');
    }
  };

  // Fonction pour activer/désactiver le mode sélection
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedMessages(new Set());
      setShowMessageActions(false);
    }
  };

  // Fonction pour sélectionner/désélectionner un message
  const toggleMessageSelection = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
    
    if (newSelected.size > 0) {
      setShowMessageActions(true);
    } else {
      setShowMessageActions(false);
    }
  };

  // Fonction unifiée pour la sélection des messages
  const toggleAllMessages = (select: boolean) => {
    if (select) {
      const allMessageIds = messages.map(msg => msg.id);
      setSelectedMessages(new Set(allMessageIds));
      setShowMessageActions(true);
    } else {
      setSelectedMessages(new Set());
      setShowMessageActions(false);
    }
  };

  // Fonction pour supprimer les messages sélectionnés
  const deleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return;
    
    const accepted = await confirm({
      title: 'Supprimer les messages',
      message: `Êtes-vous sûr de vouloir supprimer ${selectedMessages.size} message(s) ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      tone: 'destructive'
    })
    if (accepted) {
      setMessages(prev => prev.filter(msg => !selectedMessages.has(msg.id)));
      setSelectedMessages(new Set());
      setShowMessageActions(false);
      addNotification(`${selectedMessages.size} message(s) supprimé(s)`, 'success');
    }
  };

  // Fonction unifiée pour marquer les messages
  const markSelectedMessages = (status: 'read' | 'sent') => {
    if (selectedMessages.size === 0) return;
    
    setMessages(prev => prev.map(msg => 
      selectedMessages.has(msg.id) ? { ...msg, status } : msg
    ));
    const statusText = status === 'read' ? 'lus' : 'non lus';
    addNotification(`${selectedMessages.size} message(s) marqué(s) comme ${statusText}`, 'success');
  };

  // Fonction unifiée pour gérer les actions sur les messages sélectionnés
  const handleMessageAction = (action: 'copy' | 'save') => {
    if (selectedMessages.size === 0) return;
    
    const selectedMessagesList = messages.filter(msg => selectedMessages.has(msg.id));
    
    if (action === 'copy') {
      const textToCopy = selectedMessagesList.map(msg => 
        `[${msg.sender === 'vendeur' ? 'Vendeur' : 'Client'}] ${msg.content}`
      ).join('\n\n');
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        addNotification(`${selectedMessages.size} message(s) copié(s) dans le presse-papiers`, 'success');
      }).catch(() => {
        addNotification('Erreur lors de la copie', 'error');
      });
    } else if (action === 'save') {
      const dataToSave = {
        conversationId: selectedConversation?.id,
        clientName: selectedConversation?.clientName,
        messages: selectedMessagesList,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `messages-${selectedConversation?.clientName}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addNotification(`${selectedMessages.size} message(s) sauvegardé(s)`, 'success');
    }
  };

  // Fonction unifiée pour gérer les transferts de messages
  const handleTransfer = (action: 'initiate' | 'confirm' | 'cancel') => {
    if (action === 'initiate') {
      if (selectedMessages.size === 0) return;
      
      // Ouvrir le modal de transfert
      setShowTransferModal(true);
      setTransferDestinations(new Set());
      setTransferSearchTerm('');
    } else if (action === 'confirm') {
      if (transferDestinations.size === 0) {
        addNotification('Veuillez sélectionner au moins un destinataire', 'warning');
        return;
      }

      const selectedMessagesList = messages.filter(msg => selectedMessages.has(msg.id));
      const selectedDestinations = availableUsers.filter(user => transferDestinations.has(user.id));
      
      const transferData = {
        messages: selectedMessagesList,
        sourceConversation: selectedConversation?.id,
        sourceClient: selectedConversation?.clientName,
        destinations: selectedDestinations.map(user => ({ id: user.id, name: user.name }))
      };

      // Simulation du transfert
      addNotification(`${selectedMessages.size} message(s) transféré(s) vers ${transferDestinations.size} destinataire(s)`, 'success');
      console.log('Transfert effectué:', transferData);
      
      // Fermer le modal et réinitialiser
      setShowTransferModal(false);
      setTransferDestinations(new Set());
      setTransferSearchTerm('');
    } else if (action === 'cancel') {
      setShowTransferModal(false);
      setTransferDestinations(new Set());
      setTransferSearchTerm('');
    }
  };

  // Fonction pour basculer la sélection d'un destinataire
  const toggleDestinationSelection = (userId: string) => {
    const newDestinations = new Set(transferDestinations);
    if (newDestinations.has(userId)) {
      newDestinations.delete(userId);
    } else {
      newDestinations.add(userId);
    }
    setTransferDestinations(newDestinations);
  };

  // Fonction unifiée pour la sélection des destinataires
  const toggleAllDestinations = (select: boolean) => {
    if (select) {
      const allUserIds = availableUsers.map(user => user.id);
      setTransferDestinations(new Set(allUserIds));
    } else {
      setTransferDestinations(new Set());
    }
  };

  // Fonction pour valider la confidentialité des messages
  const validateMessagePrivacy = (message: Message, targetConversationId: string): boolean => {
    // Vérifier que le message appartient bien à la conversation cible
    if (message.conversationId !== targetConversationId) {
      console.error('Tentative d\'envoi de message à la mauvaise conversation!');
      addNotification('Erreur de confidentialité détectée', 'error');
      return false;
    }
    return true;
  };

  // Fonction pour envoyer un message de manière sécurisée
  const sendSecureMessage = (content: string, type: Message['type'] = 'text', fileData?: any) => {
    if (!selectedConversation || !content.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'vendeur',
      timestamp: new Date(),
      status: 'sent',
      type,
      source: 'dashboard',
      conversationId: selectedConversation.id,
      messageHash: generateMessageHash(content, new Date(), 'vendeur'),
      ...fileData
    };

    // Validation de la confidentialité
    if (!validateMessagePrivacy(newMessage, selectedConversation.id)) {
      return;
    }

    // Ajouter le message à cette conversation
    setMessages(prev => [...prev, newMessage]);
    
    // Confirmation de confidentialité
    addNotification(`Message privé envoyé à ${selectedConversation.clientName} uniquement`, 'success');

    // Synchroniser avec le client de cette conversation
    syncMessages(selectedConversation.id, 'send', newMessage);

    // Simulation de réponse client
    if (selectedConversation.isOnline) {
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
        ));

        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === newMessage.id ? { ...msg, status: 'read' } : msg
          ));

          const clientResponse: Message = {
            id: (Date.now() + 1).toString(),
            content: 'Parfait, merci pour ces informations !',
            sender: 'client',
            timestamp: new Date(),
            status: 'sent',
            type: 'text',
            source: 'dashboard',
            conversationId: selectedConversation.id,
            messageHash: generateMessageHash('Parfait, merci pour ces informations !', new Date(), 'client')
          };

          // Validation de la confidentialité de la réponse
          if (validateMessagePrivacy(clientResponse, selectedConversation.id)) {
            setMessages(prev => [...prev, clientResponse]);
          }
        }, 1000);
      }, 500);
    }

    setTimeout(() => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // Fonction unifiée pour gérer les réponses rapides
  const manageQuickReply = async (action: 'add' | 'remove', index?: number) => {
    if (action === 'add') {
      if (newQuickReply.trim()) {
        const updatedQuickReplies = [...quickReplies, newQuickReply.trim()];
        // Ici vous pourriez sauvegarder dans une base de données
        addNotification('Réponse rapide ajoutée avec succès', 'success');
        setNewQuickReply('');
        setShowAddQuickReply(false);
      } else {
        addNotification('Veuillez saisir une réponse rapide', 'warning');
      }
    } else if (action === 'remove' && index !== undefined) {
      const accepted = await confirm({
        title: 'Supprimer la réponse rapide',
        message: 'Êtes-vous sûr de vouloir supprimer cette réponse rapide ?',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        tone: 'destructive'
      })
      if (accepted) {
        const updatedQuickReplies = quickReplies.filter((_, i) => i !== index);
        // Ici vous pourriez sauvegarder dans une base de données
        addNotification('Réponse rapide supprimée', 'success');
      }
    }
  };

  // Alias pour la fonction d'envoi sécurisé
  const sendMessage = sendSecureMessage;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation) return;

    if (file.size > 90 * 1024) {
      addNotification('Le fichier est trop volumineux. Taille maximum : 90KB', 'warning');
      return;
    }

    const fileType = file.type.split('/')[0];
    const messageType: Message['type'] = fileType === 'image' ? 'image' : 
                                       fileType === 'video' ? 'video' : 
                                       fileType === 'audio' ? 'voice' : 'file';

    const fileData = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileUrl: URL.createObjectURL(file)
    };

    sendMessage(`Fichier: ${file.name}`, messageType, fileData);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      if (!selectedConversation) {
        addNotification('Sélectionnez d\'abord un client pour enregistrer un message vocal', 'warning');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        try {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          if (audioBlob.size > 10 * 1024 * 1024) {
            addNotification('Fichier audio trop volumineux. Taille maximum : 10MB', 'warning');
            return;
          }

          const messageData = {
            fileName: `Message vocal ${new Date().toLocaleTimeString()}`,
            fileSize: audioBlob.size,
            fileType: 'audio/webm',
            fileUrl: audioUrl,
            duration: recordingTime
          };

          sendMessage('🎤 Message vocal', 'voice', messageData);
          
          setAudioChunks([]);
          setRecordingWaveform([]);
          addNotification('Message vocal enregistré et envoyé avec succès', 'success');
          
        } catch (error) {
          console.error('Erreur lors du traitement de l\'audio:', error);
          addNotification('Erreur lors du traitement de l\'audio', 'error');
        }
      };

      recorder.onerror = (event) => {
        console.error('Erreur d\'enregistrement:', event);
        setIsRecording(false);
        setRecordingTime(0);
        setRecordingPaused(false);
        setRecordingWaveform([]);
        addNotification('Erreur lors de l\'enregistrement audio', 'error');
      };

      recorder.onpause = () => {
        setRecordingPaused(true);
        addNotification('Enregistrement en pause', 'info');
      };

      recorder.onresume = () => {
        setRecordingPaused(false);
        addNotification('Enregistrement repris', 'info');
      };

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      source.connect(analyser);

      const analyzeAudio = () => {
        if (isRecording && !recordingPaused) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setRecordingVolume(average);
          
          const waveform = Array.from(dataArray).slice(0, 20).map(value => value / 255);
          setRecordingWaveform(waveform);
          
          requestAnimationFrame(analyzeAudio);
        }
      };

      analyzeAudio();

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      setRecordingTime(0);
      setRecordingPaused(false);
      setRecordingWaveform([]);

      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      setRecordingTimer(timer);
      
      recorder.start(100);
      
      addNotification('Enregistrement vocal démarré', 'info');
      
    } catch (error) {
      console.error('Erreur d\'accès au microphone:', error);
      
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        addNotification('Accès au microphone refusé. Veuillez autoriser l\'accès.', 'error');
      } else if (error instanceof DOMException && error.name === 'NotFoundError') {
        addNotification('Aucun microphone détecté. Vérifiez votre matériel.', 'error');
      } else {
        addNotification('Impossible d\'accéder au microphone', 'error');
      }
      
      setIsRecording(false);
      setRecordingTime(0);
      setRecordingPaused(false);
    }
  };

  // Fonction unifiée pour gérer la pause/reprise de l'enregistrement
  const toggleRecordingPause = () => {
    if (mediaRecorder && isRecording) {
      try {
        if (recordingPaused) {
          mediaRecorder.resume();
          setRecordingPaused(false);
          addNotification('Enregistrement repris', 'info');
        } else {
          mediaRecorder.pause();
          setRecordingPaused(true);
          addNotification('Enregistrement en pause', 'info');
        }
      } catch (error) {
        console.error('Erreur lors de la gestion de l\'enregistrement:', error);
        addNotification('Erreur lors de la gestion de l\'enregistrement', 'error');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      try {
        mediaRecorder.stop();
        
        if (mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
        }
        
        setIsRecording(false);
        setRecordingPaused(false);
        setRecordingVolume(0);
        setRecordingWaveform([]);
        
        if (recordingTimer) {
          clearInterval(recordingTimer);
          setRecordingTimer(null);
        }
        
        setMediaRecorder(null);
        
        addNotification('Enregistrement vocal arrêté', 'info');
        
      } catch (error) {
        console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error);
        addNotification('Erreur lors de l\'arrêt de l\'enregistrement', 'error');
        
        setIsRecording(false);
        setRecordingPaused(false);
        setRecordingVolume(0);
        setRecordingWaveform([]);
        if (recordingTimer) {
          clearInterval(recordingTimer);
          setRecordingTimer(null);
        }
        setMediaRecorder(null);
      }
    }
  };

  // Fonction unifiée pour gérer l'envoi de messages
  const handleMessageSend = (event?: React.KeyboardEvent) => {
    if (event && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
    }
    
    if (messageInputRef.current && messageInputRef.current.value.trim()) {
      sendMessage(messageInputRef.current.value.trim());
      messageInputRef.current.value = '';
    }
  };

  const useQuickReply = (reply: string) => {
    if (messageInputRef.current) {
      messageInputRef.current.value = reply;
      messageInputRef.current.focus();
    }
    setShowQuickReplies(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-[#ff6600]';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-[#535455]';
    }
  };

  useEffect(() => {
    if (recordingTimer) {
      clearInterval(recordingTimer);
    }
  }, []);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

    // Styles CSS personnalisés pour les animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .animate-slide-in {
        animation: slide-in 0.3s ease-out forwards;
      }
      
      @keyframes fade-out {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .animate-fade-out {
        animation: fade-out 0.3s ease-in forwards;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Gestion de la synchronisation automatique
  useEffect(() => {
    // Démarrer la synchronisation automatique au montage du composant
    startAutoSync();
    
    // Nettoyer les intervalles au démontage
    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [selectedConversation]);

  // Synchronisation initiale quand une conversation est sélectionnée
  useEffect(() => {
    if (selectedConversation) {
      syncMessages(selectedConversation.id, 'fetch');
    }
  }, [selectedConversation]);

  return (
    <div className="flex h-screen bg-[#535455]/5">
      {/* Sidebar Vendeur */}
      <div className="w-96 bg-white/95 backdrop-blur-sm border-r border-[#535455]/20 flex flex-col shadow-lg">
        {/* Header Vendeur */}
        <div className="bg-[#ff6600] p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <div>
                <span className="text-lg font-semibold">Tableau de Bord</span>
                <p className="text-xs text-white/80">Vendeur</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                onClick={() => {
                  const notificationCount = conversations.filter(conv => conv.unreadCount > 0).length;
                  if (notificationCount > 0) {
                    addNotification(`${notificationCount} conversation(s) avec des messages non lus`, 'info');
                  } else {
                    addNotification('Aucune notification', 'info');
                  }
                }}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
              <button 
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                onClick={() => setShowSettings(true)}
                title="Paramètres et statistiques"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

                    {/* Search Bar Moderne */}
            <div className="p-4 border-b border-[#535455]/20">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#535455] group-focus-within:text-[#ff6600] transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Rechercher des clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-gradient-to-r from-[#535455]/5 to-[#ff6600]/5 border-2 border-[#535455]/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#ff6600]/50 focus:border-[#ff6600] hover:border-[#ff6600]/30 transition-all duration-300 placeholder-[#535455]/60 font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-[#ff6600]/10 hover:bg-[#ff6600] text-[#535455] hover:text-white rounded-full flex items-center justify-center transition-all duration-200 text-sm font-bold"
                  >
                    ✕
                  </button>
                )}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff6600]/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map(conv => (
            <div
              key={conv.id}
              className={`flex items-center p-3 hover:bg-[#ff6600]/5 cursor-pointer border-b border-[#535455]/10 transition-all ${
                selectedConversation?.id === conv.id ? 'bg-[#ff6600]/10 border-l-4 border-l-[#ff6600]' : ''
              } ${conv.isPinned ? 'bg-yellow-50 border-l-2 border-l-yellow-400' : ''} ${conv.isArchived ? 'opacity-60' : ''}`}
              onClick={() => setSelectedConversation(conv)}
            >
              <div className="relative">
                {conv.clientAvatar ? (
                  <img
                    src={conv.clientAvatar}
                    alt={conv.clientName}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[#535455]/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff6600] to-[#ff6600]/80 flex items-center justify-center ring-2 ring-[#535455]/20">
                    <span className="text-white font-bold text-lg">
                      {conv.clientName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {conv.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
                <div className={`absolute -top-1 -left-1 w-4 h-4 ${getPriorityColor(conv.priority)} rounded-full flex items-center justify-center text-xs text-white font-bold`}>
                  {conv.priority.charAt(0).toUpperCase()}
                </div>
                {conv.isPinned && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-xs text-white">
                    📌
                  </div>
                )}
              </div>
              <div className="flex-1 ml-3 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#535455] truncate">
                    {conv.clientName}
                    {conv.isPinned && <span className="ml-1 text-yellow-600">📌</span>}
                    {conv.isArchived && <span className="ml-1 text-[#535455]/60">📁</span>}
                    {conv.isMuted && <span className="ml-1 text-red-500">🔇</span>}
                  </h3>
                  <span className="text-xs text-[#535455]/60">
                    {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#535455]/80 truncate max-w-[180px]">
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <div className="bg-[#ff6600] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center min-w-[20px] font-bold">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  {conv.productInterest && (
                    <span className="text-xs bg-[#ff6600]/10 text-[#ff6600] px-2 py-1 rounded-full">
                      {conv.productInterest}
                    </span>
                  )}
                  {conv.totalOrders && (
                    <span className="text-xs bg-[#535455]/10 text-[#535455] px-2 py-1 rounded-full">
                      {conv.totalOrders} commandes
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area Vendeur */}
      <div className="flex-1 flex flex-col bg-[#535455]/5">
        {selectedConversation ? (
          <>
            {/* Chat Header Vendeur */}
            <div className="bg-white/95 backdrop-blur-sm border-b border-[#535455]/20 p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {selectedConversation.clientAvatar ? (
                    <img
                      src={selectedConversation.clientAvatar}
                      alt={selectedConversation.clientName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-[#535455]/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6600] to-[#ff6600]/80 flex items-center justify-center ring-2 ring-[#535455]/20">
                      <span className="text-white font-bold text-base">
                        {selectedConversation.clientName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {selectedConversation.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#535455]">
                    {selectedConversation.clientName}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-[#535455]/60">
                      {selectedConversation.isOnline ? 'En ligne' : 'Hors ligne'}
                    </p>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedConversation.priority)} text-white`}>
                      {selectedConversation.priority}
                    </div>
                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                      🔒 Privé
                    </div>
                  </div>
                </div>
              </div>
                          <div className="flex items-center space-x-2">
              <button 
                className="p-2 hover:bg-[#535455]/10 rounded-full transition-colors"
                onClick={() => handleCall('video')}
                title="Appel vidéo"
              >
                <Video className="w-5 h-5 text-[#535455]" />
              </button>
              <button 
                className="p-2 hover:bg-[#535455]/10 rounded-full transition-colors"
                onClick={() => handleCall('voice')}
                title="Appel vocal"
              >
                <Phone className="w-5 h-5 text-[#535455]" />
              </button>
              <button 
                className="p-2 hover:bg-[#535455]/10 rounded-full transition-colors"
                onClick={() => handleSearch('open')}
                title="Rechercher dans la conversation"
              >
                <Search className="w-5 h-5 text-[#535455]" />
              </button>
              <button 
                className="p-2 hover:bg-[#535455]/10 rounded-full transition-colors" 
                onClick={() => setShowThreeDotsMenu(true)}
                title="Menu des actions"
              >
                <MoreVertical className="w-5 h-5 text-[#535455]" />
              </button>
              
              {/* Bouton Mode Sélection */}
              <button 
                className={`p-2 rounded-full transition-all ${
                  isSelectionMode 
                    ? 'bg-[#ff6600] text-white shadow-lg' 
                    : 'hover:bg-[#535455]/10 text-[#535455]'
                }`}
                onClick={toggleSelectionMode}
                title={isSelectionMode ? 'Désactiver le mode sélection' : 'Activer le mode sélection'}
              >
                <span className="text-lg">☑️</span>
              </button>
              
              {/* Indicateur de synchronisation */}
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-[#535455]/20">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    syncStatus === 'synced' ? 'bg-green-500' :
                    syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' :
                    syncStatus === 'error' ? 'bg-red-500' :
                    'bg-gray-400'
                  }`}></div>
                  <span className="text-xs text-[#535455]/70">
                    {syncStatus === 'synced' ? 'Synchronisé' :
                     syncStatus === 'syncing' ? 'Synchronisation...' :
                     syncStatus === 'error' ? 'Erreur' :
                     'En attente'}
                  </span>
                </div>
                <button
                  onClick={forceSync}
                  className="p-1 hover:bg-[#ff6600]/10 rounded transition-colors"
                  title="Forcer la synchronisation"
                >
                  <span className="text-xs text-[#ff6600]">🔄</span>
                </button>
              </div>
            </div>
            </div>

            {/* Barre d'actions des messages sélectionnés */}
            {showMessageActions && (
              <div className="bg-gradient-to-r from-[#ff6600]/10 to-[#ff6600]/5 border border-[#ff6600]/20 rounded-xl p-3 mb-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-[#535455]">
                      {selectedMessages.size} message(s) sélectionné(s)
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleAllMessages(true)}
                        className="px-3 py-1 text-xs bg-[#ff6600]/20 text-[#ff6600] rounded-lg hover:bg-[#ff6600]/30 transition-colors"
                      >
                        Tout sélectionner
                      </button>
                      <button
                        onClick={() => toggleAllMessages(false)}
                        className="px-3 py-1 text-xs bg-[#535455]/20 text-[#535455] rounded-lg hover:bg-[#535455]/30 transition-colors"
                      >
                        Tout désélectionner
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => markSelectedMessages('read')}
                      className="px-3 py-1 text-xs bg-green-500/20 text-green-600 rounded-lg hover:bg-green-500/30 transition-colors"
                      title="Marquer comme lu"
                    >
                      ✓ Lu
                    </button>
                    <button
                      onClick={() => markSelectedMessages('sent')}
                      className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-600 rounded-lg hover:bg-yellow-500/30 transition-colors"
                      title="Marquer comme non lu"
                    >
                      ✗ Non lu
                    </button>
                    <button
                      onClick={() => handleMessageAction('copy')}
                      className="px-3 py-1 text-xs bg-blue-500/20 text-blue-600 rounded-lg hover:bg-blue-500/30 transition-colors"
                      title="Copier"
                    >
                      📋 Copier
                    </button>
                    <button
                      onClick={() => handleMessageAction('save')}
                      className="px-3 py-1 text-xs bg-purple-500/20 text-purple-600 rounded-lg hover:bg-purple-500/30 transition-colors"
                      title="Sauvegarder"
                    >
                      💾 Sauvegarder
                    </button>
                    <button
                      onClick={() => handleTransfer('initiate')}
                      className="px-3 py-1 text-xs bg-indigo-500/20 text-indigo-600 rounded-lg hover:bg-indigo-500/30 transition-colors"
                      title="Transférer"
                    >
                      ➡️ Transférer
                    </button>
                    <button
                      onClick={deleteSelectedMessages}
                      className="px-3 py-1 text-xs bg-red-500/20 text-red-600 rounded-lg hover:bg-red-500/30 transition-colors"
                      title="Supprimer"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'vendeur' ? 'justify-end' : 'justify-start'} ${
                      isSelectionMode ? 'relative' : ''
                    }`}
                  >
                    {/* Case à cocher pour la sélection */}
                    {isSelectionMode && (
                      <div className={`absolute ${msg.sender === 'vendeur' ? 'right-2' : 'left-2'} top-2 z-10`}>
                        <input
                          type="checkbox"
                          checked={selectedMessages.has(msg.id)}
                          onChange={() => toggleMessageSelection(msg.id)}
                          className="w-4 h-4 text-[#ff6600] bg-white border-2 border-[#ff6600] rounded focus:ring-[#ff6600] focus:ring-2 cursor-pointer"
                        />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg transition-all duration-200 ${
                        msg.sender === 'vendeur'
                          ? 'bg-[#ff6600] text-white shadow-lg'
                          : 'bg-white text-[#535455] shadow-sm border border-[#535455]/20'
                      } ${isSelectionMode ? 'mt-6' : ''} ${
                        selectedMessages.has(msg.id) 
                          ? 'ring-2 ring-[#ff6600] ring-opacity-50 shadow-xl scale-105' 
                          : ''
                      }`}
                    >
                      {msg.type === 'text' && <p className="text-sm">{msg.content}</p>}
                      
                      {msg.type === 'file' && (
                        <div>
                          <p className="text-sm mb-2">{msg.content}</p>
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-200 underline text-xs"
                          >
                            {msg.fileName}
                          </a>
                        </div>
                      )}
                      
                      {msg.type === 'voice' && (
                        <div>
                          <p className="text-sm mb-2">{msg.content}</p>
                          <audio controls className="w-full mt-2">
                            <source src={msg.fileUrl} type="audio/webm" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                      
                      {msg.type === 'image' && (
                        <div>
                          <img
                            src={msg.fileUrl}
                            alt={msg.fileName || 'Image'}
                            className="w-full rounded-lg mt-2"
                          />
                        </div>
                      )}
                      
                      {msg.type === 'video' && (
                        <div>
                          <video controls className="w-full rounded-lg mt-2">
                            <source src={msg.fileUrl} type="video/mp4" />
                            Your browser does not support the video element.
                          </video>
                        </div>
                      )}
                      
                      <div className={`text-xs mt-1 ${
                        msg.sender === 'vendeur' ? 'text-orange-100' : 'text-[#535455]/60'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.sender === 'vendeur' && (
                          <span className="ml-2">
                            {msg.status === 'sent' && '✓'}
                            {msg.status === 'delivered' && '✓✓'}
                            {msg.status === 'read' && '✓✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>
            </div>

            {/* Message Input Area Vendeur */}
            <div className="bg-white/95 backdrop-blur-sm border-t border-[#535455]/20 p-3 shadow-lg">
              <div className="flex items-center space-x-2">
                <button 
                  className="p-2 hover:bg-[#ff6600]/10 rounded-full transition-colors"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Ajouter un emoji"
                >
                  <Smile className="w-5 h-5 text-[#535455]" />
                </button>
                <button 
                  className="p-2 hover:bg-[#ff6600]/10 rounded-full transition-colors"
                  onClick={() => setShowQuickReplies(true)}
                  title="Réponses rapides"
                >
                  <MessageSquare className="w-5 h-5 text-[#535455]" />
                </button>
                <button 
                  className="p-2 hover:bg-[#ff6600]/10 rounded-full transition-colors"
                  onClick={handleFileAttachment}
                  title="Joindre un fichier"
                >
                  <Paperclip className="w-5 h-5 text-[#535455]" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                />
                <div className="flex-1">
                  <textarea
                    ref={messageInputRef}
                    placeholder="Tapez votre réponse au client..."
                    className="w-full px-3 py-2 border border-[#535455]/30 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all"
                    rows={1}
                    onKeyPress={handleMessageSend}
                  />
                </div>
                {isRecording ? (
                  <div className="flex items-center space-x-2">
                    {/* Bouton Pause/Reprise */}
                    <button
                      onClick={toggleRecordingPause}
                      className={`p-2 rounded-full transition-colors ${
                        recordingPaused 
                          ? 'bg-yellow-500 hover:bg-yellow-600' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                      title={recordingPaused ? "Reprendre l'enregistrement" : "Mettre en pause"}
                    >
                      <span className="text-white text-sm">
                        {recordingPaused ? '▶️' : '⏸️'}
                      </span>
                    </button>
                    
                    {/* Bouton Arrêter */}
                    <button
                      onClick={stopRecording}
                      className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                      title="Arrêter l'enregistrement"
                    >
                      <Square className="w-4 h-4 text-white" />
                    </button>
                    
                    {/* Indicateur de temps et volume */}
                    <div className="flex items-center space-x-2 px-3 py-1 bg-[#ff6600]/10 rounded-lg border border-[#ff6600]/20">
                      <span className="text-xs text-[#ff6600] font-medium">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                      </span>
                      <div className="w-2 h-2 rounded-full bg-[#ff6600] animate-pulse"></div>
                    </div>
                  </div>
                ) : (
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault()
                      void startRecording()
                    }}
                    className="p-2 hover:bg-[#ff6600]/10 rounded-full transition-colors"
                    title="Enregistrer un message vocal"
                  >
                    <Mic className="w-5 h-5 text-[#535455]" />
                  </button>
                )}
                <button
                  onClick={() => handleMessageSend()}
                  className="p-2 bg-[#ff6600] hover:bg-[#ff6600]/90 rounded-full transition-all shadow-lg"
                  title="Envoyer le message"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
              
              {/* Visualisation de l'enregistrement vocal */}
              {isRecording && (
                <div className="mt-3 p-4 bg-gradient-to-r from-[#ff6600]/10 to-[#ff6600]/5 rounded-xl border border-[#ff6600]/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-[#ff6600] rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-[#ff6600]">
                        Enregistrement en cours...
                      </span>
                      {recordingPaused && (
                        <span className="text-xs text-[#535455] bg-yellow-100 px-2 py-1 rounded-full">
                          ⏸️ En pause
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#535455]/70">
                      {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  
                  {/* Forme d'onde */}
                  <div className="flex items-end justify-center space-x-1 h-12">
                    {recordingWaveform.length > 0 ? (
                      recordingWaveform.map((value, index) => (
                        <div
                          key={`waveform-${index}`}
                          className="w-1 bg-[#ff6600] rounded-full transition-all duration-100"
                          style={{
                            height: `${Math.max(2, value * 40)}px`,
                            opacity: 0.3 + (value * 0.7)
                          }}
                        />
                      ))
                    ) : (
                      // Placeholder quand pas encore de données
                      Array.from({ length: 20 }).map((_, index) => (
                        <div
                          key={`placeholder-${index}`}
                          className="w-1 bg-[#ff6600]/30 rounded-full"
                          style={{
                            height: `${Math.random() * 20 + 2}px`
                          }}
                        />
                      ))
                    )}
                  </div>
                  
                  {/* Indicateur de volume */}
                  <div className="mt-2 flex items-center justify-center space-x-2">
                    <span className="text-xs text-[#535455]/70">Volume:</span>
                    <div className="w-20 h-2 bg-[#535455]/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#ff6600] to-[#ff6600]/80 transition-all duration-200"
                        style={{ width: `${(recordingVolume / 255) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#535455]/70">
                      {Math.round((recordingVolume / 255) * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-[#535455]/20 shadow-lg">
                  <div className="grid grid-cols-6 gap-2">
                    {emojis.map((emoji, index) => (
                      <button
                        key={`emoji-${index}-${emoji}`}
                        onClick={() => addEmoji(emoji)}
                        className="p-2 hover:bg-[#ff6600]/10 rounded-lg transition-colors text-2xl"
                        title={`Ajouter ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-center">
                    <button
                      onClick={() => setShowEmojiPicker(false)}
                      className="text-xs text-[#535455]/60 hover:text-[#535455]"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Welcome Screen Vendeur */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-[#ff6600] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white text-4xl font-bold">V</span>
              </div>
              <h1 className="text-2xl font-bold text-[#535455] mb-2">
                Bienvenue sur votre chat vendeur
              </h1>
              <p className="text-[#535455]/80 mb-6">
                Sélectionnez une conversation client pour commencer à répondre
              </p>
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg max-w-md mx-auto border border-[#535455]/20">
                <h3 className="font-semibold text-[#535455] mb-3">Fonctionnalités vendeur :</h3>
                <ul className="text-sm text-[#535455]/80 space-y-2">
                  <li>• Réponses rapides et professionnelles</li>
                  <li>• Gestion des priorités client</li>
                  <li>• Suivi des commandes et intérêts</li>
                  <li>• Interface moderne et intuitive</li>
                  <li>• Support multi-format (texte, vocal, fichiers)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Replies Modal */}
      {showQuickReplies && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl border border-[#535455]/20 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#535455]">Réponses rapides</h2>
              <button
                onClick={() => setShowAddQuickReply(true)}
                className="p-2 bg-[#ff6600] hover:bg-[#ff6600]/90 text-white rounded-full transition-all"
                title="Ajouter une réponse rapide"
              >
                +
              </button>
            </div>
            
            <div className="space-y-3">
              {quickReplies.map((reply, index) => (
                <div key={`quick-reply-${index}-${reply.substring(0, 10)}`} className="group relative">
                  <button
                    onClick={() => useQuickReply(reply)}
                    className="w-full text-left p-4 hover:bg-[#ff6600]/5 rounded-xl transition-all border border-[#535455]/20 hover:border-[#ff6600]/30 hover:shadow-md"
                  >
                    <p className="text-sm text-[#535455] leading-relaxed">{reply}</p>
                  </button>
                  <button
                    onClick={() => manageQuickReply('remove', index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all text-xs"
                    title="Supprimer cette réponse"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-[#535455]/20">
              <button
                onClick={() => setShowQuickReplies(false)}
                className="w-full px-4 py-3 bg-[#ff6600] text-white rounded-xl hover:bg-[#ff6600]/90 transition-all font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Quick Reply Modal */}
      {showAddQuickReply && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl border border-[#535455]/20">
            <h2 className="text-xl font-bold mb-4 text-[#535455]">Ajouter une réponse rapide</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#535455] mb-2">
                Nouvelle réponse rapide
              </label>
              <textarea
                value={newQuickReply}
                onChange={(e) => setNewQuickReply(e.target.value)}
                placeholder="Tapez votre réponse rapide..."
                className="w-full p-3 border border-[#535455]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all resize-none"
                rows={3}
              />
            </div>
            
            <div className="mb-4 p-3 bg-[#ff6600]/5 rounded-lg border border-[#ff6600]/20">
              <p className="text-xs text-[#ff6600] font-medium mb-2">💡 Conseils :</p>
              <ul className="text-xs text-[#ff6600]/80 space-y-1">
                <li>• Incluez les prix en F CFA et points</li>
                <li>• Soyez professionnel et concis</li>
                <li>• Ajoutez des informations utiles</li>
              </ul>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddQuickReply(false)}
                className="flex-1 px-4 py-3 border border-[#535455]/30 text-[#535455] rounded-xl hover:bg-[#535455]/5 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => manageQuickReply('add')}
                className="flex-1 px-4 py-3 bg-[#ff6600] text-white rounded-xl hover:bg-[#ff6600]/90 transition-all font-medium"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Three Dots Menu Modal */}
      {showThreeDotsMenu && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-2xl border border-[#535455]/20">
            <h2 className="text-xl font-bold mb-4 text-[#535455]">Actions vendeur</h2>
            <div className="space-y-2">
              <button 
                className="w-full text-left px-4 py-2 hover:bg-[#ff6600]/5 rounded-lg transition-all"
                onClick={togglePinConversation}
              >
                📌 {selectedConversation?.isPinned ? 'Dépinner' : 'Épingler'} la conversation
              </button>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-[#ff6600]/5 rounded-lg transition-all"
                onClick={toggleArchiveConversation}
              >
                📁 {selectedConversation?.isArchived ? 'Désarchiver' : 'Archiver'} la conversation
              </button>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-[#ff6600]/5 rounded-lg transition-all"
                onClick={toggleNotifications}
              >
                🔇 {selectedConversation?.isMuted ? 'Réactiver' : 'Désactiver'} les notifications
              </button>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-[#ff6600]/5 rounded-lg transition-all"
                onClick={viewClientHistory}
              >
                📊 Voir l'historique client
              </button>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-[#ff6600]/5 rounded-lg transition-all"
                onClick={deleteConversation}
              >
                🗑️ Supprimer la conversation
              </button>
              
              <div className="border-t border-[#535455]/20 my-2"></div>
              
              <button 
                className="w-full text-left px-4 py-2 hover:bg-[#ff6600]/5 rounded-lg transition-all"
                onClick={forceSync}
              >
                🔄 Forcer la synchronisation
              </button>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-[#ff6600]/5 rounded-lg transition-all"
                onClick={startAutoSync}
              >
                ⚡ Activer la synchronisation automatique
              </button>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-[#ff6600]/5 rounded-lg transition-all"
                onClick={stopAutoSync}
              >
                ⏹️ Arrêter la synchronisation automatique
              </button>
            </div>
            <button
              onClick={() => setShowThreeDotsMenu(false)}
              className="mt-6 w-full px-4 py-2 bg-[#ff6600] text-white rounded-lg hover:bg-[#ff6600]/90 transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal Paramètres */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[600px] max-h-[80vh] overflow-y-auto shadow-2xl border border-[#535455]/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#535455]">Paramètres du Vendeur</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-[#535455]/10 rounded-full transition-colors"
              >
                <span className="text-xl text-[#535455]">✕</span>
              </button>
            </div>

            {/* Statistiques */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#535455] mb-4 flex items-center">
                📊 Statistiques du tableau de bord
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-[#ff6600]/10 to-[#ff6600]/5 p-4 rounded-xl border border-[#ff6600]/20">
                  <div className="text-2xl font-bold text-[#ff6600]">{conversations.length}</div>
                  <div className="text-sm text-[#535455]/80">Total conversations</div>
                </div>
                <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 p-4 rounded-xl border border-green-500/20">
                  <div className="text-2xl font-bold text-green-600">{conversations.filter(c => c.isOnline).length}</div>
                  <div className="text-sm text-[#535455]/80">Clients en ligne</div>
                </div>
                <div className="bg-gradient-to-r from-red-500/10 to-red-500/5 p-4 rounded-xl border border-red-500/20">
                  <div className="text-2xl font-bold text-red-600">{conversations.reduce((sum, c) => sum + c.unreadCount, 0)}</div>
                  <div className="text-sm text-[#535455]/80">Messages non lus</div>
                </div>
                <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 p-4 rounded-xl border border-yellow-500/20">
                  <div className="text-2xl font-bold text-yellow-600">{conversations.filter(c => c.isPinned).length}</div>
                  <div className="text-sm text-[#535455]/80">Conversations épinglées</div>
                </div>
              </div>
            </div>

            {/* Paramètres généraux */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#535455] mb-4 flex items-center">
                ⚙️ Paramètres généraux
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#535455]/5 rounded-xl">
                  <div>
                    <div className="font-medium text-[#535455]">Notifications push</div>
                    <div className="text-sm text-[#535455]/70">Recevoir des notifications en temps réel</div>
                  </div>
                  <button className="w-12 h-6 bg-[#ff6600] rounded-full p-1 transition-colors">
                    <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#535455]/5 rounded-xl">
                  <div>
                    <div className="font-medium text-[#535455]">Son des notifications</div>
                    <div className="text-sm text-[#535455]/70">Son pour les nouveaux messages</div>
                  </div>
                  <button className="w-12 h-6 bg-gray-300 rounded-full p-1 transition-colors">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#535455]/5 rounded-xl">
                  <div>
                    <div className="font-medium text-[#535455]">Mode sombre</div>
                    <div className="text-sm text-[#535455]/70">Interface en mode sombre</div>
                  </div>
                  <button className="w-12 h-6 bg-gray-300 rounded-full p-1 transition-colors">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Profil vendeur */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#535455] mb-4 flex items-center">
                👤 Profil vendeur
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#535455] mb-2">Nom du vendeur</label>
                  <input
                    type="text"
                    defaultValue="Vendeur Pro"
                    className="w-full p-3 border border-[#535455]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#535455] mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue="vendeur@marketplace.com"
                    className="w-full p-3 border border-[#535455]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#535455] mb-2">Message d'accueil</label>
                  <textarea
                    defaultValue="Bonjour ! Je suis là pour vous aider avec vos achats."
                    className="w-full p-3 border border-[#535455]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-[#535455]/20">
              <button
                onClick={() => setShowSettings(false)}
                className="px-6 py-3 border border-[#535455]/30 text-[#535455] rounded-xl hover:bg-[#535455]/5 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  addNotification('Paramètres sauvegardés avec succès', 'success');
                  setShowSettings(false);
                }}
                className="px-6 py-3 bg-[#ff6600] text-white rounded-xl hover:bg-[#ff6600]/90 transition-all font-medium"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de Recherche Moderne */}
      {showSearchOverlay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-start justify-center z-50 pt-20">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 w-full max-w-2xl mx-4 shadow-2xl border border-[#ff6600]/20 transform transition-all duration-300 ease-out">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#535455] flex items-center">
                🔍 Recherche dans la conversation
              </h2>
              <button
                onClick={() => {
                  setShowSearchOverlay(false);
                  setSearchQuery('');
                }}
                className="p-3 hover:bg-[#535455]/10 rounded-full transition-colors"
                title="Fermer la recherche"
              >
                <span className="text-2xl text-[#535455]">✕</span>
              </button>
            </div>

            {selectedConversation && (
              <div className="mb-6 p-4 bg-gradient-to-r from-[#ff6600]/10 to-[#ff6600]/5 rounded-2xl border border-[#ff6600]/20">
                <div className="flex items-center space-x-3">
                  {selectedConversation.clientAvatar ? (
                    <img
                      src={selectedConversation.clientAvatar}
                      alt={selectedConversation.clientName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-[#ff6600]/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6600] to-[#ff6600]/80 flex items-center justify-center ring-2 ring-[#ff6600]/30">
                      <span className="text-white font-bold text-base">
                        {selectedConversation.clientName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-[#535455]">{selectedConversation.clientName}</h3>
                    <p className="text-sm text-[#535455]/70">Recherche dans cette conversation</p>
                  </div>
                </div>
              </div>
            )}

            <div className="relative mb-6">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-[#535455] group-focus-within:text-[#ff6600] transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Tapez votre recherche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch('perform');
                    }
                  }}
                  className="w-full pl-16 pr-6 py-5 bg-gradient-to-r from-[#535455]/5 to-[#ff6600]/5 border-2 border-[#535455]/20 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#ff6600]/30 focus:border-[#ff6600] hover:border-[#ff6600]/50 transition-all duration-300 placeholder-[#535455]/60 font-medium text-lg"
                  autoFocus
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff6600]/10 via-transparent to-[#ff6600]/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-[#535455] mb-2 block w-full">💡 Suggestions de recherche :</span>
                {['prix', 'livraison', 'commande', 'produit', 'merci', 'bonjour'].map((suggestion, index) => (
                  <button
                    key={`suggestion-${index}-${suggestion}`}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      handleSearch('perform');
                    }}
                    className="px-4 py-2 bg-[#ff6600]/10 hover:bg-[#ff6600]/20 text-[#ff6600] rounded-full text-sm font-medium transition-all duration-200 border border-[#ff6600]/30 hover:border-[#ff6600]/50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-[#535455]/70">
                <span className="flex items-center">
                  📝 {messages.length} message(s) au total dans cette conversation
                </span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowSearchOverlay(false);
                    setSearchQuery('');
                  }}
                  className="px-6 py-3 border-2 border-[#535455]/30 text-[#535455] rounded-xl hover:bg-[#535455]/5 hover:border-[#535455]/50 transition-all duration-200 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleSearch('perform')}
                  disabled={!searchQuery.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-[#ff6600] to-[#ff6600]/90 text-white rounded-xl hover:from-[#ff6600]/90 hover:to-[#ff6600] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  🔍 Rechercher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transfert */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[500px] max-h-[80vh] overflow-y-auto shadow-2xl border border-[#535455]/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#535455] flex items-center">
                ➡️ Transférer {selectedMessages.size} message(s)
              </h2>
              <button
                onClick={() => handleTransfer('cancel')}
                className="p-2 hover:bg-[#535455]/10 rounded-full transition-colors"
                title="Fermer"
              >
                <span className="text-xl text-[#535455]">✕</span>
              </button>
            </div>

            {/* Informations sur le transfert */}
            <div className="mb-6 p-4 bg-gradient-to-r from-[#ff6600]/10 to-[#ff6600]/5 rounded-xl border border-[#ff6600]/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#ff6600] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#535455]">
                    Transfert depuis : <span className="text-[#ff6600]">{selectedConversation?.clientName}</span>
                  </p>
                  <p className="text-xs text-[#535455]/70">
                    {selectedMessages.size} message(s) sélectionné(s)
                  </p>
                </div>
              </div>
            </div>

            {/* Barre de recherche des destinataires */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#535455]" />
                <input
                  type="text"
                  placeholder="Rechercher des destinataires..."
                  value={transferSearchTerm}
                  onChange={(e) => setTransferSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#535455]/10 border border-[#535455]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Actions de sélection rapide */}
            <div className="mb-4 flex space-x-2">
              <button
                onClick={() => toggleAllDestinations(true)}
                className="px-3 py-2 text-xs bg-[#ff6600]/20 text-[#ff6600] rounded-lg hover:bg-[#ff6600]/30 transition-colors border border-[#ff6600]/30"
              >
                Tout sélectionner
              </button>
              <button
                onClick={() => toggleAllDestinations(false)}
                className="px-3 py-2 text-xs bg-[#535455]/20 text-[#535455] rounded-lg hover:bg-[#535455]/30 transition-colors border border-[#ff6600]/30"
              >
                Tout désélectionner
              </button>
            </div>

            {/* Liste des destinataires */}
            <div className="mb-6 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {availableUsers
                  .filter(user => 
                    user.name.toLowerCase().includes(transferSearchTerm.toLowerCase())
                  )
                  .map(user => (
                    <div
                      key={user.id}
                      className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${
                        transferDestinations.has(user.id)
                          ? 'bg-[#ff6600]/10 border-[#ff6600] shadow-md'
                          : 'bg-[#535455]/5 border-[#535455]/20 hover:bg-[#535455]/10'
                      }`}
                      onClick={() => toggleDestinationSelection(user.id)}
                    >
                      <input
                        type="checkbox"
                        checked={transferDestinations.has(user.id)}
                        onChange={() => toggleDestinationSelection(user.id)}
                        className="w-4 h-4 text-[#ff6600] bg-white border-2 border-[#ff6600] rounded focus:ring-[#ff6600] focus:ring-2 cursor-pointer mr-3"
                      />
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-[#535455]/20 mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-[#535455]">{user.name}</p>
                        <p className="text-xs text-[#535455]/70">{user.role}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-[#535455]/20">
              <button
                onClick={() => handleTransfer('cancel')}
                className="px-6 py-3 border border-[#535455]/30 text-[#535455] rounded-xl hover:bg-[#535455]/5 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => handleTransfer('confirm')}
                disabled={transferDestinations.size === 0}
                className="px-6 py-3 bg-gradient-to-r from-[#ff6600] to-[#ff6600]/90 text-white rounded-xl hover:from-[#ff6600]/90 hover:to-[#ff6600] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
              >
                Transférer ({transferDestinations.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modernes */}
      <div className="fixed bottom-4 right-4 z-50 space-y-3">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-4 rounded-2xl shadow-2xl border-l-4 transform transition-all duration-300 ease-out ${
              notification.type === 'success' 
                ? 'bg-green-50 border-l-green-500 text-green-800 shadow-green-200/50' :
              notification.type === 'error' 
                ? 'bg-red-50 border-l-red-500 text-red-800 shadow-red-200/50' :
              notification.type === 'warning' 
                ? 'bg-yellow-50 border-l-yellow-500 text-yellow-800 shadow-yellow-200/50' :
              'bg-blue-50 border-l-blue-500 text-blue-800 shadow-blue-200/50'
            } max-w-sm animate-slide-in`}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                notification.type === 'success' ? 'bg-green-500' :
                notification.type === 'error' ? 'bg-red-500' :
                notification.type === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}>
                {notification.type === 'success' && '✓'}
                {notification.type === 'error' && '✕'}
                {notification.type === 'warning' && '⚠'}
                {notification.type === 'info' && 'ℹ'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-relaxed">
                  {notification.message}
                </p>
                <p className="text-xs opacity-70 mt-1">
                  {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 w-5 h-5 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
