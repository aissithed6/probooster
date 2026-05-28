import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Types du contrat d'échange
interface EmailSettingsDTO {
  to: string
  cc: string
  bcc: string
  subjectPrefix: string
  recipientMode: 'all' | 'user' | 'group' | 'custom'
  selectedUserId: string | null
  groupEmails: string
}

// Valeurs par défaut si aucune configuration n'est présente
const DEFAULT_SETTINGS: EmailSettingsDTO = {
  to: '',
  cc: '',
  bcc: '',
  subjectPrefix: '[Paiements]',
  recipientMode: 'all',
  selectedUserId: null,
  groupEmails: ''
}

// Normalise et sécurise un objet en EmailSettingsDTO (trim et garde les champs attendus)
function normalizeSettings(payload: Partial<EmailSettingsDTO>): EmailSettingsDTO {
  const mode = (payload.recipientMode as EmailSettingsDTO['recipientMode']) ?? 'all'
  const allowedModes = new Set(['all', 'user', 'group', 'custom'])
  const recipientMode = allowedModes.has(mode) ? mode : 'all'
  return {
    to: String(payload.to ?? '').trim(),
    cc: String(payload.cc ?? '').trim(),
    bcc: String(payload.bcc ?? '').trim(),
    subjectPrefix: String(payload.subjectPrefix ?? '[Paiements]').trim() || '[Paiements]',
    recipientMode,
    selectedUserId: payload.selectedUserId === null ? null : (payload.selectedUserId ? String(payload.selectedUserId) : null),
    groupEmails: String(payload.groupEmails ?? '').trim()
  }
}

// GET: Récupère la configuration unique (singleton)
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('finance_email_settings')
      .select('to, cc, bcc, subject_prefix, recipient_mode, selected_user_id, group_emails')
      .eq('id', 'singleton')
      .maybeSingle()

    if (error) {
      // S'il n'y a pas encore de table ou pas d'enregistrement, renvoyer des valeurs par défaut
      return NextResponse.json(DEFAULT_SETTINGS)
    }

    if (!data) {
      return NextResponse.json(DEFAULT_SETTINGS)
    }

    const dto: EmailSettingsDTO = normalizeSettings({
      to: data.to,
      cc: data.cc,
      bcc: data.bcc,
      subjectPrefix: data.subject_prefix,
      recipientMode: data.recipient_mode,
      selectedUserId: data.selected_user_id,
      groupEmails: data.group_emails
    })

    return NextResponse.json(dto)
  } catch (e) {
    // Par défaut, renvoyer des valeurs par défaut si indisponible
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}

// POST: Crée/Met à jour la configuration unique (singleton)
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<EmailSettingsDTO>
    const dto = normalizeSettings(payload)

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('finance_email_settings')
      .upsert({
        id: 'singleton',
        to: dto.to,
        cc: dto.cc,
        bcc: dto.bcc,
        subject_prefix: dto.subjectPrefix,
        recipient_mode: dto.recipientMode,
        selected_user_id: dto.selectedUserId,
        group_emails: dto.groupEmails
      }, { onConflict: 'id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(dto)
  } catch (e) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
