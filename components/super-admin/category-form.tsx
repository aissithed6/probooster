"use client"

import { useEffect, useRef, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

interface CategoryFormProps {
  mode: 'create' | 'edit'
  formData: {
    name: string
    slug: string
    description: string
    parentId: string | null
    icon: string
    isActive: boolean
    colorTheme: string
    displayMode: 'grid' | 'list' | 'carousel' | 'hero'
    seoTitle: string
    seoDescription: string
    seoKeywords: string
    imageUrl: string
  }
  setFormData: (updater: CategoryFormProps['formData'] | ((prev: CategoryFormProps['formData']) => CategoryFormProps['formData'])) => void
  onSubmit: () => Promise<void>
  onCancel: () => void
  isOpen: boolean
  categoryOptions: Array<{ id: string; label: string }>
}

/**
 * Formulaire moderne pour créer/éditer une catégorie produit.
 */
export function CategoryForm({ mode, formData, setFormData, onSubmit, onCancel, isOpen, categoryOptions }: CategoryFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Convertit un fichier image uploadé en Data URL et l’injecte dans le formulaire.
   */
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Merci de choisir une image de moins de 2 Mo.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      if (result) {
        handleChange('imageUrl', result)
      }
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }
  }, [isOpen])

  const handleChange = (field: keyof CategoryFormProps['formData'], value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async () => {
    await onSubmit()
  }

  return (
    <Card className="h-full border-none shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
          <Sparkles className="h-5 w-5 text-[#ff6600]" />
          {mode === 'create' ? 'Créer une nouvelle catégorie' : 'Mettre à jour la catégorie'}
        </CardTitle>
        <CardDescription>
          Complétez les informations pour une catégorie parfaitement présentée et optimisée.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nom de la catégorie</Label>
            <Input
              value={formData.name}
              onChange={(event) => handleChange('name', event.target.value)}
              placeholder="Ex: Mode & Accessoires"
              className="focus-visible:border-[#ff6600] focus-visible:ring-[#ff6600]"
            />
          </div>
          <div className="space-y-2">
            <Label>Slug personnalisé</Label>
            <Input
              value={formData.slug}
              onChange={(event) => handleChange('slug', event.target.value)}
              placeholder="mode-accessoires"
              className="focus-visible:border-[#ff6600] focus-visible:ring-[#ff6600]"
            />
          </div>
          <div className="space-y-2">
            <Label>Catégorie parente</Label>
            <Select
              value={formData.parentId ?? 'root'}
              onValueChange={(value) => handleChange('parentId', value === 'root' ? null : value)}
            >
              <SelectTrigger className="focus-visible:border-[#ff6600] focus-visible:ring-[#ff6600]">
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Aucune (catégorie racine)</SelectItem>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Icône (optionnelle)</Label>
            <Input
              value={formData.icon}
              onChange={(event) => handleChange('icon', event.target.value)}
              placeholder="ex: shopping-bag"
              className="focus-visible:border-[#ff6600] focus-visible:ring-[#ff6600]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description créative</Label>
          <Textarea
            value={formData.description}
            onChange={(event) => handleChange('description', event.target.value)}
            placeholder="Ajoutez une description immersive pour vos clients et votre SEO..."
            className="min-h-[120px] focus-visible:border-[#ff6600] focus-visible:ring-[#ff6600]"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Couleur de mise en avant</Label>
            <Input
              type="color"
              value={formData.colorTheme}
              onChange={(event) => handleChange('colorTheme', event.target.value)}
              className="h-11 cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <Label>Mode d’affichage</Label>
            <Select value={formData.displayMode} onValueChange={(value) => handleChange('displayMode', value)}>
              <SelectTrigger className="focus-visible:border-[#ff6600] focus-visible:ring-[#ff6600]">
                <SelectValue placeholder="Choisir un mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grille dynamique</SelectItem>
                <SelectItem value="list">Liste éditoriale</SelectItem>
                <SelectItem value="carousel">Carousel premium</SelectItem>
                <SelectItem value="hero">Hero immersif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Titre SEO</Label>
            <Input
              value={formData.seoTitle}
              onChange={(event) => handleChange('seoTitle', event.target.value)}
              placeholder="Titre optimisé pour la recherche"
              className="focus-visible:border-[#ff6600] focus-visible:ring-[#ff6600]"
            />
          </div>
          <div className="space-y-2">
            <Label>Mots-clés SEO</Label>
            <Input
              value={formData.seoKeywords}
              onChange={(event) => handleChange('seoKeywords', event.target.value)}
              placeholder="mot1, mot2, mot3"
              className="focus-visible:border-[#ff6600] focus-visible:ring-[#ff6600]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description SEO</Label>
          <Textarea
            value={formData.seoDescription}
            onChange={(event) => handleChange('seoDescription', event.target.value)}
            placeholder="Décrivez en quelques lignes l’univers de votre catégorie..."
            className="min-h-[100px] focus-visible:border-[#ff6600] focus-visible:ring-[#ff6600]"
          />
        </div>

        <div className="space-y-3">
          <Label>Image de couverture</Label>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Input
                value={formData.imageUrl}
                onChange={(event) => handleChange('imageUrl', event.target.value)}
                placeholder="https://..."
                className="focus-visible:border-[#ff6600] focus-visible:ring-[#ff6600]"
              />
              <p className="text-xs text-gray-500">Collez une URL si votre visuel est déjà hébergé.</p>
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                onClick={() => fileInputRef.current?.click()}
              >
                Importer un visuel
              </Button>
              <p className="text-xs text-gray-500">Formats acceptés : JPG, PNG, WebP – 2 Mo max.</p>
            </div>
          </div>
          {formData.imageUrl && (
            <div className="overflow-hidden rounded-lg border border-dashed border-[#ff6600]/40">
              <img
                src={formData.imageUrl}
                alt="Prévisualisation de la catégorie"
                className="h-48 w-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border border-dashed border-gray-200 rounded-lg p-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Catégorie active</p>
            <p className="text-xs text-gray-500">
              Si désactivée, la catégorie restera cachée de toutes les interfaces jusqu’à réactivation.
            </p>
          </div>
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => handleChange('isActive', checked)}
            className="data-[state=checked]:bg-[#ff6600]"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white">
            Annuler
          </Button>
          <Button onClick={handleSubmit} className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white">
            {mode === 'create' ? 'Créer la catégorie' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
