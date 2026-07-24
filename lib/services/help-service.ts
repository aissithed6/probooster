import { supabase } from '@/lib/supabase'

export interface HelpCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  articles_count?: number
}

export interface HelpArticle {
  id: string
  category_id: string
  title: string
  content: string
  views: number
  rating: number
  is_popular: boolean
  icon?: any // Lucide icon
}

export interface FAQ {
  id: string
  question: string
  answer: string
}

export interface SupportTicket {
  id: string
  user_id?: string
  name: string
  email: string
  subject: string
  message: string
  department: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
}

export class HelpService {
  /**
   * Récupère toutes les catégories d'aide avec le nombre d'articles
   */
  static async getCategories(): Promise<HelpCategory[]> {
    try {
      const { data: categories, error } = await supabase
        .from('help_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('❌ Erreur détaillée catégories d\'aide:', error.message || error)
        return this.getFallbackCategories()
      }

      // Récupérer les comptes séparément pour éviter les erreurs de jointure complexe
      const categoriesWithCount = await Promise.all((categories || []).map(async (cat) => {
        const { count } = await supabase
          .from('help_articles')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id)
        
        return {
          ...cat,
          articles_count: count ?? 0
        }
      }))

      return categoriesWithCount
    } catch (e) {
      console.error('❌ Exception dans getCategories:', e)
      return this.getFallbackCategories()
    }
  }

  /**
   * Récupère les articles populaires
   */
  static async getPopularArticles(): Promise<HelpArticle[]> {
    try {
      const { data, error } = await supabase
        .from('help_articles')
        .select('*')
        .eq('is_active', true)
        .eq('is_popular', true)
        .order('views', { ascending: false })
        .limit(6)

      if (error) {
        console.error('❌ Erreur détaillée articles populaires:', error.message || error)
        return this.getFallbackPopularArticles()
      }

      return data || []
    } catch (e) {
      return this.getFallbackPopularArticles()
    }
  }

  /**
   * Récupère les FAQ
   */
  static async getFAQs(): Promise<FAQ[]> {
    try {
      const { data, error } = await supabase
        .from('help_faqs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('❌ Erreur détaillée FAQ:', error.message || error)
        return this.getFallbackFAQs()
      }

      return data || []
    } catch (e) {
      return this.getFallbackFAQs()
    }
  }

  // --- FALLBACKS EN CAS DE TABLES MANQUANTES ---

  private static getFallbackCategories(): HelpCategory[] {
    return [
      { id: '1', name: 'Général', description: 'Questions courantes', icon: 'HelpCircle', color: 'from-blue-500 to-cyan-500', articles_count: 5 },
      { id: '2', name: 'Compte', description: 'Gestion profil', icon: 'Users', color: 'from-green-500 to-emerald-500', articles_count: 3 },
      { id: '3', name: 'Shopping', description: 'Achats & Commandes', icon: 'ShoppingCart', color: 'from-orange-500 to-red-500', articles_count: 8 }
    ]
  }

  private static getFallbackPopularArticles(): HelpArticle[] {
    return [
      { id: 'p1', category_id: '1', title: 'Comment créer un compte ?', content: '...', views: 1200, rating: 4.8, is_popular: true },
      { id: 'p2', category_id: '3', title: 'Suivre ma commande', content: '...', views: 950, rating: 4.7, is_popular: true }
    ]
  }

  private static getFallbackFAQs(): FAQ[] {
    return [
      { id: 'f1', question: 'Quels sont les délais ?', answer: '2 à 5 jours ouvrés.' },
      { id: 'f2', question: 'Comment retourner un produit ?', answer: 'Allez dans Mes Commandes et cliquez sur Retourner.' }
    ]
  }

  /**
   * Recherche dans les articles d'aide
   */
  static async searchArticles(query: string): Promise<HelpArticle[]> {
    if (!query.trim()) return []

    const { data, error } = await supabase
      .from('help_articles')
      .select('*')
      .eq('is_active', true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.error('❌ Erreur lors de la recherche d\'articles:', error)
      return []
    }

    return data || []
  }

  /**
   * Récupère les articles par catégorie
   */
  static async getArticlesByCategory(categoryId: string): Promise<HelpArticle[]> {
    let query = supabase
      .from('help_articles')
      .select('*')
      .eq('is_active', true)
    
    if (categoryId !== 'all') {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query.order('views', { ascending: false })

    if (error) {
      console.error('❌ Erreur lors de la récupération des articles par catégorie:', error)
      return []
    }

    return data || []
  }

  /**
   * Crée un ticket de support
   */
  static async createTicket(ticket: Partial<SupportTicket>): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        ...ticket,
        status: 'open',
        priority: ticket.priority || 'medium'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur lors de la création du ticket de support:', error)
    }

    return { data, error }
  }
}
