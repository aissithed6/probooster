"use client"

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, Copy, Edit, Eye, EyeOff, Layers, Trash2 } from 'lucide-react'

import type { ProductCategoryRecord, ProductCategoryTreeNode } from '@/lib/types/product-category'

interface CategoryTreeNodeCardProps {
  node: ProductCategoryTreeNode
  onEdit: (category: ProductCategoryRecord) => void
  onToggle: (categoryId: string, isActive: boolean) => void
  onDuplicate: (category: ProductCategoryRecord) => void
  onDelete: (categoryId: string) => void
}

/**
 * Carte moderne présentant une catégorie et ses sous-niveaux.
 */
export function CategoryTreeNodeCard({ node, onEdit, onToggle, onDuplicate, onDelete }: CategoryTreeNodeCardProps) {
  const depthColor = useMemo(() => {
    if (node.depth === 0) return 'border-[#ff6600]' // racine flamboyante
    if (node.depth === 1) return 'border-[#535455]' // sous-catégorie
    if (node.depth === 2) return 'border-[#2d2d2d]' // niveau 3
    return 'border-gray-300'
  }, [node.depth])

  const statusBadge = node.is_active ? (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-500 border-gray-200">Masquée</Badge>
  )

  const hasChildren = node.children.length > 0

  return (
    <Card className={`group border-2 ${depthColor} transition-all hover:shadow-lg bg-white/90`}> 
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base text-gray-900">
            <Layers className="h-4 w-4 text-[#ff6600]" />
            {node.name}
            {statusBadge}
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            {node.slug ?? 'Slug automatique'}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Switch
                  checked={node.is_active}
                  onCheckedChange={(checked) => onToggle(node.id, checked)}
                  className="data-[state=checked]:bg-[#ff6600]"
                />
              </TooltipTrigger>
              <TooltipContent>Afficher ou masquer</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-[#ff6600]/30 text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
            onClick={() => onDuplicate(node)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-[#535455]/30 text-[#535455] hover:bg-[#535455] hover:text-white"
            onClick={() => onEdit(node)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8 bg-red-50 text-red-600 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Archiver la catégorie ?</DialogTitle>
                <DialogDescription>
                  La catégorie ne sera plus visible dans les interfaces utilisateurs, mais restera récupérable en base.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Vérifiez que cette catégorie n’est plus utilisée par des produits actifs.
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Annuler</Button>
                <Button
                  variant="destructive"
                  onClick={() => onDelete(node.id)}
                >
                  Archiver
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
          <div className="space-y-1">
            <p className="font-semibold text-gray-800">Apparence</p>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full border" style={{ backgroundColor: node.colorTheme ?? '#ff6600' }} />
              <span>{node.displayMode ?? 'grid'}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-gray-800">SEO</p>
            <p>{node.seoTitle ?? 'Titre SEO non défini'}</p>
          </div>
        </div>

        {node.description && (
          <p className="text-sm text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3">
            {node.description}
          </p>
        )}

        {hasChildren && (
          <div className="space-y-2">
            <Separator className="bg-gray-200" />
            <p className="text-xs font-semibold text-gray-500">Sous-niveaux ({node.children.length})</p>
            <div className="space-y-1">
              {node.children.map((child) => (
                <div key={child.id} className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Eye className={`h-3 w-3 ${child.is_active ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span>{child.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {child.slug ?? 'slug-auto'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-[#ff6600]"
                      onClick={() => onEdit(child)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
