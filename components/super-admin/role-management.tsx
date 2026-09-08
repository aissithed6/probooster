"use client"
import { useState, useEffect, useCallback } from 'react'
import { Shield, Plus, Edit2, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { roleService, ALL_SECTIONS, ALL_FEATURES, type RoleDefinition } from '@/lib/services/role-service'

const SL: Record<string, string> = {}
ALL_SECTIONS.forEach(s => { SL[s.id] = s.label })

export default function RoleManagement() {
  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [form, setForm] = useState({ role_code: '', role_name: '', description: '' })

  const load = useCallback(async () => {
    try { setLoading(true); setRoles(await roleService.getAllRoles()) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const create = async () => {
    try {
      await roleService.createRole({ ...form, sections: [], features: [] })
      setIsCreateOpen(false)
      setForm({ role_code: '', role_name: '', description: '' })
      load()
    } catch (e) { console.error(e) }
  }

  const update = async () => {
    if (!selectedRole) return
    try {
      await roleService.updateRole(selectedRole.role_code, {
        sections: selectedRole.sections,
        features: selectedRole.features
      })
      setIsEditOpen(false)
      load()
    } catch (e) { console.error(e) }
  }

  const remove = async (code: string) => {
    if (!confirm('Supprimer ?')) return
    try { await roleService.deleteRole(code); load() }
    catch (e) { console.error(e) }
  }

  const toggleSec = (r: RoleDefinition, s: string) => {
    setSelectedRole({
      ...r,
      sections: r.sections.includes(s) ? r.sections.filter(x => x !== s) : [...r.sections, s]
    })
  }

  const toggleFeat = (r: RoleDefinition, f: string) => {
    setSelectedRole({
      ...r,
      features: r.features.includes(f) ? r.features.filter(x => x !== f) : [...r.features, f]
    })
  }

  if (loading) return <div className="p-6">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestion des Rôles</h2>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Créer
        </Button>
      </div>
      <div className="grid gap-4">
        {roles.map(role => (
          <Card key={role.role_code}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-orange-500" />
                  <CardTitle className="text-lg">{role.role_name}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {role.is_system && <Badge variant="secondary">Système</Badge>}
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedRole(role); setIsEditOpen(true) }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {!role.is_system && (
                    <Button variant="ghost" size="sm" onClick={() => remove(role.role_code)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {role.sections.slice(0, 4).map(s => (
                  <Badge key={s} variant="outline" className="text-xs">{SL[s] || s}</Badge>
                ))}
                {role.sections.length > 4 && <Badge variant="outline" className="text-xs">+{role.sections.length - 4}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {isEditOpen && selectedRole && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Éditer: {selectedRole.role_name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Sections accessibles</h4>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_SECTIONS.map(sec => (
                    <div key={sec.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Switch checked={selectedRole.sections.includes(sec.id)} onCheckedChange={() => toggleSec(selectedRole, sec.id)} />
                      <span className="text-sm">{sec.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Fonctionnalités activées</h4>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_FEATURES.filter(f => f !== 'all_features').map(f => (
                    <div key={f} className="flex items-center space-x-2 p-2 border rounded">
                      <Switch checked={selectedRole.features.includes(f)} onCheckedChange={() => toggleFeat(selectedRole, f)} />
                      <span className="text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Annuler</Button>
                <Button onClick={update}><Save className="w-4 h-4 mr-2" /> Sauvegarder</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {isCreateOpen && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Créer un rôle</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Code</Label><Input value={form.role_code} onChange={e => setForm({ ...form, role_code: e.target.value })} /></div>
              <div><Label>Nom</Label><Input value={form.role_name} onChange={e => setForm({ ...form, role_name: e.target.value })} /></div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                <Button onClick={create} disabled={!form.role_code || !form.role_name}>Créer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}