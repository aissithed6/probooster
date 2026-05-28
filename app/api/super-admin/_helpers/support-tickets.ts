import { getSupabaseAdmin } from '@/lib/supabase'
import type { SuperAdminSupportTicket } from '@/lib/services/super-admin-dashboard-service'

interface SupportTicketRow {
  id: string
  requester_id: string | null
  assigned_to: string | null
  subject: string
  description: string | null
  status: string
  priority: string
  category: string | null
  tags: string[] | null
  metadata: Record<string, any> | null
  resolution_summary: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Mappe un enregistrement de ticket Supabase vers le domaine Super Admin.
 */
const mapTicketRow = (row: SupportTicketRow): SuperAdminSupportTicket => ({
  id: row.id,
  requesterId: row.requester_id,
  assignedTo: row.assigned_to,
  subject: row.subject,
  description: row.description,
  status: row.status as SuperAdminSupportTicket['status'],
  priority: row.priority as SuperAdminSupportTicket['priority'],
  category: row.category,
  tags: row.tags ?? [],
  metadata: row.metadata ?? {},
  resolutionSummary: row.resolution_summary,
  resolvedAt: row.resolved_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

/**
 * Récupère la liste des tickets de support côté administrateur.
 */
export async function fetchSupportTicketsAdmin(limit?: number): Promise<SuperAdminSupportTicket[]> {
  const supabase = getSupabaseAdmin()

  let query = supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })

  if (typeof limit === 'number') {
    query = query.limit(Math.max(1, limit))
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Chargement des tickets échoué: ${error.message}`)
  }

  return (data ?? []).map((row) => mapTicketRow(row as SupportTicketRow))
}

/**
 * Met à jour les métadonnées d'un ticket support.
 */
export async function updateSupportTicketAdmin(
  ticketId: string,
  updates: Partial<Omit<SuperAdminSupportTicket, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<SuperAdminSupportTicket> {
  const supabase = getSupabaseAdmin()

  const payload: Record<string, any> = {
    requester_id: updates.requesterId,
    assigned_to: updates.assignedTo,
    subject: updates.subject,
    description: updates.description,
    status: updates.status,
    priority: updates.priority,
    category: updates.category,
    tags: updates.tags,
    metadata: updates.metadata,
    resolution_summary: updates.resolutionSummary,
    resolved_at: updates.resolvedAt,
    updated_at: new Date().toISOString()
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key]
    }
  })

  if (Object.keys(payload).length === 0) {
    const { data, error } = await supabase.from('support_tickets').select('*').eq('id', ticketId).single()
    if (error || !data) {
      throw new Error(`Ticket introuvable: ${error?.message ?? 'erreur inconnue'}`)
    }
    return mapTicketRow(data as SupportTicketRow)
  }

  const { data, error } = await supabase
    .from('support_tickets')
    .update(payload)
    .eq('id', ticketId)
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(`Mise à jour du ticket échouée: ${error?.message ?? 'erreur inconnue'}`)
  }

  return mapTicketRow(data as SupportTicketRow)
}
