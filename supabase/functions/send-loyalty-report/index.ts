import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

interface EmailRecipient {
  email: string
  name?: string
}

interface EmailPayload {
  subject: string
  recipients: EmailRecipient[]
  content: {
    html: string
    text: string
  }
}

const SUPABASE_PROJECT_ID = Deno.env.get('SUPABASE_PROJECT_ID')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY')

if (!SUPABASE_PROJECT_ID || !SUPABASE_SERVICE_KEY) {
  console.error('Variables SUPABASE_PROJECT_ID ou SUPABASE_SERVICE_KEY manquantes dans la fonction Edge.')
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { 'content-type': 'application/json' }
    })
  }

  try {
    const payload = (await req.json()) as EmailPayload

    if (!payload?.subject || !payload?.recipients?.length) {
      return new Response(JSON.stringify({ error: 'Payload email incomplet' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      })
    }

    const response = await fetch(`https://${SUPABASE_PROJECT_ID}.supabase.co/email/v1/send`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: SUPABASE_SERVICE_KEY,
        authorization: `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        subject: payload.subject,
        personalizations: payload.recipients.map((recipient) => ({ to: [recipient] })),
        content: [
          { type: 'text/plain', value: payload.content?.text ?? '' },
          { type: 'text/html', value: payload.content?.html ?? '' }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erreur SMTP Supabase:', errorText)
      return new Response(JSON.stringify({ error: 'Échec envoi SMTP', details: errorText }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  } catch (error) {
    console.error('Erreur fonction Edge send-loyalty-report:', error)
    return new Response(JSON.stringify({ error: 'Erreur interne', details: String(error) }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
})
