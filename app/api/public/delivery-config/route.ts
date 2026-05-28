import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '../../../../lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/public/delivery-config
 * Expose une configuration de livraison en lecture seule pour le front.
 * La source de vérité est `super_admin_settings` (scope=global), champ `settings.deliveryConfig`.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('super_admin_settings')
      .select('settings')
      .eq('scope', 'global')
      .maybeSingle()

    if (error) {
      console.error('GET /api/public/delivery-config error:', error)
      return NextResponse.json(
        {
          data: {
            shippingCostAggregationDefault: 'max',
            allowCustomerShippingAggregationOverride: false,
            freeShippingConfig: {
              enabled: false,
              rules: []
            }
          }
        },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      )
    }

    const settings = (data as any)?.settings ?? {}
    const deliveryConfig = (settings as any)?.deliveryConfig ?? {}

    // Rétro-compat: certains environnements stockent les blocs directement dans settings,
    // d'autres sous settings.deliveryConfig.
    const deliveryRulesRaw: unknown = (settings as any)?.deliveryRules ?? (deliveryConfig as any)?.deliveryRules ?? []
    const deliveryGeoRaw: unknown = (settings as any)?.deliveryGeo ?? (deliveryConfig as any)?.deliveryGeo ?? {}
    const freeShippingConfigRaw: unknown = (settings as any)?.freeShippingConfig ?? (deliveryConfig as any)?.freeShippingConfig
    const pickupConfigRaw: unknown = (settings as any)?.pickupConfig ?? (deliveryConfig as any)?.pickupConfig

    const payload = {
      shippingCostAggregationDefault: deliveryConfig?.shippingCostAggregationDefault === 'sum' ? 'sum' : 'max',
      allowCustomerShippingAggregationOverride: deliveryConfig?.allowCustomerShippingAggregationOverride === true,
      deliveryRules: Array.isArray(deliveryRulesRaw) ? deliveryRulesRaw : [],
      deliveryGeo: deliveryGeoRaw && typeof deliveryGeoRaw === 'object' ? deliveryGeoRaw : {},
      freeShippingConfig:
        freeShippingConfigRaw && typeof freeShippingConfigRaw === 'object'
          ? freeShippingConfigRaw
          : {
              enabled: false,
              rules: []
            },
      pickupConfig:
        pickupConfigRaw && typeof pickupConfigRaw === 'object'
          ? pickupConfigRaw
          : {
              enabled: false,
              points: []
            }
    }

    return NextResponse.json(
      { data: payload },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (error) {
    console.error('GET /api/public/delivery-config failed:', error)
    return NextResponse.json(
      {
        data: {
          shippingCostAggregationDefault: 'max',
          allowCustomerShippingAggregationOverride: false,
          freeShippingConfig: {
            enabled: false,
            rules: []
          }
        }
      },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }
}
