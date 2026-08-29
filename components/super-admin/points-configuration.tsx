import { Dispatch, SetStateAction, ReactNode, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Save, ShieldCheck, Wand2 } from 'lucide-react'
import type { AdminPointSettings, SocialNetworkKey } from '@/lib/services/point-settings-service'
import type { ProductCategoryRecord } from '@/lib/types/product-category'
import { useMoney } from '@/lib/hooks/use-money'

const SOCIAL_NETWORKS: { key: SocialNetworkKey; label: string; color: string }[] = [
  { key: 'facebook', label: 'Facebook', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { key: 'instagram', label: 'Instagram', color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { key: 'twitter', label: 'X (Twitter)', color: 'bg-sky-50 border-sky-200 text-sky-700' },
  { key: 'whatsapp', label: 'WhatsApp', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { key: 'linkedin', label: 'LinkedIn', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { key: 'tiktok', label: 'TikTok', color: 'bg-gray-50 border-gray-200 text-gray-700' }
]

interface RealtimePointsCalculatorProps {
  config: AdminPointSettings
}

/** Affiche un calculateur interactif permettant d'estimer points et frais en temps réel. */
function RealtimePointsCalculator({ config }: RealtimePointsCalculatorProps) {
  const { formatMoney } = useMoney()
  const [purchaseAmount, setPurchaseAmount] = useState(10000)
  const [premiumActive, setPremiumActive] = useState(true)
  const [weekendActive, setWeekendActive] = useState(false)
  const [referralActive, setReferralActive] = useState(false)
  const [firstPurchaseActive, setFirstPurchaseActive] = useState(false)
  const [applyBulkBonus, setApplyBulkBonus] = useState(true)

  const calculations = useMemo(() => {
    const basePoints = purchaseAmount * config.basePointsPerFCFA
    const premiumPoints = premiumActive ? (basePoints * config.premiumVendorBonus) / 100 : 0
    const weekendPoints = weekendActive ? (basePoints * config.weekendBonus) / 100 : 0
    const referralPoints = referralActive ? (basePoints * config.referralBonus) / 100 : 0
    const firstPurchasePoints = firstPurchaseActive ? config.firstPurchaseBonus : 0
    const eligibleForBulk = purchaseAmount >= config.bulkPurchaseThreshold
    const bulkPoints = applyBulkBonus && eligibleForBulk ? (basePoints * config.bulkPurchaseBonus) / 100 : 0

    const totalPoints = basePoints + premiumPoints + weekendPoints + referralPoints + firstPurchasePoints + bulkPoints
    const pointsValue = totalPoints * config.withdrawalValue
    // Règle métier: aucun frais sur les retraits.
    const withdrawalFees = 0
    const netWithdrawal = Math.max(0, pointsValue - withdrawalFees)

    return {
      basePoints,
      premiumPoints,
      weekendPoints,
      referralPoints,
      firstPurchasePoints,
      bulkPoints,
      totalPoints,
      pointsValue,
      withdrawalFees,
      netWithdrawal,
      eligibleForBulk
    }
  }, [applyBulkBonus, config, firstPurchaseActive, premiumActive, purchaseAmount, referralActive, weekendActive])

  const formatPoints = (value: number) => `${Intl.NumberFormat('fr-FR').format(Math.round(value))} points`
  const formatCurrency = (value: number) => formatMoney(Math.round(value))

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-sm space-y-4">
          <div>
            <Label className="text-sm font-semibold text-emerald-800">Montant d'achat simulé</Label>
            <Input
              type="number"
              min={0}
              step={500}
              value={purchaseAmount}
              onChange={event => setPurchaseAmount(Number(event.target.value) || 0)}
              className="mt-2 border-emerald-200"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs text-emerald-800">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={premiumActive} onChange={event => setPremiumActive(event.target.checked)} />
              Bonus vendeur premium ({config.premiumVendorBonus}% )
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={weekendActive} onChange={event => setWeekendActive(event.target.checked)} />
              Bonus week-end ({config.weekendBonus}% )
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={referralActive} onChange={event => setReferralActive(event.target.checked)} />
              Bonus parrainage ({config.referralBonus}% )
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={firstPurchaseActive} onChange={event => setFirstPurchaseActive(event.target.checked)} />
              Bonus premier achat ({Intl.NumberFormat('fr-FR').format(config.firstPurchaseBonus)} points)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={applyBulkBonus && calculations.eligibleForBulk}
                onChange={event => setApplyBulkBonus(event.target.checked)}
                disabled={!calculations.eligibleForBulk}
              />
              Bonus volume ({config.bulkPurchaseBonus}% )
              {!calculations.eligibleForBulk && (
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                  seuil {formatMoney(config.bulkPurchaseThreshold)}
                </span>
              )}
            </label>
          </div>
        </div>

        <div className="flex-1 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-white/70 bg-white/70 p-4">
            <p className="text-sm font-semibold text-emerald-900">Calculateur de Points en Temps Réel</p>
            <div className="grid gap-2 text-sm text-emerald-800">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                <span>Achat de {formatMoney(purchaseAmount)} =</span>
                <strong className="text-emerald-600">{formatPoints(calculations.basePoints)}</strong>
              </div>
              {premiumActive && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                  <span>+ Bonus Premium ({config.premiumVendorBonus}% ) =</span>
                  <strong className="text-emerald-600">+{formatPoints(calculations.premiumPoints)}</strong>
                </div>
              )}
              {weekendActive && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                  <span>+ Bonus Week-end ({config.weekendBonus}% ) =</span>
                  <strong className="text-emerald-600">+{formatPoints(calculations.weekendPoints)}</strong>
                </div>
              )}
              {referralActive && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                  <span>+ Bonus Parrainage ({config.referralBonus}% ) =</span>
                  <strong className="text-emerald-600">+{formatPoints(calculations.referralPoints)}</strong>
                </div>
              )}
              {firstPurchaseActive && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                  <span>+ Bonus Premier achat =</span>
                  <strong className="text-emerald-600">+{formatPoints(calculations.firstPurchasePoints)}</strong>
                </div>
              )}
              {calculations.bulkPoints > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                  <span>+ Bonus Volume ({config.bulkPurchaseBonus}% ) =</span>
                  <strong className="text-emerald-600">+{formatPoints(calculations.bulkPoints)}</strong>
                </div>
              )}
            </div>
            <div className="grid gap-2 rounded-lg bg-emerald-100/70 px-3 py-3 text-sm font-semibold text-emerald-900">
              <div className="flex items-center justify-between">
                <span>Total points gagnés =</span>
                <span>{formatPoints(calculations.totalPoints)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-white/70 bg-white/70 p-4">
            <p className="text-sm font-semibold text-emerald-900">Projection de Retrait</p>
            <div className="grid gap-2 text-sm text-emerald-800">
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                <span>Valeur des points =</span>
                <strong className="text-emerald-600">{formatCurrency(calculations.pointsValue)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                <span>Retrait possible =</span>
                <strong className="text-emerald-600">{formatCurrency(calculations.pointsValue)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                <span>Frais de retrait =</span>
                <strong className="text-rose-600">{formatCurrency(calculations.withdrawalFees)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-emerald-100/70 px-3 py-3 font-semibold">
                <span>Montant net retrait =</span>
                <span className="text-emerald-700">{formatCurrency(calculations.netWithdrawal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PointsConfigurationProps {
  config: AdminPointSettings
  setConfig: Dispatch<SetStateAction<AdminPointSettings>>
  categories: ProductCategoryRecord[]
  onSave: () => Promise<void>
  onTest: () => Promise<void>
  onReset: () => Promise<void>
  isSaving: boolean
  isTesting: boolean
  isResetting: boolean
}

/**
 * Parse une valeur numérique provenant d'un champ <input type="number" />.
 * Objectif: supporter les saisies avec virgule (ex: "0,5") qui donneraient NaN avec Number().
 */
function parseNumberInput(value: string): number {
  const normalized = String(value ?? '').trim().replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Affiche l'ensemble des paramètres configurables pour les points de fidélité admin.
 */
export default function PointsConfiguration({
  config,
  setConfig,
  categories,
  onSave,
  onTest,
  onReset,
  isSaving,
  isTesting,
  isResetting
}: PointsConfigurationProps) {
  const { currencyCode } = useMoney()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration des Points de Fidélité</CardTitle>
        <CardDescription>
          Paramètres globaux appliqués aux conversions, frais et bonus liés aux récompenses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h4 className="text-lg font-semibold mb-4 text-gray-800">Valeurs des Points</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ValueCard
              label="Valeur d'achat sur le site"
              helper="Valeur appliquée lors des achats en marketplace"
              badge={`${currencyCode} par point`}
            >
              <Input
                type="number"
                step="0.01"
                value={config.purchaseValue}
                onChange={event => setConfig(previous => ({ ...previous, purchaseValue: parseNumberInput(event.target.value) }))}
                className="border-blue-300"
              />
            </ValueCard>

            <ValueCard
              label="Valeur de retrait"
              helper={`Conversion en ${currencyCode} lorsque les points sont retirés`}
              badge={`${currencyCode} par point`}
              tone="green"
            >
              <Input
                type="number"
                step="0.01"
                value={config.withdrawalValue}
                onChange={event => setConfig(previous => ({ ...previous, withdrawalValue: parseNumberInput(event.target.value) }))}
                className="border-green-300"
              />
            </ValueCard>

            <ValueCard
              label="Partage réseaux sociaux"
              helper="Points attribués à un partage social générique"
              badge="points par partage"
              tone="purple"
            >
              <Input
                type="number"
                value={config.socialShareValue}
                onChange={event => setConfig(previous => ({ ...previous, socialShareValue: parseNumberInput(event.target.value) }))}
                className="border-purple-300"
              />
            </ValueCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {SOCIAL_NETWORKS.map(network => (
              <div key={network.key} className={`p-4 border rounded-lg ${network.color}`}>
                <Label className="text-sm font-medium">{network.label}</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    type="number"
                    value={config.socialSharePerNetwork[network.key]}
                    onChange={event =>
                      setConfig(previous => ({
                        ...previous,
                        socialSharePerNetwork: {
                          ...previous.socialSharePerNetwork,
                          [network.key]: parseNumberInput(event.target.value)
                        }
                      }))
                    }
                    className="border-purple-200"
                  />
                  <span className="text-sm text-purple-700">points</span>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Configure le nombre de points offert pour {network.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4 text-gray-800">Seuils et Frais</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ThresholdCard
              label="Seuil minimum retrait"
              helper="Minimum requis pour permettre un retrait"
              suffix="points"
              tone="orange"
            >
              <Input
                type="number"
                value={config.minWithdrawal}
                onChange={event => setConfig(previous => ({ ...previous, minWithdrawal: parseNumberInput(event.target.value) }))}
                className="border-orange-300"
              />
            </ThresholdCard>

            <ThresholdCard
              label="Seuil maximum retrait"
              helper="Plafond autorisé pour un retrait"
              suffix="points"
              tone="red"
            >
              <Input
                type="number"
                value={config.maxWithdrawal}
                onChange={event => setConfig(previous => ({ ...previous, maxWithdrawal: parseNumberInput(event.target.value) }))}
                className="border-red-300"
              />
            </ThresholdCard>

            <ThresholdCard
              label="Frais de transfert"
              helper="Appliqués lors des transferts de points"
              suffix="points"
              tone="yellow"
            >
              <Input
                type="number"
                value={config.transferFees}
                onChange={event => setConfig(previous => ({ ...previous, transferFees: parseNumberInput(event.target.value) }))}
                className="border-yellow-300"
              />
            </ThresholdCard>

            <ThresholdCard
              label="Minimum transfert"
              helper="Montant minimum autorisé pour un transfert"
              suffix="points"
              tone="yellow"
            >
              <Input
                type="number"
                value={config.transferMin}
                onChange={event => setConfig(previous => ({ ...previous, transferMin: parseNumberInput(event.target.value) }))}
                className="border-yellow-300"
              />
            </ThresholdCard>

            <ThresholdCard
              label="Maximum par transfert"
              helper="Plafond autorisé pour un transfert"
              suffix="points"
              tone="yellow"
            >
              <Input
                type="number"
                value={config.transferMax}
                onChange={event => setConfig(previous => ({ ...previous, transferMax: parseNumberInput(event.target.value) }))}
                className="border-yellow-300"
              />
            </ThresholdCard>

            <ThresholdCard
              label="Maximum par jour"
              helper="Limite journalière de transfert (tous transferts cumulés)"
              suffix="points"
              tone="yellow"
            >
              <Input
                type="number"
                value={config.transferDailyMax}
                onChange={event => setConfig(previous => ({ ...previous, transferDailyMax: parseNumberInput(event.target.value) }))}
                className="border-yellow-300"
              />
            </ThresholdCard>

            <ThresholdCard
              label="Frais d'échange"
              helper="Prélevés quand les points sont échangés contre une récompense"
              suffix="points"
              tone="teal"
            >
              <Input
                type="number"
                value={config.exchangeFee}
                onChange={event => setConfig(previous => ({ ...previous, exchangeFee: parseNumberInput(event.target.value) }))}
                className="border-teal-300"
              />
            </ThresholdCard>

            <ThresholdCard
              label="Frais d'achat"
              helper="Frais appliqués sur le prix d'un achat de points (ex: 2 = 2%)"
              suffix="%"
              tone="blue"
            >
              <Input
                type="number"
                step="0.1"
                value={config.purchaseFeePercent}
                onChange={event => setConfig(previous => ({ ...previous, purchaseFeePercent: parseNumberInput(event.target.value) }))}
                className="border-blue-300"
              />
            </ThresholdCard>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4 text-gray-800">Règles de Gain Configurables</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <BonusCard
              label={`Points de base par ${currencyCode}`}
              helper={`Nombre de points alloué par ${currencyCode} dépensé`}
              suffix={`points/${currencyCode}`}
              tone="blue"
            >
              <Input
                type="number"
                step="0.1"
                value={config.basePointsPerFCFA}
                onChange={event => setConfig(previous => ({ ...previous, basePointsPerFCFA: parseNumberInput(event.target.value) }))}
                className="border-blue-300"
              />
            </BonusCard>

            <BonusCard
              label="Bonus Vendeur Premium"
              helper="Pourcentage bonus accordé aux vendeurs premium"
              suffix="%"
              tone="green"
            >
              <Input
                type="number"
                value={config.premiumVendorBonus}
                onChange={event => setConfig(previous => ({ ...previous, premiumVendorBonus: parseNumberInput(event.target.value) }))}
                className="border-green-300"
              />
            </BonusCard>

            <BonusCard
              label="Bonus Parrainage"
              helper="Pourcentage bonus accordé aux parrainages"
              suffix="%"
              tone="purple"
            >
              <Input
                type="number"
                value={config.referralBonus}
                onChange={event => setConfig(previous => ({ ...previous, referralBonus: parseNumberInput(event.target.value) }))}
                className="border-purple-300"
              />
            </BonusCard>

            <BonusCard
              label="Bonus Premier Achat"
              helper="Points additionnels lors du premier achat"
              suffix="points"
              tone="orange"
            >
              <Input
                type="number"
                value={config.firstPurchaseBonus}
                onChange={event => setConfig(previous => ({ ...previous, firstPurchaseBonus: parseNumberInput(event.target.value) }))}
                className="border-orange-300"
              />
            </BonusCard>

            <BonusCard
              label="Bonus Week-end"
              helper="Pourcentage bonus appliqué le week-end"
              suffix="%"
              tone="indigo"
            >
              <Input
                type="number"
                value={config.weekendBonus}
                onChange={event => setConfig(previous => ({ ...previous, weekendBonus: parseNumberInput(event.target.value) }))}
                className="border-indigo-300"
              />
            </BonusCard>

            <BonusCard
              label="Bonus Achats en Volume"
              helper="Pourcentage bonus pour les gros paniers"
              suffix="%"
              tone="pink"
            >
              <Input
                type="number"
                value={config.bulkPurchaseBonus}
                onChange={event => setConfig(previous => ({ ...previous, bulkPurchaseBonus: parseNumberInput(event.target.value) }))}
                className="border-pink-300"
              />
            </BonusCard>

            <BonusCard
              label="Seuil Achats en Volume"
              helper={`Montant en ${currencyCode} déclenchant le bonus volume`}
              suffix={currencyCode}
              tone="yellow"
            >
              <Input
                type="number"
                step="1000"
                value={config.bulkPurchaseThreshold}
                onChange={event => setConfig(previous => ({ ...previous, bulkPurchaseThreshold: parseNumberInput(event.target.value) }))}
                className="border-yellow-300"
              />
            </BonusCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const bonus = (config.categoryBonuses ?? {})[category.id] ?? 0

              return (
                <div key={category.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <Label className="text-sm font-medium">Bonus {category.name}</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      type="number"
                      value={bonus}
                      onChange={event =>
                        setConfig(previous => ({
                          ...previous,
                          categoryBonuses: {
                            ...(previous.categoryBonuses ?? {}),
                            [category.id]: parseNumberInput(event.target.value)
                          }
                        }))
                      }
                      className="border-gray-300"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <RealtimePointsCalculator config={config} />

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-orange-300 text-orange-600 hover:bg-orange-50"
            onClick={onReset}
            disabled={isResetting || isSaving || isTesting}
          >
            {isResetting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Réinitialiser
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
            onClick={onTest}
            disabled={isTesting || isSaving}
          >
            {isTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Tester la configuration
          </Button>
          <Button
            type="button"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Sauvegarder
          </Button>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700 text-sm flex items-start gap-3">
          <Wand2 className="h-5 w-5 mt-0.5" />
          <p>
            Les frais d'échange s'appliquent lorsque vendeurs ou clients utilisent leurs points pour récupérer une
            récompense (réduction, produit gratuit, carte cadeau…). Les réglages ci-dessus impactent directement le
            calcul des coûts d'échange sur leurs tableaux de bord.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

interface ValueCardProps {
  label: string
  helper: string
  badge: string
  tone?: 'blue' | 'green' | 'purple'
  children: ReactNode
}

/**
 * Affiche un encart de saisie pour une valeur de conversion de points.
 */
function ValueCard({ label, helper, badge, tone = 'blue', children }: ValueCardProps) {
  const toneClass =
    tone === 'green'
      ? 'bg-green-50 border-green-200 text-green-800'
      : tone === 'purple'
      ? 'bg-purple-50 border-purple-200 text-purple-800'
      : 'bg-blue-50 border-blue-200 text-blue-800'

  return (
    <div className={`p-4 border rounded-lg ${toneClass}`}>
      <Label className="text-sm font-medium text-inherit">{label}</Label>
      <div className="mt-2 flex items-center gap-2">
        {children}
        <Badge variant="secondary" className="text-xs font-medium">
          {badge}
        </Badge>
      </div>
      <p className="text-xs mt-1 text-inherit/80">{helper}</p>
    </div>
  )
}

interface ThresholdCardProps {
  label: string
  helper: string
  suffix: string
  tone: 'orange' | 'red' | 'yellow' | 'teal'
  children: ReactNode
}

/**
 * Affiche un encart dédié aux seuils et aux frais appliqués sur les opérations.
 */
function ThresholdCard({ label, helper, suffix, tone, children }: ThresholdCardProps) {
  const palette: Record<typeof tone, string> = {
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    teal: 'bg-teal-50 border-teal-200 text-teal-800'
  }

  return (
    <div className={`p-4 border rounded-lg ${palette[tone]}`}>
      <Label className="text-sm font-medium text-inherit">{label}</Label>
      <div className="mt-2 flex items-center gap-2">
        {children}
        <span className="text-sm font-medium text-inherit/80">{suffix}</span>
      </div>
      <p className="text-xs mt-1 text-inherit/80">{helper}</p>
    </div>
  )
}

interface BonusCardProps {
  label: string
  helper: string
  suffix: string
  tone: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'pink' | 'yellow'
  children: ReactNode
}

/**
 * Affiche un encart de saisie pour les bonus appliqués aux programmes de points.
 */
function BonusCard({ label, helper, suffix, tone, children }: BonusCardProps) {
  const palette: Record<typeof tone, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    pink: 'bg-pink-50 border-pink-200 text-pink-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  }

  return (
    <div className={`p-4 border rounded-lg ${palette[tone]}`}>
      <Label className="text-sm font-medium text-inherit">{label}</Label>
      <div className="mt-2 flex items-center gap-2">
        {children}
        <span className="text-sm font-medium text-inherit/80">{suffix}</span>
      </div>
      <p className="text-xs mt-1 text-inherit/80">{helper}</p>
    </div>
  )
}
