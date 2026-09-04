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
      { id: 'gen', name: 'Général', description: 'Questions courantes sur Probooster', icon: 'HelpCircle', color: 'from-blue-500 to-cyan-500', articles_count: 5 },
      { id: 'compte', name: 'Compte & Profil', description: 'Gestion de votre compte et informations personnelles', icon: 'Users', color: 'from-green-500 to-emerald-500', articles_count: 4 },
      { id: 'shopping', name: 'Shopping', description: 'Tout sur l\'achat de produits et services', icon: 'ShoppingCart', color: 'from-orange-500 to-red-500', articles_count: 4 },
      { id: 'points', name: 'Système de Points', description: 'Comment gagner et utiliser vos points', icon: 'Gift', color: 'from-purple-500 to-violet-500', articles_count: 3 },
      { id: 'paiement', name: 'Paiement', description: 'Méthodes de paiement et sécurité', icon: 'CreditCard', color: 'from-yellow-500 to-orange-500', articles_count: 4 },
      { id: 'livraison', name: 'Livraison', description: 'Suivi de commande et délais de livraison', icon: 'Truck', color: 'from-indigo-500 to-purple-500', articles_count: 5 }
    ]
  }

  private static getFallbackPopularArticles(): HelpArticle[] {
    return [
      { id: 'fp1', category_id: 'gen', title: 'Bienvenue sur Probooster : guide de démarrage', content: '<h2>Bienvenue sur Probooster</h2><p>Guide de démarrage complet pour créer votre compte, explorer les catégories et passer votre première commande.</p>', views: 1500, rating: 4.9, is_popular: true },
      { id: 'fp2', category_id: 'shopping', title: 'Suivre ma commande en temps réel', content: '<h2>Suivi de commande</h2><p>Suivez l\'état de votre commande : confirmée, préparée, expédiée ou livrée.</p>', views: 1420, rating: 4.9, is_popular: true },
      { id: 'fp3', category_id: 'livraison', title: 'Quels sont les délais de livraison ?', content: '<h2>Délais indicatifs</h2><p>2 à 5 jours ouvrés en standard, 1 à 2 jours en express.</p>', views: 1390, rating: 4.8, is_popular: true },
      { id: 'fp4', category_id: 'livraison', title: 'Suivre ma livraison', content: '<h2>Suivi du colis</h2><p>Utilisez le numéro de suivi reçu par email pour suivre votre colis en temps réel.</p>', views: 1340, rating: 4.9, is_popular: true },
      { id: 'fp5', category_id: 'compte', title: 'Comment créer un compte ?', content: '<h2>Créer votre compte</h2><p>Créez votre compte gratuit en quelques minutes et validez votre email.</p>', views: 1320, rating: 4.8, is_popular: true },
      { id: 'fp6', category_id: 'paiement', title: 'Les paiements sont-ils sécurisés ?', content: '<h2>Sécurité des transactions</h2><p>Cryptage SSL de niveau bancaire pour toutes vos transactions.</p>', views: 1320, rating: 4.9, is_popular: true }
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
