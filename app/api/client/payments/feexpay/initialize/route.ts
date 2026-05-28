'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../../_helpers/auth'

import { recordAutomationEvent } from '@/lib/automation-events'

type InitializePayload = {
  amount: number
  currency?: string | null
  method?: 'mobile_money' | 'card' | string | null
  network?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  description?: string | null
  metadata?: Record<string, unknown> | null
}

/**
 * POST /api/client/payments/feexpay/initialize
 * Initialise une transaction FeexPay pour un client authentifié.
 *
 * Note: ce handler supporte actuellement un mode "mock" pour valider le flux UI.
 * Le mode live devra appeler l'API FeexPay côté serveur (clé/secret via env) et retourner
 * une référence + éventuellement une URL de paiement.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)

    const body = (await request.json().catch(() => ({}))) as Partial<InitializePayload>
    const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide.' }, { status: 400 })
    }

    const mode = (process.env.FEEXPAY_MODE ?? 'mock').toLowerCase()

    if (mode === 'mock') {
      const reference = `FP_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`

      const method = typeof body.method === 'string' ? body.method.trim() : ''
      const networkFromBody = typeof body.network === 'string' ? body.network.trim().toLowerCase() : ''

      void recordAutomationEvent({
        source: 'feexpay_initialize',
        eventType: 'checkout.payment_initialized',
        entityType: 'payment',
        entityId: null,
        actorUserId: userId,
        payload: {
          provider: 'feexpay',
          mode: 'mock',
          reference,
          amount,
          currency: body.currency ?? 'XOF',
          method: body.method ?? null,
          networkRequested: networkFromBody || null,
          networkResolved: networkFromBody || null
        },
        request
      })

      return NextResponse.json(
        {
          mode: 'mock',
          reference,
          status: 'pending',
          paymentUrl: null,
          networkRequested: networkFromBody || null,
          networkResolved: networkFromBody || null,
          method: method || null
        },
        { status: 200 }
      )
    }

    const apiKey = process.env.FEEXPAY_API_KEY
    const shopId = process.env.FEEXPAY_SHOP_ID
    const networkEnvRaw = (process.env.FEEXPAY_PAYIN_NETWORK ?? 'orange_ci').trim()

    const method = typeof body.method === 'string' ? body.method.trim() : ''
    const networkFromBody = typeof body.network === 'string' ? body.network.trim().toLowerCase() : ''

    // Mapping réseaux Mobile Money (Bénin)
    // Les valeurs exactes attendues par FeexPay peuvent varier: on peut les configurer dans .env.local.
    // IMPORTANT: si le mapping est absent ou incohérent, on préfère un fallback sur le réseau choisi côté UI
    // pour éviter d'envoyer un autre réseau (ex: Celtiis => MTN) et bloquer l'USSD.
    const beninNetworkEnvMap: Record<string, string> = {
      mtn: String(process.env.FEEXPAY_PAYIN_NETWORK_BJ_MTN ?? '').trim(),
      moov: String(process.env.FEEXPAY_PAYIN_NETWORK_BJ_MOOV ?? '').trim(),
      celtiis: String(process.env.FEEXPAY_PAYIN_NETWORK_BJ_CELTIIS ?? '').trim(),
      coris: String(process.env.FEEXPAY_PAYIN_NETWORK_BJ_CORIS ?? '').trim()
    }

    const mappedFromBody = method === 'mobile_money' && networkFromBody ? (beninNetworkEnvMap[networkFromBody] ?? '') : ''

    const allowedInternalBeninNetworks = new Set(['mtn', 'moov', 'celtiis', 'coris'])

    const networkRaw = (mappedFromBody || (method === 'mobile_money' && allowedInternalBeninNetworks.has(networkFromBody) ? networkFromBody : '') || networkEnvRaw).trim()
    const network = networkRaw.replace(/\s+/g, ' ').trim()
    const returnUrl = process.env.FEEXPAY_RETURN_URL || `${request.nextUrl.origin}/dashboard`

    if (!apiKey || !shopId) {
      void recordAutomationEvent({
        source: 'feexpay_initialize',
        eventType: 'checkout.payment_init_failed',
        entityType: 'payment',
        entityId: null,
        actorUserId: userId,
        payload: {
          provider: 'feexpay',
          mode,
          reason: 'missing_config',
          amount,
          currency: body.currency ?? 'XOF',
          method: body.method ?? null
        },
        request
      })
      return NextResponse.json(
        { error: 'FeexPay non configuré (FEEXPAY_API_KEY / FEEXPAY_SHOP_ID manquants).' },
        { status: 500 }
      )
    }

    if (!network) {
      void recordAutomationEvent({
        source: 'feexpay_initialize',
        eventType: 'checkout.payment_init_failed',
        entityType: 'payment',
        entityId: null,
        actorUserId: userId,
        payload: {
          provider: 'feexpay',
          mode,
          reason: 'invalid_network',
          networkRaw,
          method: body.method ?? null
        },
        request
      })
      return NextResponse.json(
        {
          error: 'FeexPay non configuré (réseau payin invalide).',
          details: {
            networkRaw,
            method,
            networkFromBody: networkFromBody || undefined,
            mappingConfigured: method === 'mobile_money' && networkFromBody ? Boolean(mappedFromBody) : undefined
          }
        },
        { status: 500 }
      )
    }

    if (method === 'mobile_money' && networkFromBody) {
      if (!allowedInternalBeninNetworks.has(networkFromBody)) {
        return NextResponse.json(
          {
            error: 'Réseau Mobile Money non supporté.',
            details: { network: networkFromBody }
          },
          { status: 400 }
        )
      }

      // Si le mapping env existe mais pointe sur un autre réseau interne, on refuse pour éviter d'envoyer le mauvais canal USSD.
      // Exemple observé: UI "celtiis" mais mapping => "mtn".
      const mappedTrimmed = String(mappedFromBody || '').trim().toLowerCase()
      if (mappedTrimmed && allowedInternalBeninNetworks.has(mappedTrimmed) && mappedTrimmed !== networkFromBody) {
        void recordAutomationEvent({
          source: 'feexpay_initialize',
          eventType: 'checkout.payment_init_failed',
          entityType: 'payment',
          entityId: null,
          actorUserId: userId,
          payload: {
            provider: 'feexpay',
            mode,
            reason: 'network_mapping_mismatch',
            networkRequested: networkFromBody,
            networkResolved: mappedTrimmed
          },
          request
        })

        return NextResponse.json(
          {
            error: 'Configuration réseau Mobile Money incohérente côté serveur.',
            details: {
              networkRequested: networkFromBody,
              networkResolved: mappedTrimmed,
              hint: 'Vérifiez FEEXPAY_PAYIN_NETWORK_BJ_CELTIIS/MOOV/MTN/CORIS dans .env.local.'
            }
          },
          { status: 500 }
        )
      }
    }

    const normalizePhone = (raw: unknown): string => {
      const s = typeof raw === 'string' ? raw : raw == null ? '' : String(raw)
      return s.replace(/\D/g, '')
    }

    const sanitizeDescription = (raw: unknown): string => {
      const s = typeof raw === 'string' ? raw : raw == null ? '' : String(raw)
      const normalized = s
        .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      const whitelisted = normalized.replace(/[^a-zA-Z0-9 _.,;:!?'"@#%&()\-+/]/g, '')
      const out = whitelisted.trim() || 'Paiement'
      return out.length > 120 ? out.slice(0, 120) : out
    }

    const phoneNumber = normalizePhone(body.customerPhone)
    const email = typeof body.customerEmail === 'string' ? body.customerEmail.trim() : ''
    const description = sanitizeDescription(body.description)

    const parseNameParts = (raw: unknown): { firstName?: string; lastName?: string } => {
      const s = typeof raw === 'string' ? raw : raw == null ? '' : String(raw)
      const cleaned = s
        .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      if (!cleaned) return {}
      const parts = cleaned.split(' ').filter(Boolean)
      if (parts.length === 1) return { firstName: parts[0] }
      return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
    }

    const nameParts = parseNameParts((body.metadata as any)?.customerName)

    console.log('[FeexPay Initialize] phoneNumber envoyé à FeexPay:', phoneNumber)

    const payload = {
      amount: Number(amount),
      currency: String(body.currency),
      shop: String(shopId),
      customer_email: email || undefined,
      phoneNumber: Number(phoneNumber),
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      description: String(description),
      return_url: returnUrl,
    }

    const controller = new AbortController()
    const timeoutMsRaw = Number(process.env.FEEXPAY_TIMEOUT_MS ?? 60000)
    const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? timeoutMsRaw : 60000
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    let upstream: Response
    try {
      console.log('[FeexPay Initialize] Appel à FeexPay:', `https://api.feexpay.me/api/transactions/public/requesttopay/${encodeURIComponent(network)}`)
      console.log('[FeexPay Initialize] Payload envoyé:', JSON.stringify(payload, null, 2))
      
      upstream = await fetch(`https://api.feexpay.me/api/transactions/public/requesttopay/${encodeURIComponent(network)}`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`
        },
        cache: 'no-store',
        body: JSON.stringify(payload),
        signal: controller.signal
      })
    } catch (err) {
      if (err && typeof err === 'object' && (err as any)?.name === 'AbortError') {
        return NextResponse.json(
          {
            error: 'Timeout: FeexPay ne répond pas (initialize).',
            details: { timeoutMs }
          },
          { status: 504 }
        )
      }
      throw err
    } finally {
      clearTimeout(timeout)
    }

    const upstreamText = await upstream.text().catch(() => '')
    console.log('[FeexPay Initialize] Réponse brute de FeexPay:', upstreamText)
    
    const upstreamJson = (() => {
      if (!upstreamText) return {} as any
      try {
        const parsed = JSON.parse(upstreamText) as any
        console.log('[FeexPay Initialize] Réponse parsée:', JSON.stringify(parsed, null, 2))
        return parsed
      } catch {
        console.log('[FeexPay Initialize] Réponse non-JSON, fallback objet vide')
        return {} as any
      }
    })()

    if (!upstream.ok) {
      const msg =
        (upstreamJson as any)?.error ||
        (upstreamJson as any)?.message ||
        (upstreamJson as any)?.responsemsg ||
        'Erreur FeexPay (initialize).'

      const bodySnippet = upstreamText ? upstreamText.slice(0, 800) : ''
      console.error('❌ FeexPay initialize upstream error:', {
        upstreamStatus: upstream.status,
        network,
        hasBody: Boolean(upstreamText),
        bodySnippet
      })

      return NextResponse.json(
        {
          error: msg,
          upstreamStatus: upstream.status,
          details: Object.keys(upstreamJson || {}).length > 0 ? upstreamJson : undefined,
          bodySnippet: bodySnippet || undefined
        },
        { status: 502 }
      )
    }

    const reference =
      typeof (upstreamJson as any)?.reference === 'string'
        ? (upstreamJson as any).reference
        : typeof (upstreamJson as any)?.order_id === 'string'
          ? (upstreamJson as any).order_id
          : typeof (upstreamJson as any)?.transref === 'string'
            ? (upstreamJson as any).transref
            : ''

    const paymentUrl = typeof (upstreamJson as any)?.payment_url === 'string' ? (upstreamJson as any).payment_url : null

    if (!reference) {
      void recordAutomationEvent({
        source: 'feexpay_initialize',
        eventType: 'checkout.payment_init_failed',
        entityType: 'payment',
        entityId: null,
        actorUserId: userId,
        payload: {
          provider: 'feexpay',
          mode,
          reason: 'missing_reference',
          amount,
          currency: body.currency ?? 'XOF',
          network
        },
        request
      })
      return NextResponse.json(
        { error: 'Référence FeexPay introuvable dans la réponse.', details: upstreamJson },
        { status: 502 }
      )
    }

    const status = typeof (upstreamJson as any)?.status === 'string' ? (upstreamJson as any).status : 'PENDING'

    void recordAutomationEvent({
      source: 'feexpay_initialize',
      eventType: 'checkout.payment_initialized',
      entityType: 'payment',
      entityId: null,
      actorUserId: userId,
      payload: {
        provider: 'feexpay',
        mode,
        reference,
        status,
        amount,
        currency: body.currency ?? 'XOF',
        method: body.method ?? null,
        networkRequested: networkFromBody || null,
        networkResolved: network,
        network,
        paymentUrl
      },
      request
    })

    return NextResponse.json(
      {
        mode,
        reference,
        status,
        paymentUrl,
        networkRequested: networkFromBody || null,
        networkResolved: network,
        method: method || null
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ POST /api/client/payments/feexpay/initialize failed:', error)

    try {
      const maybeUserId = await (async () => {
        try {
          return await assertCustomer(request)
        } catch {
          return null
        }
      })()

      void recordAutomationEvent({
        source: 'feexpay_initialize',
        eventType: 'checkout.payment_init_failed',
        entityType: 'payment',
        entityId: null,
        actorUserId: maybeUserId,
        payload: {
          provider: 'feexpay',
          reason: 'exception',
          message: error instanceof Error ? error.message : String(error)
        },
        request
      })
    } catch {
      // best-effort
    }

    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = isClientAuthError(error) ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
