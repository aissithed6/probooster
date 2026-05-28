"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export type ConfirmOptions = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  tone?: 'default' | 'destructive'
}

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmDialogContext = createContext<ConfirmContextValue | null>(null)

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    open: boolean
    options: ConfirmOptions
    resolver?: (value: boolean) => void
  }>({ open: false, options: { message: '' } })

  const close = useCallback((value: boolean) => {
    setState(prev => {
      const resolver = prev.resolver
      // fermer avant de résoudre pour éviter tout glitch visuel
      setTimeout(() => resolver?.(value), 0)
      return { open: false, options: { message: '' }, resolver: undefined }
    })
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, options, resolver: resolve })
    })
  }, [])

  const value = useMemo(() => ({ confirm }), [confirm])

  const { title, message, confirmText, cancelText, tone } = state.options

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <Dialog open={state.open} onOpenChange={(open) => { if (!open) close(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title ?? 'Confirmation'}</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => close(false)}>
              {cancelText ?? 'Annuler'}
            </Button>
            <Button
              className={tone === 'destructive' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#ff6600] hover:bg-[#ff6600]/90 text-white'}
              onClick={() => close(true)}
            >
              {confirmText ?? 'Confirmer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmDialogContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmDialogContext)
  const fallback = useCallback(async (options: ConfirmOptions) => {
    // Fallback sans régression si Provider absent
    // eslint-disable-next-line no-alert
    return Promise.resolve(confirm(`${options.title ? options.title + '\n\n' : ''}${options.message}`))
  }, [])
  return ctx ?? { confirm: fallback }
}
