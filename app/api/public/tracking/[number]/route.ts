import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

/**
 * API publique pour suivre une livraison via son numéro de suivi.
 */
export async function GET(
  request: Request,
  { params }: { params: { number: string } }
) {
  try {
    const trackingNumber = params.number
    if (!trackingNumber) {
      return NextResponse.json({ error: "Numéro de suivi requis" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // 1. Récupérer la livraison par son numéro de suivi
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select(`
        *,
        carrier:carrier_id (*),
        shipping_method:shipping_method_id (*),
        events:delivery_events (*)
      `)
      .eq('tracking_number', trackingNumber)
      .maybeSingle()

    if (deliveryError) {
      return NextResponse.json({ error: deliveryError.message }, { status: 500 })
    }

    if (!delivery) {
      return NextResponse.json({ error: "Livraison non trouvée" }, { status: 404 })
    }

    // 2. Formater la réponse pour correspondre à l'interface ClientDelivery
    const formattedDelivery = {
      id: delivery.id,
      orderId: delivery.order_id,
      orderNumber: delivery.order_number,
      status: delivery.status,
      priority: delivery.priority,
      eta: delivery.eta,
      deliveryAddress: delivery.delivery_address,
      dispatchedAt: delivery.dispatched_at,
      deliveredAt: delivery.delivered_at,
      cancelledAt: delivery.cancelled_at,
      currentLocation: delivery.current_location,
      driver: delivery.driver_id ? { id: delivery.driver_id } : null,
      trackingNumber: delivery.tracking_number,
      progressPercent: delivery.progress_percent || 0,
      coordinates: delivery.latitude ? { lat: delivery.latitude, lng: delivery.longitude } : null,
      shippingMethod: delivery.shipping_method ? {
        id: delivery.shipping_method.id,
        name: delivery.shipping_method.name,
        description: delivery.shipping_method.description,
        basePrice: delivery.shipping_method.base_price,
        currency: delivery.shipping_method.currency
      } : null,
      carrier: delivery.carrier ? {
        id: delivery.carrier.id,
        name: delivery.carrier.name,
        contactPhone: delivery.carrier.contact_phone,
        contactEmail: delivery.carrier.contact_email
      } : null,
      events: (delivery.events || []).map((e: any) => ({
        id: e.id,
        type: e.event_type,
        status: e.status,
        description: e.description,
        location: e.location,
        occurredAt: e.occurred_at,
        data: e.data
      })).sort((a: any, b: any) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()),
      createdAt: delivery.created_at,
      updatedAt: delivery.updated_at
    }

    return NextResponse.json({ data: formattedDelivery })
  } catch (error: any) {
    console.error("❌ Error in tracking API:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
