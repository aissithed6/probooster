'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Phone, Video, Send, Paperclip, Smile, Mic, Square, ShoppingCart, Bell, Settings, MessageSquare } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-dialog';

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
      clientAvatar: '/avatars/marie.jpg',
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
      clientAvatar: '/avatars/jean.jpg',
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
      clientAvatar: '/avatars/sophie.jpg',
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

  // Fonction pour ajouter des notifications modernes
  const addNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    const notification = { id, message, type, timestamp: new Date() };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-suppression après 5 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Fonction pour supprimer une notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredConversations = conversations.filter(conv =>
    conv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fonction pour gérer les appels vidéo
  const handleVideoCall = () => {
    if (selectedConversation) {
      setIsVideoCall(true);
      addNotification(`Appel vidéo en cours avec ${selectedConversation.clientName}...`, 'info');
      setTimeout(() => {
        setIsVideoCall(false);
        addNotification('Appel vidéo terminé', 'success');
      }, 3000);
    } else {
      addNotification('Sélectionnez d\'abord un client', 'warning');
    }
  };

  // Fonction pour gérer les appels vocaux
  const handleVoiceCall = () => {
    if (selectedConversation) {
      setIsVoiceCall(true);
      addNotification(`Appel vocal en cours avec ${selectedConversation.clientName}...`, 'info');
      setTimeout(() => {
        setIsVoiceCall(false);
        addNotification('Appel vocal terminé', 'success');
      }, 3000);
    } else {
      addNotification('Sélectionnez d\'abord un client', 'warning');
    }
  };

  // Fonction pour rechercher dans la conversation
  const searchInConversation = () => {
    if (selectedConversation) {
      setShowSearchOverlay(true);
    } else {
      addNotification('Sélectionnez d\'abord un client', 'warning');
    }
  };

  // Fonction pour effectuer la recherche
  const performSearch = () => {
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

  // Fonction pour voir l'historique client
  const viewClientHistory = () => {
    if (selectedConversation) {
      const history = `Historique de ${selectedConversation.clientName}:\n\n` +
        `- Total commandes: ${selectedConversation.totalOrders || 0}\n` +
        `- Intérêt produit: ${selectedConversation.productInterest || 'Aucun'}\n` +
        `- Priorité: ${selectedConversation.priority}\n` +
        `- Messages: ${messages.length}\n` +
        `- Dernière activité: ${new Date(selectedConversation.lastMessageTime).toLocaleString()}`;
      addNotification(history, 'info');
      setShowThreeDotsMenu(false);
    }
  };

  // Fonction pour supprimer une conversation
  const deleteConversation = async () => {
    if (selectedConversation) {
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

  // Fonction pour synchroniser les messages avec d'autres points de chat
  const syncMessagesWithOtherPlatforms = async (conversationId: string, newMessage: Message) => {
    try {
      setSyncStatus('syncing');
      
      // IMPORTANT: Synchronisation UNIQUEMENT pour la conversation actuelle
      // Le message n'est envoyé qu'au client spécifique, pas à tous les clients
      const syncData: SyncData = {
        conversationId, // ID de la conversation spécifique
        messages: [newMessage], // Message spécifique à cette conversation
        lastMessageTime: new Date(),
        unreadCount: 1,
        clientStatus: selectedConversation?.isOnline ? 'online' : 'offline',
        syncTimestamp: new Date()
      };

      // Ici, vous enverriez les données à votre API de synchronisation
      // IMPORTANT: L'API doit envoyer le message UNIQUEMENT au client de cette conversation
      // await api.syncMessages(syncData, conversationId); // conversationId spécifique
      
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setSyncStatus('synced');
      setLastSyncTime(new Date());
      addNotification(`Message envoyé et synchronisé avec ${selectedConversation?.clientName}`, 'success');
      
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
      setSyncStatus('error');
      addNotification('Erreur de synchronisation', 'error');
    }
  };

  // Fonction pour récupérer les messages depuis d'autres plateformes
  const fetchMessagesFromOtherPlatforms = async (conversationId: string) => {
    try {
      setSyncStatus('syncing');
      
      // IMPORTANT: Récupération UNIQUEMENT des messages de cette conversation spécifique
      // Pas de récupération de tous les messages de tous les clients
      // const response = await api.getMessages(conversationId); // conversationId spécifique
      
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Ici, vous traiteriez la réponse de l'API
      // IMPORTANT: Vérifier que les messages appartiennent bien à cette conversation
      // const messagesForThisConversation = response.messages.filter(msg => 
      //   msg.conversationId === conversationId
      // );
      // setMessages(prev => [...prev, ...messagesForThisConversation]);
      
      setSyncStatus('synced');
      setLastSyncTime(new Date());
      addNotification(`Messages récupérés pour ${selectedConversation?.clientName}`, 'success');
      
    } catch (error) {
      console.error('Erreur de récupération:', error);
      setSyncStatus('error');
      addNotification('Erreur de récupération des messages', 'error');
    }
  };

  // Fonction pour forcer la synchronisation
  const forceSync = async () => {
    if (!selectedConversation) {
      addNotification('Sélectionnez d\'abord un client', 'warning');
      return;
    }
    
    await fetchMessagesFromOtherPlatforms(selectedConversation.id);
  };

  // Fonction pour démarrer la synchronisation automatique
  const startAutoSync = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
    }
    
    const interval = setInterval(async () => {
      if (selectedConversation) {
        await fetchMessagesFromOtherPlatforms(selectedConversation.id);
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

  // Fonction pour sélectionner tous les messages
  const selectAllMessages = () => {
    const allMessageIds = messages.map(msg => msg.id);
    setSelectedMessages(new Set(allMessageIds));
    setShowMessageActions(true);
  };

  // Fonction pour désélectionner tous les messages
  const deselectAllMessages = () => {
    setSelectedMessages(new Set());
    setShowMessageActions(false);
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

  // Fonction pour marquer les messages comme lus
  const markSelectedMessagesAsRead = () => {
    if (selectedMessages.size === 0) return;
    
    setMessages(prev => prev.map(msg => 
      selectedMessages.has(msg.id) ? { ...msg, status: 'read' } : msg
    ));
    addNotification(`${selectedMessages.size} message(s) marqué(s) comme lus`, 'success');
  };

  // Fonction pour marquer les messages comme non lus
  const markSelectedMessagesAsUnread = () => {
    if (selectedMessages.size === 0) return;
    
    setMessages(prev => prev.map(msg => 
      selectedMessages.has(msg.id) ? { ...msg, status: 'sent' } : msg
    ));
    addNotification(`${selectedMessages.size} message(s) marqué(s) comme non lus`, 'success');
  };

  // Fonction pour copier les messages sélectionnés
  const copySelectedMessages = () => {
    if (selectedMessages.size === 0) return;
    
    const selectedMessagesList = messages.filter(msg => selectedMessages.has(msg.id));
    const textToCopy = selectedMessagesList.map(msg => 
      `[${msg.sender === 'vendeur' ? 'Vendeur' : 'Client'}] ${msg.content}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      addNotification(`${selectedMessages.size} message(s) copié(s) dans le presse-papiers`, 'success');
    }).catch(() => {
      addNotification('Erreur lors de la copie', 'error');
    });
  };

  // Fonction pour sauvegarder les messages sélectionnés
  const saveSelectedMessages = () => {
    if (selectedMessages.size === 0) return;
    
    const selectedMessagesList = messages.filter(msg => selectedMessages.has(msg.id));
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
  };

  // Fonction pour transférer les messages sélectionnés
  const transferSelectedMessages = () => {
    if (selectedMessages.size === 0) return;
    
    // Ouvrir le modal de transfert
    setShowTransferModal(true);
    setTransferDestinations(new Set());
    setTransferSearchTerm('');
  };

  // Fonction pour confirmer le transfert
  const confirmTransfer = () => {
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

    // Ici vous enverriez les données à votre API de transfert
    // await api.transferMessages(transferData);
    
    // Simulation du transfert
    addNotification(`${selectedMessages.size} message(s) transféré(s) vers ${transferDestinations.size} destinataire(s)`, 'success');
    console.log('Transfert effectué:', transferData);
    
    // Fermer le modal et réinitialiser
    setShowTransferModal(false);
    setTransferDestinations(new Set());
    setTransferSearchTerm('');
    
    // Optionnel : sortir du mode sélection
    // setIsSelectionMode(false);
    // setSelectedMessages(new Set());
    // setShowMessageActions(false);
  };

  // Fonction pour annuler le transfert
  const cancelTransfer = () => {
    setShowTransferModal(false);
    setTransferDestinations(new Set());
    setTransferSearchTerm('');
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

  // Fonction pour sélectionner tous les destinataires
  const selectAllDestinations = () => {
    const allUserIds = availableUsers.map(user => user.id);
    setTransferDestinations(new Set(allUserIds));
  };

  // Fonction pour désélectionner tous les destinataires
  const deselectAllDestinations = () => {
    setTransferDestinations(new Set());
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
      conversationId: selectedConversation.id, // ID spécifique de cette conversation
      messageHash: btoa(`vendeur-${Date.now()}-${Math.random()}`).slice(0, 16),
      ...fileData
    };

    // Validation de la confidentialité
    if (!validateMessagePrivacy(newMessage, selectedConversation.id)) {
      return;
    }

    // Ajouter le message UNIQUEMENT à cette conversation
    setMessages(prev => [...prev, newMessage]);
    
    // Confirmation de confidentialité
    addNotification(`Message privé envoyé à ${selectedConversation.clientName} uniquement`, 'success');

    // Synchroniser UNIQUEMENT avec le client de cette conversation
    syncMessagesWithOtherPlatforms(selectedConversation.id, newMessage);

    // Simulation de réponse client (UNIQUEMENT pour cette conversation)
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
            conversationId: selectedConversation.id, // Même conversation
            messageHash: btoa(`client-${Date.now()}-${Math.random()}`).slice(0, 16)
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

  // Fonction pour ajouter une nouvelle réponse rapide
  const addQuickReply = () => {
    if (newQuickReply.trim()) {
      const updatedQuickReplies = [...quickReplies, newQuickReply.trim()];
      // Ici vous pourriez sauvegarder dans une base de données
      addNotification('Réponse rapide ajoutée avec succès', 'success');
      setNewQuickReply('');
      setShowAddQuickReply(false);
    } else {
      addNotification('Veuillez saisir une réponse rapide', 'warning');
    }
  };

  // Fonction pour supprimer une réponse rapide
  const removeQuickReply = async (index: number) => {
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
  };

  // Ancienne fonction sendMessage remplacée par sendSecureMessage pour la sécurité
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const messageData = {
          fileName: 'Message vocal',
          fileSize: audioBlob.size,
          fileType: 'audio/webm',
          fileUrl: audioUrl,
          duration: recordingTime
        };

        sendMessage('🎤 Message vocal', 'voice', messageData);
        setAudioChunks([]);
      };

      recorder.onerror = (event) => {
        console.error('Erreur d\'enregistrement:', event);
        setIsRecording(false);
        setRecordingTime(0);
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      setRecordingTime(0);

      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      setRecordingTimer(timer);
      recorder.start();
    } catch (error) {
      console.error('Erreur d\'accès au microphone:', error);
      addNotification('Impossible d\'accéder au microphone', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
    }
  };

  const handleSendMessage = () => {
    if (messageInputRef.current && messageInputRef.current.value.trim()) {
      sendMessage(messageInputRef.current.value.trim());
      messageInputRef.current.value = '';
    }
  };

  const validateAndSendMessage = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
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
      fetchMessagesFromOtherPlatforms(selectedConversation.id);
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
                <img
                  src={conv.clientAvatar}
                  alt={conv.clientName}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#535455]/20"
                />
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
                  <img
                    src={selectedConversation.clientAvatar}
                    alt={selectedConversation.clientName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[#535455]/20"
                  />
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
                onClick={handleVideoCall}
                title="Appel vidéo"
              >
                <Video className="w-5 h-5 text-[#535455]" />
              </button>
              <button 
                className="p-2 hover:bg-[#535455]/10 rounded-full transition-colors"
                onClick={handleVoiceCall}
                title="Appel vocal"
              >
                <Phone className="w-5 h-5 text-[#535455]" />
              </button>
              <button 
                className="p-2 hover:bg-[#535455]/10 rounded-full transition-colors"
                onClick={searchInConversation}
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
                        onClick={selectAllMessages}
                        className="px-3 py-1 text-xs bg-[#ff6600]/20 text-[#ff6600] rounded-lg hover:bg-[#ff6600]/30 transition-colors"
                      >
                        Tout sélectionner
                      </button>
                      <button
                        onClick={deselectAllMessages}
                        className="px-3 py-1 text-xs bg-[#535455]/20 text-[#535455] rounded-lg hover:bg-[#535455]/30 transition-colors"
                      >
                        Tout désélectionner
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={markSelectedMessagesAsRead}
                      className="px-3 py-1 text-xs bg-green-500/20 text-green-600 rounded-lg hover:bg-green-500/30 transition-colors"
                      title="Marquer comme lu"
                    >
                      ✓ Lu
                    </button>
                    <button
                      onClick={markSelectedMessagesAsUnread}
                      className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-600 rounded-lg hover:bg-yellow-500/30 transition-colors"
                      title="Marquer comme non lu"
                    >
                      ✗ Non lu
                    </button>
                    <button
                      onClick={copySelectedMessages}
                      className="px-3 py-1 text-xs bg-blue-500/20 text-blue-600 rounded-lg hover:bg-blue-500/30 transition-colors"
                      title="Copier"
                    >
                      📋 Copier
                    </button>
                    <button
                      onClick={saveSelectedMessages}
                      className="px-3 py-1 text-xs bg-purple-500/20 text-purple-600 rounded-lg hover:bg-purple-500/30 transition-colors"
                      title="Sauvegarder"
                    >
                      💾 Sauvegarder
                    </button>
                    <button
                      onClick={transferSelectedMessages}
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
                    onKeyPress={validateAndSendMessage}
                  />
                </div>
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                    title="Arrêter l'enregistrement"
                  >
                    <Square className="w-5 h-5 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="p-2 hover:bg-[#ff6600]/10 rounded-full transition-colors"
                    title="Enregistrer un message vocal"
                  >
                    <Mic className="w-5 h-5 text-[#535455]" />
                  </button>
                )}
                <button
                  onClick={handleSendMessage}
                  className="p-2 bg-[#ff6600] hover:bg-[#ff6600]/90 rounded-full transition-all shadow-lg"
                  title="Envoyer le message"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-[#535455]/20 shadow-lg">
                  <div className="grid grid-cols-6 gap-2">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
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
                Bienvenue sur votre messagerie vendeur
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
                <div key={index} className="group relative">
                  <button
                    onClick={() => useQuickReply(reply)}
                    className="w-full text-left p-4 hover:bg-[#ff6600]/5 rounded-xl transition-all border border-[#535455]/20 hover:border-[#ff6600]/30 hover:shadow-md"
                  >
                    <p className="text-sm text-[#535455] leading-relaxed">{reply}</p>
                  </button>
                  <button
                    onClick={() => removeQuickReply(index)}
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
                onClick={addQuickReply}
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
                  <img
                    src={selectedConversation.clientAvatar}
                    alt={selectedConversation.clientName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[#ff6600]/30"
                  />
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
                      performSearch();
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
                    key={index}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      performSearch();
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
                  onClick={performSearch}
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
                onClick={cancelTransfer}
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
                onClick={selectAllDestinations}
                className="px-3 py-2 text-xs bg-[#ff6600]/20 text-[#ff6600] rounded-lg hover:bg-[#ff6600]/30 transition-colors border border-[#ff6600]/30"
              >
                Tout sélectionner
              </button>
              <button
                onClick={deselectAllDestinations}
                className="px-3 py-2 text-xs bg-[#535455]/20 text-[#535455] rounded-lg hover:bg-[#535455]/30 transition-colors border border-[#535455]/30"
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
                onClick={cancelTransfer}
                className="px-6 py-3 border border-[#535455]/30 text-[#535455] rounded-xl hover:bg-[#535455]/5 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={confirmTransfer}
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
