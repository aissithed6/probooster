import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // État pour stocker la valeur
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${key} depuis localStorage:`, error)
      return initialValue
    }
  })

  // Fonction pour définir la valeur
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permettre à value d'être une fonction pour avoir la même API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Sauvegarder dans l'état
      setStoredValue(valueToStore)
      
      // Sauvegarder dans localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Erreur lors de l'écriture de ${key} dans localStorage:`, error)
    }
  }

  // Fonction pour supprimer la valeur
  const removeValue = () => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${key} depuis localStorage:`, error)
    }
  }

  // Synchroniser avec les changements dans d'autres onglets
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.error(`Erreur lors de la synchronisation de ${key}:`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue, removeValue] as const
}

// Hook spécialisé pour les tableaux
export function useLocalStorageArray<T>(key: string, initialValue: T[] = []) {
  const [value, setValue, removeValue] = useLocalStorage<T[]>(key, initialValue)

  const addItem = (item: T) => {
    setValue(prev => [...prev, item])
  }

  const removeItem = (predicate: (item: T) => boolean) => {
    setValue(prev => prev.filter(predicate))
  }

  const updateItem = (predicate: (item: T) => boolean, updates: Partial<T>) => {
    setValue(prev => prev.map(item => predicate(item) ? { ...item, ...updates } : item))
  }

  const findItem = (predicate: (item: T) => boolean) => {
    return value.find(predicate)
  }

  const hasItem = (predicate: (item: T) => boolean) => {
    return value.some(predicate)
  }

  const clear = () => {
    setValue([])
  }

  return {
    value,
    setValue,
    removeValue,
    addItem,
    removeItem,
    updateItem,
    findItem,
    hasItem,
    clear,
    count: value.length
  }
}

// Hook spécialisé pour les objets
export function useLocalStorageObject<T extends Record<string, any>>(key: string, initialValue: T) {
  const [value, setValue, removeValue] = useLocalStorage<T>(key, initialValue)

  const updateField = <K extends keyof T>(field: K, newValue: T[K]) => {
    setValue(prev => ({ ...prev, [field]: newValue }))
  }

  const removeField = <K extends keyof T>(field: K) => {
    setValue(prev => {
      const newValue = { ...prev }
      delete newValue[field]
      return newValue
    })
  }

  return {
    value,
    setValue,
    removeValue,
    updateField,
    removeField
  }
}

// Hook pour les valeurs numériques
export function useLocalStorageNumber(key: string, initialValue: number = 0) {
  const [value, setValue, removeValue] = useLocalStorage<number>(key, initialValue)

  const increment = (amount: number = 1) => {
    setValue(prev => prev + amount)
  }

  const decrement = (amount: number = 1) => {
    setValue(prev => Math.max(0, prev - amount))
  }

  const multiply = (factor: number) => {
    setValue(prev => prev * factor)
  }

  const divide = (divisor: number) => {
    setValue(prev => divisor !== 0 ? prev / divisor : prev)
  }

  return {
    value,
    setValue,
    removeValue,
    increment,
    decrement,
    multiply,
    divide
  }
}

// Hook pour les valeurs booléennes
export function useLocalStorageBoolean(key: string, initialValue: boolean = false) {
  const [value, setValue, removeValue] = useLocalStorage<boolean>(key, initialValue)

  const toggle = () => {
    setValue(prev => !prev)
  }

  const setTrue = () => {
    setValue(true)
  }

  const setFalse = () => {
    setValue(false)
  }

  return {
    value,
    setValue,
    removeValue,
    toggle,
    setTrue,
    setFalse
  }
}
