/**
 * Service pour gérer les messages éditables par les admins
 */

import { supabase } from '@/lib/supabase'

export interface EditableMessage {
  id: string
  message_key: string
  title: string | null
  content: string
  message_type: string
  is_active: boolean
  display_locations: string[]
  updated_by: string | null
  created_at: string
  updated_at: string
}

export class EditableMessagesService {
  /**
   * Normalise un champ `display_locations` venant de Supabase.
   * Supporte:
   * - `text[]` (array)
   * - string JSON (ex: "[\"wishlist\"]")
   * - string simple (ex: "wishlist,product_page")
   */
  private static normalizeDisplayLocations(value: unknown): string[] {
    try {
      if (Array.isArray(value)) {
        return value.map((x) => String(x).trim()).filter(Boolean)
      }

      if (typeof value === 'string') {
        const raw = value.trim()
        if (!raw) return []

        if (raw.startsWith('[') && raw.endsWith(']')) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            return parsed.map((x) => String(x).trim()).filter(Boolean)
          }
        }

        // Fallback: "a,b,c" ou "a; b; c"
        return raw
          .split(/[,;]+/g)
          .map((x) => String(x).trim())
          .filter(Boolean)
      }

      return []
    } catch {
      return []
    }
  }

  /**
   * Récupère un message par sa clé
   */
  static async getMessageByKey(messageKey: string): Promise<EditableMessage | null> {
    try {
      const { data, error } = await supabase
        .from('editable_messages')
        .select('*')
        .eq('message_key', messageKey)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Erreur récupération message:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erreur:', error)
      return null
    }
  }

  /**
   * Récupère tous les messages actifs
   */
  static async getAllActiveMessages(): Promise<EditableMessage[]> {
    try {
      const { data, error } = await supabase
        .from('editable_messages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erreur récupération messages:', error)
      return []
    }
  }

  /**
   * Récupère les messages actifs applicables à un emplacement (display_location).
   * Retourne un tableau vide si aucun message.
   */
  static async getActiveMessagesForLocation(location: string): Promise<EditableMessage[]> {
    try {
      const loc = String(location ?? '').trim()
      if (!loc) return []

      const locLower = loc.toLowerCase()

      // 1) Tentative optimisee: filtrage cote DB (TEXT[] / JSONB array).
      const { data, error } = await supabase
        .from('editable_messages')
        .select('*')
        .eq('is_active', true)
        .contains('display_locations', [loc])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur récupération messages par location (DB contains):', {
          location,
          error,
          code: (error as any)?.code,
          message: (error as any)?.message,
          details: (error as any)?.details,
          hint: (error as any)?.hint
        })
      }

      if (Array.isArray(data) && data.length > 0) {
        return data
      }

      // 2) Fallback robuste: on recupere tous les messages actifs et on filtre cote client.
      // Utile si `display_locations` est stocke differemment dans la DB (ex: string/JSON) ou si l'operateur `.contains` ne matche pas.
      const { data: allActive, error: allError } = await supabase
        .from('editable_messages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (allError) {
        console.error('Erreur récupération messages actifs (fallback):', {
          location,
          error: allError,
          code: (allError as any)?.code,
          message: (allError as any)?.message,
          details: (allError as any)?.details,
          hint: (allError as any)?.hint
        })
        return []
      }

      const rows = Array.isArray(allActive) ? allActive : []
      const filtered = rows.filter((row: any) => {
        const list = this.normalizeDisplayLocations(row?.display_locations)
        return list.some((x) => String(x).toLowerCase() === locLower)
      })

      if (filtered.length > 0) {
        console.warn('Fallback messages par location utilise (contains=0).', {
          location: loc,
          totalActive: rows.length,
          filtered: filtered.length
        })
      }

      return filtered as EditableMessage[]
    } catch (error) {
      console.error('Erreur récupération messages par location:', { location, error })
      return []
    }
  }

  /**
   * Récupère tous les messages (admin)
   */
  static async getAllMessages(): Promise<EditableMessage[]> {
    try {
      const { data, error } = await supabase
        .from('editable_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erreur récupération messages:', error)
      return []
    }
  }

  /**
   * Crée un nouveau message (admin)
   */
  static async createMessage(
    messageKey: string,
    title: string | null,
    content: string,
    messageType: string = 'info',
    displayLocations: string[] = [],
    userId: string
  ): Promise<EditableMessage | null> {
    try {
      const { data, error } = await supabase
        .from('editable_messages')
        .insert({
          message_key: messageKey,
          title,
          content,
          message_type: messageType,
          display_locations: displayLocations,
          updated_by: userId
        })
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Erreur création message:', error)
      return null
    }
  }

  /**
   * Met à jour un message (admin)
   */
  static async updateMessage(
    id: string,
    updates: {
      title?: string | null
      content?: string
      message_type?: string
      is_active?: boolean
      display_locations?: string[]
    },
    userId: string
  ): Promise<EditableMessage | null> {
    try {
      // Vérifier d'abord que le message existe (lever une erreur si introuvable)
      const { error: fetchError } = await supabase
        .from('editable_messages')
        .select('id')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('❌ Erreur lors de la récupération du message:', fetchError)
        throw new Error(`Message introuvable: ${fetchError.message}`)
      }

      // Effectuer la mise à jour
      const { data, error } = await supabase
        .from('editable_messages')
        .update({
          ...updates,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur Supabase lors de la mise à jour:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      return data
    } catch (error: any) {
      console.error('❌ Erreur mise à jour message:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        name: error?.name,
        stack: error?.stack
      })
      return null
    }
  }

  /**
   * Supprime un message (admin)
   */
  static async deleteMessage(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('editable_messages')
        .delete()
        .eq('id', id)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Erreur suppression message:', error)
      return false
    }
  }

  /**
   * S'abonner aux changements d'un message spécifique
   */
  static subscribeToMessage(
    messageKey: string,
    callback: (message: EditableMessage | null) => void
  ) {
    const channel = supabase
      .channel(`message-${messageKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'editable_messages',
          filter: `message_key=eq.${messageKey}`
        },
        (payload: any) => {
          if (payload.eventType === 'DELETE') {
            callback(null)
          } else {
            callback(payload.new as EditableMessage)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  /**
   * S'abonner à tous les messages
   */
  static subscribeToAllMessages(
    callback: (messages: EditableMessage[]) => void
  ) {
    const channel = supabase
      .channel('all-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'editable_messages'
        },
        async () => {
          // Recharger tous les messages
          const messages = await this.getAllMessages()
          callback(messages)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}
