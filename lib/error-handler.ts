// Types d'erreurs
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType
  message: string
  code?: string
  details?: any
  timestamp: Date
  stack?: string
}

// Classe pour gérer les erreurs
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorLog: AppError[] = []

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  // Créer une erreur typée
  createError(
    type: ErrorType,
    message: string,
    code?: string,
    details?: any
  ): AppError {
    const error: AppError = {
      type,
      message,
      code,
      details,
      timestamp: new Date(),
      stack: new Error().stack
    }

    this.logError(error)
    return error
  }

  // Gérer une erreur JavaScript native
  handleError(error: Error | unknown, context?: string): AppError {
    let appError: AppError

    if (error instanceof Error) {
      appError = {
        type: this.determineErrorType(error),
        message: error.message,
        code: error.name,
        details: { context, originalError: error },
        timestamp: new Date(),
        stack: error.stack
      }
    } else {
      appError = {
        type: ErrorType.UNKNOWN,
        message: String(error),
        details: { context, originalError: error },
        timestamp: new Date()
      }
    }

    this.logError(appError)
    return appError
  }

  // Déterminer le type d'erreur basé sur le message ou le nom
  private determineErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase()
    const name = error.name.toLowerCase()

    if (name.includes('network') || message.includes('fetch') || message.includes('network')) {
      return ErrorType.NETWORK
    }
    if (name.includes('validation') || message.includes('validation')) {
      return ErrorType.VALIDATION
    }
    if (name.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return ErrorType.AUTHENTICATION
    }
    if (message.includes('not found') || message.includes('404')) {
      return ErrorType.NOT_FOUND
    }
    if (message.includes('server') || message.includes('500')) {
      return ErrorType.SERVER
    }

    return ErrorType.UNKNOWN
  }

  // Logger une erreur
  private logError(error: AppError): void {
    this.errorLog.push(error)
    
    // Limiter la taille du log
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-50)
    }

    // Logger dans la console en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error:', {
        type: error.type,
        message: error.message,
        code: error.code,
        timestamp: error.timestamp,
        details: error.details
      })
    }

    // Ici, vous pourriez envoyer l'erreur à un service de monitoring
    // comme Sentry, LogRocket, etc.
  }

  // Obtenir le log d'erreurs
  getErrorLog(): AppError[] {
    return [...this.errorLog]
  }

  // Nettoyer le log d'erreurs
  clearErrorLog(): void {
    this.errorLog = []
  }

  // Obtenir les erreurs par type
  getErrorsByType(type: ErrorType): AppError[] {
    return this.errorLog.filter(error => error.type === type)
  }

  // Obtenir les erreurs récentes
  getRecentErrors(limit: number = 10): AppError[] {
    return this.errorLog.slice(-limit)
  }
}

// Fonction utilitaire pour gérer les erreurs de localStorage
export function handleLocalStorageError(operation: string, key: string, error: unknown): void {
  const errorHandler = ErrorHandler.getInstance()
  
  errorHandler.handleError(error, `localStorage.${operation}(${key})`)
}

// Fonction utilitaire pour gérer les erreurs de fetch
export function handleFetchError(response: Response, context?: string): AppError {
  const errorHandler = ErrorHandler.getInstance()
  
  let errorType = ErrorType.NETWORK
  let message = `HTTP ${response.status}: ${response.statusText}`

  if (response.status === 401) {
    errorType = ErrorType.AUTHENTICATION
    message = 'Non autorisé. Veuillez vous connecter.'
  } else if (response.status === 403) {
    errorType = ErrorType.AUTHORIZATION
    message = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.'
  } else if (response.status === 404) {
    errorType = ErrorType.NOT_FOUND
    message = 'Ressource non trouvée.'
  } else if (response.status >= 500) {
    errorType = ErrorType.SERVER
    message = 'Erreur serveur. Veuillez réessayer plus tard.'
  }

  return errorHandler.createError(errorType, message, `HTTP_${response.status}`, {
    context,
    url: response.url,
    status: response.status,
    statusText: response.statusText
  })
}

// Fonction utilitaire pour gérer les erreurs de validation
export function handleValidationError(field: string, message: string): AppError {
  const errorHandler = ErrorHandler.getInstance()
  
  return errorHandler.createError(
    ErrorType.VALIDATION,
    `Erreur de validation pour ${field}: ${message}`,
    'VALIDATION_ERROR',
    { field, message }
  )
}

// Hook React pour gérer les erreurs
export function useErrorHandler() {
  const errorHandler = ErrorHandler.getInstance()

  const handleError = (error: Error | unknown, context?: string) => {
    return errorHandler.handleError(error, context)
  }

  const createError = (type: ErrorType, message: string, code?: string, details?: any) => {
    return errorHandler.createError(type, message, code, details)
  }

  const getRecentErrors = (limit?: number) => {
    return errorHandler.getRecentErrors(limit)
  }

  return {
    handleError,
    createError,
    getRecentErrors,
    errorLog: errorHandler.getErrorLog()
  }
}

// Wrapper pour les fonctions asynchrones
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      const errorHandler = ErrorHandler.getInstance()
      const appError = errorHandler.handleError(error, context)
      throw appError
    }
  }
}

// Wrapper pour les fonctions synchrones
export function withErrorHandlingSync<T extends any[], R>(
  fn: (...args: T) => R,
  context?: string
) {
  return (...args: T): R => {
    try {
      return fn(...args)
    } catch (error) {
      const errorHandler = ErrorHandler.getInstance()
      const appError = errorHandler.handleError(error, context)
      throw appError
    }
  }
}

// Fonction pour formater les messages d'erreur pour l'utilisateur
export function formatErrorMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.'
    case ErrorType.VALIDATION:
      return error.message
    case ErrorType.AUTHENTICATION:
      return 'Session expirée. Veuillez vous reconnecter.'
    case ErrorType.AUTHORIZATION:
      return 'Vous n\'avez pas les permissions nécessaires pour cette action.'
    case ErrorType.NOT_FOUND:
      return 'La ressource demandée n\'existe pas.'
    case ErrorType.SERVER:
      return 'Erreur serveur. Veuillez réessayer plus tard.'
    case ErrorType.CLIENT:
      return 'Erreur de saisie. Vérifiez vos informations et réessayez.'
    default:
      return 'Une erreur inattendue s\'est produite. Veuillez réessayer.'
  }
}

// Fonction pour déterminer si une erreur est récupérable
export function isRecoverableError(error: AppError): boolean {
  return error.type === ErrorType.NETWORK || 
         error.type === ErrorType.VALIDATION || 
         error.type === ErrorType.CLIENT
}

// Fonction pour obtenir une suggestion d'action basée sur le type d'erreur
export function getErrorSuggestion(error: AppError): string {
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'Vérifiez votre connexion internet et réessayez.'
    case ErrorType.VALIDATION:
      return 'Vérifiez les informations saisies et réessayez.'
    case ErrorType.AUTHENTICATION:
      return 'Connectez-vous à nouveau pour continuer.'
    case ErrorType.AUTHORIZATION:
      return 'Contactez l\'administrateur pour obtenir les permissions nécessaires.'
    case ErrorType.NOT_FOUND:
      return 'Vérifiez l\'URL ou naviguez vers une autre page.'
    case ErrorType.SERVER:
      return 'Réessayez dans quelques minutes ou contactez le support.'
    case ErrorType.CLIENT:
      return 'Actualisez la page et réessayez.'
    default:
      return 'Actualisez la page ou contactez le support si le problème persiste.'
  }
}
