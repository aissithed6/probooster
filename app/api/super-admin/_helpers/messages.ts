import { getSupabaseAdmin } from '@/lib/supabase'
import type { SuperAdminInboxMessage } from '@/lib/services/super-admin-dashboard-service'

/**
 * Marque un message individuel comme lu.
 */
export async function markMessageAsReadAdmin(messageId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('user_messages').update({ is_read: true }).eq('id', messageId)

  if (error) {
    throw new Error(`Impossible de marquer le message comme lu: ${error.message}`)
  }
}

/**
 * Marque tous les messages d'un destinataire comme lus.
 */
export async function markAllMessagesAsReadAdmin(recipientId: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('user_messages').update({ is_read: true }).eq('recipient_id', recipientId)

  if (error) {
    throw new Error(`Impossible de marquer tous les messages comme lus: ${error.message}`)
  }
}

/**
 * Met à jour le statut d'un message (active, archivé, supprimé).
 */
export async function updateMessageStatusAdmin(
  messageId: string,
  status: SuperAdminInboxMessage['status']
): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('user_messages').update({ status }).eq('id', messageId)

  if (error) {
    throw new Error(`Mise à jour du statut du message échouée: ${error.message}`)
  }
}

export interface SendInternalMessageAdminInput {
  senderId: string | null
  recipientId: string
  subject: string
  content: string
  priority?: SuperAdminInboxMessage['priority']
  category?: string | null
  parentMessageId?: string | null
}

/**
 * Envoie un message interne via Supabase admin.
 */
export async function sendInternalMessageAdmin(payload: SendInternalMessageAdminInput): Promise<void> {
  const supabase = getSupabaseAdmin()
  const normalizedPriority = (() => {
    const raw = payload.priority ?? 'medium'
    if (raw === 'low') return 'low'
    if (raw === 'high') return 'high'
    // Compat: l'API super-admin utilise 'medium' mais la table user_messages utilise 'normal'
    return 'normal'
  })()

  const normalizedCategory = (() => {
    const raw = String(payload.category ?? 'general').toLowerCase().trim()
    if (raw === 'support') return 'support'
    if (raw === 'technical') return 'technical'
    if (raw === 'billing') return 'billing'
    if (raw === 'account') return 'account'
    return 'general'
  })()

  const { error } = await supabase.from('user_messages').insert({
    sender_id: payload.senderId,
    recipient_id: payload.recipientId,
    subject: payload.subject,
    content: payload.content,
    priority: normalizedPriority,
    category: normalizedCategory,
    type: 'internal',
    status: 'active',
    parent_message_id: payload.parentMessageId ?? null,
    is_read: false
  })

  if (error) {
    throw new Error(`Envoi du message échoué: ${error.message}`)
  }
}
