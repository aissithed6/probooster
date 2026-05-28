import { getClientAccessTokenSafe, getClientSessionSafe, supabase } from '../supabase'
import type { Database } from '../supabase'

// Types pour le chat
export interface ChatSession {
  id: string
  participant1_id: string
  participant2_id: string
  last_message_at: string
  is_active: boolean
  created_at: string
}

export interface ChatMessage {
  id: string
  chat_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'file' | 'system'
  is_read: boolean
  created_at: string
}

export interface ChatParticipant {
  id: string
  name: string
  avatar_url?: string
  role: 'client' | 'vendor' | 'admin' | 'super_admin'
}

/**
 * Service de gestion du chat avec synchronisation Supabase
 * Permet la communication en temps réel entre clients et vendeurs
 */
export class ChatService {
  private static chatSessionErrorLogKeys = new Set<string>()
  private static participantCache = new Map<string, { value: ChatParticipant | null; ts: number }>()
  private static participantInFlight = new Map<string, Promise<ChatParticipant | null>>()
  private static accessTokenCache: { token: string; ts: number } | null = null
  private static ACCESS_TOKEN_TTL_MS = 30_000
  private static PARTICIPANT_TTL_MS = 5 * 60_000

  /**
   * Retourne un accessToken Supabase (cache court) afin d'éviter les timeouts LockManager
   * lors d'appels concurrents à `supabase.auth.getSession()`.
   */
  private static async getAccessTokenCached(): Promise<string> {
    const now = Date.now()
    if (this.accessTokenCache && now - this.accessTokenCache.ts < this.ACCESS_TOKEN_TTL_MS) {
      return this.accessTokenCache.token
    }

    try {
      const accessToken = String((await getClientAccessTokenSafe()) ?? '').trim()
      this.accessTokenCache = { token: accessToken, ts: now }
      return accessToken
    } catch {
      this.accessTokenCache = { token: '', ts: now }
      return ''
    }
  }

  /**
   * Formate une erreur (souvent Supabase/PostgREST) en chaîne lisible pour les logs.
   */
  private static formatUnknownErrorForLog(error: unknown): string {
    try {
      if (error instanceof Error) {
        return error.message
      }
      if (error && typeof error === 'object') {
        const anyErr = error as any
        const parts = [
          typeof anyErr?.message === 'string' ? anyErr.message : '',
          typeof anyErr?.details === 'string' ? anyErr.details : '',
          typeof anyErr?.hint === 'string' ? anyErr.hint : '',
          typeof anyErr?.code === 'string' ? `code=${anyErr.code}` : ''
        ].filter(Boolean)
        if (parts.length > 0) return parts.join(' | ')

        const json = JSON.stringify(anyErr)
        return json === '{}' ? '[Erreur non sérialisable]' : json
      }
      return String(error)
    } catch {
      return '[Erreur non sérialisable]'
    }
  }

  /**
   * Récupère le dernier message pour une liste de chats (batch) afin d'éviter N requêtes.
   */
  static async getLastMessagesByChatId(
    chatIds: string[]
  ): Promise<Record<string, Pick<ChatMessage, 'id' | 'chat_id' | 'sender_id' | 'content' | 'created_at' | 'is_read'> | null>> {
    const result: Record<string, Pick<ChatMessage, 'id' | 'chat_id' | 'sender_id' | 'content' | 'created_at' | 'is_read'> | null> = {}

    for (const id of chatIds) {
      result[id] = null
    }

    if (chatIds.length === 0) return result

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, chat_id, sender_id, content, created_at, is_read')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false })
        .limit(Math.min(1000, chatIds.length * 3))

      if (error) throw error

      for (const row of (data ?? []) as any[]) {
        const chatId = String(row.chat_id)
        if (!result[chatId]) {
          result[chatId] = {
            id: String(row.id),
            chat_id: chatId,
            sender_id: String(row.sender_id),
            content: String(row.content ?? ''),
            created_at: String(row.created_at ?? ''),
            is_read: Boolean(row.is_read)
          }
        }
      }

      return result
    } catch (error) {
      console.error('Erreur lors de la récupération des derniers messages (batch):', error)
      return result
    }
  }

  /**
   * Récupère ou crée une session de chat entre deux utilisateurs
   */
  static async getOrCreateChatSession(
    userId: string,
    otherUserId: string
  ): Promise<ChatSession | null> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const safeUserId = String(userId ?? '').trim()
    const safeOtherUserId = String(otherUserId ?? '').trim()
    if (!safeUserId || !safeOtherUserId) return null
    if (!UUID_REGEX.test(safeUserId) || !UUID_REGEX.test(safeOtherUserId)) return null
    if (safeUserId === safeOtherUserId) return null

    try {
      const supabaseSession = await getClientSessionSafe()
      const accessToken = supabaseSession?.access_token

      const controller = new AbortController()
      const timeout = setTimeout(() => {
        try {
          controller.abort()
        } catch {
          // ignore
        }
      }, 15000)

      const resp = await fetch('/api/chat/sessions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ otherUserId: safeOtherUserId }),
        signal: controller.signal
      })
        .catch(() => null)
        .finally(() => {
          clearTimeout(timeout)
        })

      if (!resp) {
        return null
      }

      const json = await resp.json().catch(() => null)
      if (!resp.ok) {
        const apiError = typeof json?.error === 'string' && json.error.trim().length > 0 ? json.error : ''
        const details = json && typeof json === 'object' ? JSON.stringify(json) : String(json)
        const msg = apiError || `HTTP ${resp.status} - ${details}`

        // Cas attendus: pas besoin de spammer la console
        if (resp.status === 401 || resp.status === 403) {
          return null
        }
        if (resp.status === 400 && apiError.toLowerCase().includes('destinataire')) {
          return null
        }

        throw new Error(msg)
      }

      const chatSession = json?.data
      if (!chatSession || typeof chatSession?.id !== 'string') {
        throw new Error('Réponse session invalide.')
      }

      return chatSession as ChatSession
    } catch (error) {
      const formatted = ChatService.formatUnknownErrorForLog(error)
      const key = `${safeUserId}:${safeOtherUserId}:${formatted}`

      // Eviter les logs en boucle (ex: ProductModal useEffect, retries, refresh)
      if (!ChatService.chatSessionErrorLogKeys.has(key)) {
        ChatService.chatSessionErrorLogKeys.add(key)
        const raw = error && typeof error === 'object' ? (error as any) : null
        const name = typeof raw?.name === 'string' ? raw.name : error instanceof Error ? error.name : null
        const stack = typeof raw?.stack === 'string' ? raw.stack : error instanceof Error ? error.stack ?? null : null

        console.error('Erreur lors de la récupération/création de la session chat:', {
          formatted: String(formatted ?? ''),
          userId: String(safeUserId ?? ''),
          otherUserId: String(safeOtherUserId ?? ''),
          name,
          message: typeof raw?.message === 'string' ? raw.message : error instanceof Error ? error.message : null,
          code: typeof raw?.code === 'string' ? raw.code : null,
          details: typeof raw?.details === 'string' ? raw.details : null,
          hint: typeof raw?.hint === 'string' ? raw.hint : null,
          stack
        })
      }
      return null
    }
  }

  /**
   * Récupère toutes les sessions de chat d'un utilisateur
   */
  static async getUserChatSessions(userId: string): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('user_chats')
        .select('*')
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des sessions chat:', error)
      return []
    }
  }

  /**
   * Récupère les messages d'une session de chat
   */
  static async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error)
      return []
    }
  }

  /**
   * Envoie un message dans une session de chat
   */
  static async sendMessage(
    chatId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'system' = 'text'
  ): Promise<ChatMessage | null> {
    // Insérer le message
    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content,
        message_type: messageType,
        is_read: false
      })
      .select()
      .single()

    if (messageError) {
      throw messageError
    }

    // Mettre à jour la date du dernier message dans la session
    const { error: updateError } = await supabase
      .from('user_chats')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', chatId)

    if (updateError) {
      throw updateError
    }

    return message
  }

  /**
   * Upload un fichier vers Supabase Storage.
   */
  static async uploadFileToStorage(
    bucket: string,
    path: string,
    file: File
  ): Promise<{ error: unknown | null }> {
    try {
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: false,
        contentType: file.type || undefined
      })
      return { error: error ?? null }
    } catch (error) {
      return { error }
    }
  }

  /**
   * Retourne une URL publique (si le bucket est public) à partir d'un chemin.
   */
  static getPublicUrlFromStorage(bucket: string, path: string): string {
    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      return String(data?.publicUrl ?? '')
    } catch {
      return ''
    }
  }

  /**
   * Marque les messages comme lus
   */
  static async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .eq('is_read', false)
    } catch (error) {
      console.error('Erreur lors du marquage des messages comme lus:', error)
    }
  }

  /**
   * Récupère les informations d'un participant
   */
  static async getParticipantInfo(userId: string): Promise<ChatParticipant | null> {
    const uid = String(userId ?? '').trim()
    if (!uid) return null

    const now = Date.now()
    const cached = this.participantCache.get(uid)
    if (cached && now - cached.ts < this.PARTICIPANT_TTL_MS) {
      return cached.value
    }

    const existingPromise = this.participantInFlight.get(uid)
    if (existingPromise) return existingPromise

    const promise = (async () => {
      try {
        const accessToken = await this.getAccessTokenCached()

        const resp = await fetch(`/api/chat/participants?userId=${encodeURIComponent(uid)}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          }
        }).catch(() => null)

        if (!resp) {
          throw new Error('fetch(/api/chat/participants) a échoué.')
        }

        const json = await resp.json().catch(() => null)
        if (!resp.ok) {
          const apiError = typeof json?.error === 'string' && json.error.trim().length > 0 ? json.error : ''
          const details = json && typeof json === 'object' ? JSON.stringify(json) : String(json)
          const msg = apiError || `HTTP ${resp.status} - ${details}`
          throw new Error(msg)
        }

        const row = json?.data
        if (!row || typeof row?.id !== 'string') {
          throw new Error('Réponse participant invalide.')
        }

        const role = (String(row?.role ?? 'client') as ChatParticipant['role']) ?? 'client'
        const value: ChatParticipant = {
          id: String(row.id),
          name: String(row.name ?? 'Utilisateur'),
          avatar_url: typeof row.avatar_url === 'string' && row.avatar_url.length > 0 ? row.avatar_url : undefined,
          role
        }

        this.participantCache.set(uid, { value, ts: Date.now() })
        return value
      } catch (error) {
        console.error('Erreur lors de la récupération des infos participant:', error)
        this.participantCache.set(uid, { value: null, ts: Date.now() })
        return null
      } finally {
        this.participantInFlight.delete(uid)
      }
    })()

    this.participantInFlight.set(uid, promise)
    return promise
  }

  /**
   * S'abonne aux nouveaux messages d'une session de chat (temps réel)
   */
  static subscribeToMessages(
    chatId: string,
    callback: (message: ChatMessage) => void
  ) {
    const subscription = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          callback(payload.new as ChatMessage)
        }
      )
      .subscribe()

    return subscription
  }

  /**
   * S'abonne aux mises à jour des sessions de chat (temps réel)
   */
  static subscribeToChatSessions(
    userId: string,
    callback: (session: ChatSession) => void
  ) {
    // IMPORTANT: les filtres Realtime ne supportent pas `or(...)`.
    // On déclare 2 handlers pour couvrir participant1_id OU participant2_id.
    const subscription = supabase.channel(`user_chats:${userId}`)

    subscription.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_chats',
        filter: `participant1_id=eq.${userId}`
      },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          callback(payload.new as ChatSession)
        }
      }
    )

    subscription.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_chats',
        filter: `participant2_id=eq.${userId}`
      },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          callback(payload.new as ChatSession)
        }
      }
    )

    subscription.subscribe()
    return subscription
  }

  /**
   * Se désabonne d'un canal de temps réel
   */
  static unsubscribe(subscription: any) {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  }

  /**
   * Récupère le nombre de messages non lus pour un utilisateur
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      // Récupérer toutes les sessions de l'utilisateur
      const sessions = await this.getUserChatSessions(userId)
      
      let totalUnread = 0
      
      for (const session of sessions) {
        const { count, error } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', session.id)
          .neq('sender_id', userId)
          .eq('is_read', false)

        if (!error && count) {
          totalUnread += count
        }
      }

      return totalUnread
    } catch (error) {
      console.error('Erreur lors du comptage des messages non lus:', error)
      return 0
    }
  }

  /**
   * Archive une session de chat
   */
  static async archiveChatSession(chatId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_chats')
        .update({ is_active: false })
        .eq('id', chatId)

      return !error
    } catch (error) {
      console.error('Erreur lors de l\'archivage de la session:', error)
      return false
    }
  }

  /**
   * Supprime une session de chat et tous ses messages
   */
  static async deleteChatSession(chatId: string): Promise<boolean> {
    try {
      // Supprimer d'abord tous les messages
      await supabase
        .from('chat_messages')
        .delete()
        .eq('chat_id', chatId)

      // Puis supprimer la session
      const { error } = await supabase
        .from('user_chats')
        .delete()
        .eq('id', chatId)

      return !error
    } catch (error) {
      console.error('Erreur lors de la suppression de la session:', error)
      return false
    }
  }
}
