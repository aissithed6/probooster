import { getClientAccessTokenSafe, supabase } from '../supabase'

/**
 * Service de messagerie interne pour la communication Admin ↔ Vendeurs/Clients
 * Synchronisé avec Supabase en temps réel
 */

export interface InternalMessage {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  content: string
  type: 'internal' | 'support'
  is_read: boolean
  is_important?: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  category: 'support' | 'technical' | 'billing' | 'general' | 'account'
  status: 'active' | 'archived' | 'deleted'
  parent_message_id: string | null
  created_at: string
  updated_at: string
}

export interface MessageParticipant {
  id: string
  name: string
  email: string
  role: 'client' | 'vendor' | 'admin' | 'super_admin'
  avatar_url?: string
}

export class InternalMessagingService {
  private static adminRecipientCache: { recipientId: string; fetchedAt: number } | null = null
  private static adminRecipientsCache:
    | { recipientId: string; adminId: string | null; superAdminId: string | null; fetchedAt: number }
    | null = null

  /** Normalise une erreur Supabase/Postgrest pour éviter les logs `{}` et faciliter le debug. */
  private static formatSupabaseError(error: unknown) {
    if (!error) return { raw: error }
    if (error instanceof Error) {
      const anyErr = error as any
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: anyErr?.code,
        details: anyErr?.details,
        hint: anyErr?.hint,
        raw: anyErr
      }
    }

    const anyErr = error as any
    return {
      message: typeof anyErr?.message === 'string' ? anyErr.message : String(anyErr),
      code: anyErr?.code,
      details: anyErr?.details,
      hint: anyErr?.hint,
      raw: anyErr
    }
  }

  /**
   * Récupère l'identifiant du destinataire admin (super_admin prioritaire).
   * Objectif: éviter le hardcode `admin-id` dans les dashboards.
   */
  static async getAdminRecipientId(forceRefresh = false): Promise<string | null> {
    const now = Date.now()
    const ttlMs = 5 * 60 * 1000

    if (!forceRefresh && this.adminRecipientCache && now - this.adminRecipientCache.fetchedAt < ttlMs) {
      return this.adminRecipientCache.recipientId
    }

    try {
      const recipients = await this.getAdminRecipients(forceRefresh)
      const recipientId = String(recipients?.recipientId ?? '').trim()
      if (!recipientId) return null

      this.adminRecipientCache = { recipientId, fetchedAt: now }
      return recipientId
    } catch (error) {
      console.warn("Impossible de récupérer l'adminRecipientId:", error)
      return null
    }
  }

  /**
   * Récupère les IDs de l'équipe admin (admin + super_admin si disponibles).
   */
  static async getAdminRecipients(
    forceRefresh = false
  ): Promise<{ recipientId: string; adminId: string | null; superAdminId: string | null } | null> {
    const now = Date.now()
    const ttlMs = 5 * 60 * 1000

    if (!forceRefresh && this.adminRecipientsCache && now - this.adminRecipientsCache.fetchedAt < ttlMs) {
      const { recipientId, adminId, superAdminId } = this.adminRecipientsCache
      return { recipientId, adminId, superAdminId }
    }

    try {
      const response = await fetch('/api/internal-messaging/admin-recipient', {
        method: 'GET',
        credentials: 'include',
        headers: await InternalMessagingService.buildAuthHeaders()
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Récupération des destinataires admin échouée.')
      }

      const recipientId = String(payload?.data?.recipientId ?? '').trim()
      const adminIdRaw = String(payload?.data?.adminId ?? '').trim()
      const superAdminIdRaw = String(payload?.data?.superAdminId ?? '').trim()

      if (!recipientId) return null

      const adminId = adminIdRaw ? adminIdRaw : null
      const superAdminId = superAdminIdRaw ? superAdminIdRaw : null

      this.adminRecipientsCache = { recipientId, adminId, superAdminId, fetchedAt: now }
      return { recipientId, adminId, superAdminId }
    } catch (error) {
      console.warn("Impossible de récupérer les adminRecipients:", error)
      return null
    }
  }

  /**
   * Récupère tous les messages d'un utilisateur
   */
  static async getUserMessages(userId: string): Promise<InternalMessage[]> {
    try {
      const response = await fetch(`/api/internal-messaging/messages?scope=all&status=active`, {
        method: 'GET',
        credentials: 'include',
        headers: await InternalMessagingService.buildAuthHeaders()
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error ?? 'Chargement des messages échoué.')
      }
      const payload = await response.json()
      return (payload?.data ?? []) as InternalMessage[]
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error)
      return []
    }
  }

  /**
   * Récupère les messages reçus par un utilisateur
   */
  static async getReceivedMessages(userId: string): Promise<InternalMessage[]> {
    try {
      const response = await fetch(`/api/internal-messaging/messages?scope=received&status=active`, {
        method: 'GET',
        credentials: 'include',
        headers: await InternalMessagingService.buildAuthHeaders()
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error ?? 'Chargement des messages reçus échoué.')
      }

      const payload = await response.json()
      return (payload?.data ?? []) as InternalMessage[]
    } catch (error) {
      console.error('Erreur lors de la récupération des messages reçus:', error)
      return []
    }
  }

  /**
   * Récupère les messages envoyés par un utilisateur
   */
  static async getSentMessages(userId: string): Promise<InternalMessage[]> {
    try {
      const response = await fetch(`/api/internal-messaging/messages?scope=sent&status=active`, {
        method: 'GET',
        credentials: 'include',
        headers: await InternalMessagingService.buildAuthHeaders()
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error ?? 'Chargement des messages envoyés échoué.')
      }

      const payload = await response.json()
      return (payload?.data ?? []) as InternalMessage[]
    } catch (error) {
      console.error('Erreur lors de la récupération des messages envoyés:', error)
      return []
    }
  }

  /**
   * Envoie un nouveau message
   */
  static async sendMessage(
    senderId: string,
    recipientId: string,
    subject: string,
    content: string,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'urgent'
      category?: 'support' | 'technical' | 'billing' | 'general' | 'account'
      type?: 'internal' | 'support'
      parentMessageId?: string
    }
  ): Promise<InternalMessage | null> {
    try {
      const response = await fetch('/api/internal-messaging/messages', {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(await InternalMessagingService.buildAuthHeaders()),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId,
          subject,
          content,
          type: options?.type || 'internal',
          priority: options?.priority || 'normal',
          category: options?.category || 'general',
          parentMessageId: options?.parentMessageId || null
        })
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        const err = new Error(payload?.error ?? "Erreur lors de l'envoi du message.")
        console.error('sendMessage: POST /api/internal-messaging/messages failed', {
          senderId,
          recipientId,
          status: response.status,
          payload
        })
        throw err
      }

      const data = payload?.data as InternalMessage | undefined
      if (!data?.id) {
        return null
      }

      return data
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", InternalMessagingService.formatSupabaseError(error))
      throw error instanceof Error ? error : new Error("Erreur lors de l'envoi du message.")
    }
  }

  /**
   * Marque un message comme lu
   */
  static async markAsRead(messageId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/internal-messaging/messages', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          ...(await InternalMessagingService.buildAuthHeaders()),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'mark_read', messageId })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        console.error('markAsRead: PATCH /api/internal-messaging/messages failed', { messageId, status: response.status, payload })
        return false
      }

      return true
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error)
      return false
    }
  }

  /**
   * Marque tous les messages d'un utilisateur comme lus
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/internal-messaging/messages', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          ...(await InternalMessagingService.buildAuthHeaders()),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'mark_all_read' })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        console.error('markAllAsRead: PATCH /api/internal-messaging/messages failed', { userId, status: response.status, payload })
        return false
      }

      return true
    } catch (error) {
      console.error('Erreur lors du marquage de tous les messages comme lus:', error)
      return false
    }
  }

  /**
   * Archive un message
   */
  static async archiveMessage(messageId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/internal-messaging/messages', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          ...(await InternalMessagingService.buildAuthHeaders()),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'update_status', messageId, status: 'archived' })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        console.error('archiveMessage: PATCH /api/internal-messaging/messages failed', { messageId, status: response.status, payload })
        return false
      }

      return true
    } catch (error) {
      console.error('Erreur lors de l\'archivage du message:', error)
      return false
    }
  }

  /**
   * Supprime un message (soft delete)
   */
  static async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/internal-messaging/messages', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          ...(await InternalMessagingService.buildAuthHeaders()),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'update_status', messageId, status: 'deleted' })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        console.error('deleteMessage: PATCH /api/internal-messaging/messages failed', { messageId, status: response.status, payload })
        return false
      }

      return true
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error)
      return false
    }
  }

  /**
   * Bascule l'état "important" d'un message.
   */
  static async toggleImportant(
    messageId: string,
    isImportant?: boolean
  ): Promise<InternalMessage | null> {
    try {
      const response = await fetch('/api/internal-messaging/messages', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          ...(await InternalMessagingService.buildAuthHeaders()),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'toggle_important', messageId, isImportant })
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error ?? "Impossible de marquer le message comme important.")
      }

      const data = payload?.data as InternalMessage | undefined
      return data?.id ? data : null
    } catch (error) {
      console.error('toggleImportant failed:', InternalMessagingService.formatSupabaseError(error))
      return null
    }
  }

  /**
   * Met à jour un message (sujet/contenu/catégorie/priorité). Uniquement l'expéditeur.
   */
  static async updateMessage(input: {
    messageId: string
    subject: string
    content: string
    category?: InternalMessage['category']
    priority?: InternalMessage['priority']
  }): Promise<InternalMessage | null> {
    try {
      const response = await fetch('/api/internal-messaging/messages', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          ...(await InternalMessagingService.buildAuthHeaders()),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update_message',
          messageId: input.messageId,
          subject: input.subject,
          content: input.content,
          category: input.category,
          priority: input.priority
        })
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Impossible de modifier le message.')
      }

      const data = payload?.data as InternalMessage | undefined
      return data?.id ? data : null
    } catch (error) {
      console.error('updateMessage failed:', InternalMessagingService.formatSupabaseError(error))
      return null
    }
  }

  /**
   * Récupère le nombre de messages non lus
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await fetch(`/api/internal-messaging/messages/unread-count`, {
        method: 'GET',
        credentials: 'include',
        headers: await InternalMessagingService.buildAuthHeaders()
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error ?? 'Chargement du compteur échoué.')
      }

      const payload = await response.json()
      return Number(payload?.data ?? 0)
    } catch (error) {
      const details = error instanceof Error ? error.message : error
      console.warn('Erreur lors du comptage des messages non lus:', details)
      return 0
    }
  }

  /**
   * Récupère les informations d'un participant
   */
  static async getParticipantInfo(userId: string): Promise<MessageParticipant | null> {
    try {
      const response = await fetch(`/api/internal-messaging/participants/${encodeURIComponent(userId)}`, {
        method: 'GET',
        credentials: 'include',
        headers: await InternalMessagingService.buildAuthHeaders()
      })

      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.toLowerCase().includes('application/json')
      const payload = isJson ? await response.json().catch(() => ({})) : null
      const rawText = !isJson ? await response.text().catch(() => '') : ''

      if (!response.ok) {
        console.error('getParticipantInfo: API failed', {
          userId,
          status: response.status,
          payload,
          rawText: rawText ? rawText.slice(0, 500) : ''
        })
        return null
      }

      const data = (payload as any)?.data
      if (!data || !data.id) {
        return null
      }

      return {
        id: String(data.id),
        name: String(data.name ?? '').trim(),
        email: String(data.email ?? '').trim(),
        role: data.role as any,
        avatar_url: typeof data.avatar_url === 'string' && data.avatar_url ? data.avatar_url : undefined
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des infos participant:', InternalMessagingService.formatSupabaseError(error))
      return null
    }
  }

  /**
   * Récupère la conversation (thread) d'un message
   */
  static async getMessageThread(messageId: string): Promise<InternalMessage[]> {
    try {
      // Récupérer le message parent
      const { data: message, error: messageError } = await supabase
        .from('user_messages')
        .select('*')
        .eq('id', messageId)
        .single()

      if (messageError) throw messageError

      const rootId = message.parent_message_id || message.id

      // Récupérer tous les messages du thread
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .or(`id.eq.${rootId},parent_message_id.eq.${rootId}`)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération du thread:', error)
      return []
    }
  }

  /**
   * S'abonne aux nouveaux messages d'un utilisateur (temps réel)
   */
  static subscribeToMessages(
    userId: string,
    callback: (message: InternalMessage) => void
  ) {
    const subscription = supabase
      .channel(`user_messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_messages',
          filter: `recipient_id=eq.${userId}`
        },
        (payload: any) => {
          callback(payload.new as InternalMessage)
        }
      )
      .subscribe()

    return subscription
  }

  /**
   * S'abonne aux mises à jour de messages (temps réel)
   */
  static subscribeToMessageUpdates(
    userId: string,
    callback: (message: InternalMessage) => void
  ) {
    const subscription = supabase
      .channel(`user_messages_updates:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_messages',
          filter: `or(sender_id.eq.${userId},recipient_id.eq.${userId})`
        },
        (payload: any) => {
          callback(payload.new as InternalMessage)
        }
      )
      .subscribe()

    return subscription
  }

  /**
   * Se désabonne d'un canal
   */
  static unsubscribe(subscription: any) {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  }

  /**
   * Crée une notification pour un nouveau message
   */
  private static async createNotification(
    userId: string,
    messageId: string,
    subject: string
  ): Promise<void> {
    try {
      await supabase
        .from('user_notifications')
        .insert({
          user_id: userId,
          type: 'message',
          title: 'Nouveau message interne',
          message: subject,
          action_url: `/dashboard?tab=messages&message=${messageId}`,
          priority: 'normal'
        })
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error)
    }
  }

  /**
   * Recherche dans les messages
   */
  static async searchMessages(
    userId: string,
    query: string
  ): Promise<InternalMessage[]> {
    try {
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .or(`subject.ilike.%${query}%,content.ilike.%${query}%`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
      return []
    }
  }

  /**
   * Récupère les messages par catégorie
   */
  static async getMessagesByCategory(
    userId: string,
    category: string
  ): Promise<InternalMessage[]> {
    try {
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .eq('category', category)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération par catégorie:', error)
      return []
    }
  }

  /**
   * Récupère les messages par priorité
   */
  static async getMessagesByPriority(
    userId: string,
    priority: string
  ): Promise<InternalMessage[]> {
    try {
      const { data, error } = await supabase
        .from('user_messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .eq('priority', priority)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération par priorité:', error)
      return []
    }
  }

  /**
   * Construit les en-têtes d'authentification pour les appels API internes.
   */
  private static async buildAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      Accept: 'application/json'
    }

    try {
      const accessToken: string | null = await getClientAccessTokenSafe().catch(() => null)

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }
    } catch (error) {
      console.warn('Impossible de récupérer la session Supabase:', error)
    }

    return headers
  }
}
