"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle, Loader2, RefreshCw, Store, ThumbsDown, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export interface SellerApplication {
  id: string
  application_number: string | null
  business_name: string
  owner_name: string
  email: string
  phone: string
  category: string | null
  experience: string | null
  monthly_revenue: string | null
  description: string | null
  status: "pending" | "approved" | "rejected"
  review_notes: string | null
  reviewed_at: string | null
  submitted_at: string
}

type StatusFilter = "all" | "pending" | "approved" | "rejected"

const STATUS_LABELS: Record<SellerApplication["status"], string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Rejetée"
}

const STATUS_STYLES: Record<SellerApplication["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800"
}

/**
 * Section Super Admin : candidatures "Devenir Vendeur".
 * Liste, étude détaillée, approbation et rejet motivé.
 */
export default function SellerApplicationsAdmin() {
  const [applications, setApplications] = useState<SellerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<StatusFilter>("pending")
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [notice, setNotice] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/super-admin/seller-applications", { cache: "no-store" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Impossible de charger les candidatures.")
      setApplications(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const approve = async (id: string) => {
    setActionId(id)
    setNotice("")
    try {
      const res = await fetch(`/api/super-admin/seller-applications/${id}/approve`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Échec de l'approbation.")
      setNotice(json.roleUpdated
        ? "Candidature approuvée : le compte existant a été promu vendeur."
        : "Candidature approuvée.")
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "approved" as const, review_notes: null } : a))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.")
    } finally {
      setActionId(null)
    }
  }

  const reject = async (id: string) => {
    if (!rejectReason.trim()) {
      setError("Veuillez saisir un motif de rejet.")
      return
    }
    setActionId(id)
    setNotice("")
    try {
      const res = await fetch(`/api/super-admin/seller-applications/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Échec du rejet.")
      setNotice("Candidature rejetée avec motif.")
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "rejected" as const, review_notes: rejectReason.trim() } : a))
      )
      setRejectingId(null)
      setRejectReason("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.")
    } finally {
      setActionId(null)
    }
  }

  const filtered = applications.filter((a) => (filter === "all" ? true : a.status === filter))
  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Candidatures Vendeur</h2>
          <p className="text-sm text-gray-500">
            Étudiez les demandes du formulaire « Devenir Vendeur », puis approuvez-les ou rejetez-les avec motif.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualiser
        </Button>
      </div>

      {(error || notice) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {error || notice}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["pending", "approved", "rejected", "all"] as StatusFilter[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Toutes" : STATUS_LABELS[f as SellerApplication["status"]]} ({counts[f]})
          </Button>
        ))}
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement des candidatures…
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Aucune candidature pour ce filtre.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Store className="h-4 w-4 text-[#ff6600]" />
                    {a.business_name}
                    <span className="text-xs font-normal text-gray-400">#{a.application_number ?? a.id.slice(0, 8)}</span>
                  </CardTitle>
                  <Badge className={STATUS_STYLES[a.status]}>{STATUS_LABELS[a.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div><span className="text-gray-500">Responsable :</span> <strong>{a.owner_name}</strong></div>
                  <div><span className="text-gray-500">Email :</span> {a.email}</div>
                  <div><span className="text-gray-500">Téléphone :</span> {a.phone}</div>
                  <div><span className="text-gray-500">Soumise le :</span> {new Date(a.submitted_at).toLocaleDateString("fr-FR")}</div>
                  {a.category && <div><span className="text-gray-500">Catégorie :</span> {a.category}</div>}
                  {a.experience && <div><span className="text-gray-500">Expérience :</span> {a.experience}</div>}
                  {a.monthly_revenue && <div><span className="text-gray-500">Revenus mensuels :</span> {a.monthly_revenue}</div>}
                </div>

                {a.description && (
                  <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{a.description}</p>
                )}

                {a.status === "rejected" && a.review_notes && (
                  <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                    <strong>Motif du rejet :</strong> {a.review_notes}
                  </p>
                )}

                {a.status === "pending" && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => approve(a.id)}
                        disabled={actionId === a.id}
                      >
                        {actionId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setRejectingId(rejectingId === a.id ? null : a.id)
                          setRejectReason("")
                        }}
                        disabled={actionId === a.id}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        Rejeter avec motif
                      </Button>
                    </div>

                    {rejectingId === a.id && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Motif du rejet (communiqué au candidat)…"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => reject(a.id)}
                            disabled={actionId === a.id || !rejectReason.trim()}
                          >
                            <XCircle className="h-4 w-4" />
                            Confirmer le rejet
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setRejectingId(null)}>
                            Annuler
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
