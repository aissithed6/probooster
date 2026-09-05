import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

const COUNTRY_CODES: Record<string, { name: string; flag: string }> = {
  '+229': { name: 'Bénin', flag: '🇧🇯' },
  '+225': { name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  '+226': { name: 'Burkina Faso', flag: '🇧🇫' },
  '+227': { name: 'Niger', flag: '🇳🇪' },
  '+228': { name: 'Togo', flag: '🇹🇬' },
  '+233': { name: 'Ghana', flag: '🇬🇭' },
  '+234': { name: 'Nigeria', flag: '🇳🇬' },
  '+237': { name: 'Cameroun', flag: '🇨🇲' },
  '+221': { name: 'Sénégal', flag: '🇸🇳' },
  '+223': { name: 'Mali', flag: '🇲🇱' },
  '+224': { name: 'Guinée', flag: '🇬🇳' },
  '+222': { name: 'Mauritanie', flag: '🇲🇷' },
  '+220': { name: 'Gambie', flag: '🇬🇲' },
  '+231': { name: 'Liberia', flag: '🇱🇷' },
  '+232': { name: 'Sierra Leone', flag: '🇸🇱' },
  '+235': { name: 'Tchad', flag: '🇹🇩' },
  '+241': { name: 'Gabon', flag: '🇬🇦' },
  '+242': { name: 'Congo', flag: '🇨🇬' },
  '+243': { name: 'RDC', flag: '🇨🇩' },
  '+250': { name: 'Rwanda', flag: '🇷🇼' },
  '+254': { name: 'Kenya', flag: '🇰🇪' },
  '+255': { name: 'Tanzanie', flag: '🇹🇿' },
  '+256': { name: 'Ouganda', flag: '🇺🇬' },
  '+27': { name: 'Afrique du Sud', flag: '🇿🇦' },
  '+212': { name: 'Maroc', flag: '🇲🇦' },
  '+213': { name: 'Algérie', flag: '🇩🇿' },
  '+216': { name: 'Tunisie', flag: '🇹🇳' },
  '+20': { name: 'Égypte', flag: '🇪🇬' },
  '+33': { name: 'France', flag: '🇫🇷' },
  '+32': { name: 'Belgique', flag: '🇧🇪' },
  '+41': { name: 'Suisse', flag: '🇨🇭' },
  '+1': { name: 'USA/Canada', flag: '🇺🇸' },
  '+44': { name: 'Royaume-Uni', flag: '🇬🇧' },
  '+49': { name: 'Allemagne', flag: '🇩🇪' },
  '+39': { name: 'Italie', flag: '🇮🇹' },
  '+34': { name: 'Espagne', flag: '🇪🇸' },
  '+351': { name: 'Portugal', flag: '🇵🇹' },
  '+90': { name: 'Turquie', flag: '🇹🇷' },
  '+7': { name: 'Russie', flag: '🇷🇺' },
  '+86': { name: 'Chine', flag: '🇨🇳' },
  '+81': { name: 'Japon', flag: '🇯🇵' },
  '+91': { name: 'Inde', flag: '🇮🇳' },
  '+61': { name: 'Australie', flag: '🇦🇺' },
  '+55': { name: 'Brésil', flag: '🇧🇷' },
  '+971': { name: 'Émirats Arabes Unis', flag: '🇦🇪' },
  '+966': { name: 'Arabie Saoudite', flag: '🇸🇦' },
}

function detectCountry(phone: string): { code: string; name: string; flag: string } {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  for (let len = 4; len >= 1; len--) {
    const code = '+' + cleaned.substring(0, len)
    if (COUNTRY_CODES[code]) {
      return { code, ...COUNTRY_CODES[code] }
    }
  }
  return { code: '+229', name: 'Bénin', flag: '🇧🇯' }
}

function normalizePhone(phone: string, countryCode: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('00')) return '+' + cleaned.substring(2)
  return countryCode + cleaned
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, interests = [], source = 'footer' } = body

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Numéro de téléphone requis' }, { status: 400 })
    }

    const country = detectCountry(phone)
    const normalizedPhone = normalizePhone(phone, country.code)
    const digitsOnly = normalizedPhone.replace(/\D/g, '')
    if (digitsOnly.length < 8) {
      return NextResponse.json({ error: 'Numéro invalide' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.rpc('upsert_whatsapp_subscriber', {
      p_phone: normalizedPhone,
      p_country_code: country.code,
      p_country_name: country.name,
      p_country_flag: country.flag,
      p_interests: interests,
      p_source: source,
      p_metadata: JSON.stringify({
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      })
    })

    if (error) {
      console.error('❌ Error upserting subscriber:', error)
      return NextResponse.json({ error: 'Erreur lors de l\'abonnement' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        phone: normalizedPhone,
        country: country.name,
        flag: country.flag,
        interests: interests
      }
    })

  } catch (error: any) {
    console.error('❌ Error in whatsapp-subscribe API:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.rpc('get_whatsapp_subscribers_stats')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}