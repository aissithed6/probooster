'use server'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertCustomer, isClientAuthError } from '../../../_helpers/auth'

import { recordAutomationEvent } from '@/lib/automation-events'

type VerifyPayload = {
  reference: string
}

/**
 * POST /api/client/payments/feexpay/verify
 * Vérifie le statut d'une transaction FeexPay (référence) pour un client authentifié.
 *
 * Note: en mode "mock", cette route renvoie systématiquement paid=true pour valider le flux.
 * En mode live, elle devra interroger l'API FeexPay (server-to-server) et retourner un statut fiable.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await assertCustomer(request)

    const body = (await request.json().catch(() => ({}))) as Partial<VerifyPayload>
    const reference = typeof body.reference === 'string' ? body.reference.trim() : ''

    if (!reference) {
      return NextResponse.json({ error: 'Référence manquante.' }, { status: 400 })
    }

    const mode = (process.env.FEEXPAY_MODE ?? 'mock').toLowerCase()

    if (mode === 'mock') {
      void recordAutomationEvent({
        source: 'feexpay_verify',
        eventType: 'checkout.payment_verified',
        entityType: 'payment',
        entityId: null,
        actorUserId: userId,
        payload: {
          provider: 'feexpay',
          mode: 'mock',
          reference,
          paid: true,
          status: 'successful'
        },
        request
      })
      return NextResponse.json(
        {
          mode: 'mock',
          reference,
          paid: true,
          status: 'successful'
        },
        { status: 200 }
      )
    }

    const apiKey = process.env.FEEXPAY_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'FeexPay non configuré (FEEXPAY_API_KEY manquant).' },
        { status: 500 }
      )
    }

    const controller = new AbortController()
    const timeoutMsRaw = Number(process.env.FEEXPAY_VERIFY_TIMEOUT_MS ?? process.env.FEEXPAY_TIMEOUT_MS ?? 60000)
    const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? timeoutMsRaw : 60000
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    let upstream: Response
    try {
      upstream = await fetch(
        `https://api.feexpay.me/api/transactions/public/single/status/${encodeURIComponent(reference)}`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            authorization: `Bearer ${apiKey}`
          },
          cache: 'no-store',
          signal: controller.signal
        }
      )
    } catch (err) {
      const isAbort = err && typeof err === 'object' && (err as any)?.name === 'AbortError'
      if (isAbort) {
        void recordAutomationEvent({
          source: 'feexpay_verify',
          eventType: 'checkout.payment_failed',
          entityType: 'payment',
          entityId: null,
          actorUserId: userId,
          payload: {
            provider: 'feexpay',
            mode,
            reference,
            reason: 'timeout',
            timeoutMs
          },
          request
        })

        return NextResponse.json(
          { error: 'Timeout: FeexPay ne répond pas (verify).', details: { timeoutMs } },
          { status: 504 }
        )
      }
      throw err
    } finally {
      clearTimeout(timeout)
    }

    const upstreamText = await upstream.text().catch(() => '')
    const upstreamJson = (() => {
      if (!upstreamText) return {} as any
      try {
        return JSON.parse(upstreamText) as any
      } catch {
        return {} as any
      }
    })()

    if (!upstream.ok) {
      const msg =
        (upstreamJson as any)?.error ||
        (upstreamJson as any)?.message ||
        (upstreamJson as any)?.responsemsg ||
        'Erreur FeexPay (verify).'

      const bodySnippet = upstreamText ? upstreamText.slice(0, 800) : ''
      console.error('❌ FeexPay verify upstream error:', {
        upstreamStatus: upstream.status,
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

    const statusRaw = typeof (upstreamJson as any)?.status === 'string' ? (upstreamJson as any).status : ''
    const status = statusRaw.trim().toUpperCase()

    const operatorStatusRaw = typeof (upstreamJson as any)?.operator_status === 'string' ? (upstreamJson as any).operator_status : ''
    const operatorStatus = operatorStatusRaw.trim().toUpperCase()

    const reasonRaw = typeof (upstreamJson as any)?.reason === 'string' ? (upstreamJson as any).reason : ''
    const reason = reasonRaw.trim().toUpperCase()

    const responseCodeRaw = typeof (upstreamJson as any)?.responsecode === 'string' ? (upstreamJson as any).responsecode : ''
    const responseCode = responseCodeRaw.trim().toUpperCase()

    const responseMsgRaw = typeof (upstreamJson as any)?.responsemsg === 'string' ? (upstreamJson as any).responsemsg : ''
    const responseMsg = responseMsgRaw.trim().toUpperCase()

    const isDeclined = operatorStatus === 'DECLINED' || reason === 'DECLINED'
    const isFailedCode = responseCode === 'FAILED' || responseMsg === 'FAILED'

    const effectiveStatus = isDeclined || isFailedCode ? 'FAILED' : status

    // Heuristique: certains statuts connus.
    const paid = effectiveStatus === 'SUCCESS' || effectiveStatus === 'SUCCESSFUL' || effectiveStatus === 'SUCCEEDED' || effectiveStatus === 'COMPLETED' || effectiveStatus === 'PAID'

    const isTerminalFailure =
      effectiveStatus === 'FAILED' ||
      effectiveStatus === 'CANCELLED' ||
      effectiveStatus === 'CANCELED' ||
      effectiveStatus === 'EXPIRED' ||
      effectiveStatus === 'REJECTED'

    void recordAutomationEvent({
      source: 'feexpay_verify',
      eventType: isTerminalFailure ? 'checkout.payment_failed' : 'checkout.payment_verified',
      entityType: 'payment',
      entityId: null,
      actorUserId: userId,
      payload: {
        provider: 'feexpay',
        mode,
        reference,
        paid,
        status: effectiveStatus || statusRaw || 'UNKNOWN',
        operatorStatus: operatorStatusRaw || null,
        reason: reasonRaw || null,
        responseCode: responseCodeRaw || null,
        responseMsg: responseMsgRaw || null
      },
      request
    })

    console.log('[FeexPay Verify] reference:', reference, 'status:', statusRaw || 'UNKNOWN', 'paid:', paid)

    if (effectiveStatus === 'FAILED' || effectiveStatus === 'CANCELLED' || effectiveStatus === 'CANCELED' || effectiveStatus === 'EXPIRED' || effectiveStatus === 'REJECTED') {
      try {
        const snippet = JSON.stringify(upstreamJson).slice(0, 1200)
        console.log('[FeexPay Verify] terminal status details snippet:', snippet)
      } catch {
        // ignore
      }
    }

    return NextResponse.json(
      {
        mode,
        reference,
        paid,
        status: effectiveStatus || statusRaw || 'UNKNOWN'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ POST /api/client/payments/feexpay/verify failed:', error)

    try {
      const maybeUserId = await (async () => {
        try {
          return await assertCustomer(request)
        } catch {
          return null
        }
      })()

      void recordAutomationEvent({
        source: 'feexpay_verify',
        eventType: 'checkout.payment_failed',
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
