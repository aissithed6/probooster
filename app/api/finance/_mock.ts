import { NextResponse } from 'next/server'

/**
 * Mocks simples pour les endpoints finance afin d'éviter les régressions.
 * Remplacez par une intégration base de données (ex: Supabase) ultérieurement.
 */

export type PaymentMethod = 'bank_transfer' | 'mobile_money' | 'card'

export type PaymentRequest = {
  id: string
  vendorId: string
  vendorName: string
  ordersCount: number
  totalAmount: number
  commissionAmount: number
  netAmount: number
  status: 'pending' | 'approved' | 'rejected'
  paymentMethod: PaymentMethod
  bankDetails?: string
  mobileNumber?: string
  createdAt: string
  processedAt?: string
  notes?: string
  executionType?: 'immediate' | 'scheduled' | 'batch'
  scheduleDate?: string
  batchId?: string
  payoutWindow?: string
  user?: { id: string; fullName: string; email: string }
  timeline?: { id: string; label: string; actor: string; occurredAt: string }[]
}

export type PaymentBatch = {
  id: string
  label: string
  status: 'pending' | 'processing' | 'completed'
  scheduledAt?: string
  executedAt?: string
  requests: PaymentRequest[]
  totalAmount: number
}

export const state = {
  stats: {
    totalRevenue: 12500000,
    totalCommission: 2450000,
    totalPayouts: 9800000,
    pendingPayouts: 210000,
    monthlyGrowth: 12,
    averageOrderValue: 35000,
    approvalRate: 92
  },
  payoutSettings: {
    autoPayout: false,
    minimumThreshold: 10000,
    primaryValidationDay: 'lundi',
    backupValidationDay: 'mardi',
    internalNotes: ''
  },
  refundSettings: {
    autoAdjustCommission: true,
    notifyVendor: true,
    escalationEmail: '',
    resolutionWindow: 7
  },
  paymentRequests: [
    {
      id: 'REQ-1001',
      vendorId: 'V-01',
      vendorName: 'Boutique Alpha',
      ordersCount: 12,
      totalAmount: 680000,
      commissionAmount: 68000,
      netAmount: 612000,
      status: 'pending',
      paymentMethod: 'bank_transfer',
      createdAt: '2025-10-01',
      executionType: 'immediate',
      user: { id: 'U-1', fullName: 'Alpha User', email: 'alpha@example.com' },
      timeline: [
        { id: 'E1', label: 'Créée', actor: 'system', occurredAt: '2025-10-01 10:00' }
      ]
    },
    {
      id: 'REQ-1002',
      vendorId: 'V-02',
      vendorName: 'Boutique Beta',
      ordersCount: 7,
      totalAmount: 350000,
      commissionAmount: 35000,
      netAmount: 315000,
      status: 'approved',
      paymentMethod: 'mobile_money',
      createdAt: '2025-10-02',
      processedAt: '2025-10-03',
      executionType: 'scheduled',
      scheduleDate: '2025-10-10',
      payoutWindow: '10h-12h'
    }
  ] as PaymentRequest[],
  scheduled: [] as PaymentRequest[],
  batches: [] as PaymentBatch[],
  cashFlow: [
    { id: 'CF1', direction: 'in', category: 'customer', label: 'Commande #A1', amount: 45000, occurredAt: '2025-10-01' },
    { id: 'CF2', direction: 'out', category: 'payout', label: 'Virement vendeur', amount: 315000, occurredAt: '2025-10-03' },
    { id: 'CF3', direction: 'out', category: 'expense', label: 'Frais service', amount: 12000, occurredAt: '2025-10-04' }
  ],
  vendorMetrics: [
    { id: 'V-01', vendorName: 'Boutique Alpha', pendingAmount: 120000, paidAmount: 1800000, riskScore: 12, lastPayout: '2025-09-25' },
    { id: 'V-02', vendorName: 'Boutique Beta', pendingAmount: 90000, paidAmount: 1320000, riskScore: 18, lastPayout: '2025-09-29' }
  ],
  analytics: {
    totalOperations: 124,
    averagePayoutTime: 36,
    fraudAlerts: 1,
    operationsTimeline: [
      { label: 'Lun', value: 12 },
      { label: 'Mar', value: 14 },
      { label: 'Mer', value: 18 },
      { label: 'Jeu', value: 20 },
      { label: 'Ven', value: 22 },
      { label: 'Sam', value: 16 },
      { label: 'Dim', value: 10 }
    ],
    productRevenues: [],
    userRevenues: []
  },
  commissionRules: [
    { id: 'CR-1', scope: 'global', basePercent: 12, updatedAt: '2025-10-01' }
  ],
  refunds: [
    { id: 'RF-1', orderId: 'O-1001', vendorId: 'V-01', vendorName: 'Boutique Alpha', customerEmail: 'client@x.com', amount: 15000, commissionAdjustment: 1500, status: 'requested', openedAt: '2025-10-04' }
  ],
  transactions: [
    { id: 'TX-1', vendorId: 'V-01', vendorName: 'Boutique Alpha', orderId: 'O-1001', grossAmount: 45000, commissionTaken: 4500, netAmount: 40500, status: 'paid', occurredAt: '2025-10-01' }
  ]
}

/**
 * Réponses helpers
 */
export const ok = (data: any) => NextResponse.json(data, { status: 200 })
export const bad = (message: string) => NextResponse.json({ error: message }, { status: 400 })
export const notFound = (message: string) => NextResponse.json({ error: message }, { status: 404 })
