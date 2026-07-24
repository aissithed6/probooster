"use client"

import React from 'react'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export type AnalyticsExportHandler = (type: string, format: string) => void | Promise<void>

type AnalyticsExportFormatMenuProps = {
  reportType: string
  onExport: AnalyticsExportHandler
  disabled?: boolean
  align?: 'start' | 'center' | 'end'
  contentClassName?: string
  children?: React.ReactNode
  /** Bouton par défaut si aucun enfant fourni */
  label?: string
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
}

/**
 * Menu d’export PDF / CSV / JSON — utilisé sur tous les onglets Statistiques & Analyses.
 */
export function AnalyticsExportFormatMenu({
  reportType,
  onExport,
  disabled,
  align = 'end',
  contentClassName,
  children,
  label = 'Exporter',
  variant = 'outline',
  className
}: AnalyticsExportFormatMenuProps) {
  const trigger =
    children ??
    (
      <Button type="button" variant={variant} disabled={disabled} className={className}>
        <Download className="w-4 h-4 mr-2" />
        {label}
      </Button>
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={contentClassName ?? 'w-52'}>
        <DropdownMenuItem onClick={() => void onExport(reportType, 'pdf')}>
          <FileText className="w-4 h-4 mr-2" />
          Exporter en PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void onExport(reportType, 'csv')}>
          <Download className="w-4 h-4 mr-2" />
          Exporter en CSV (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void onExport(reportType, 'json')}>
          <FileText className="w-4 h-4 mr-2" />
          Exporter en JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function resolveAnalyticsExportFormat(format: string): 'json' | 'csv' | 'pdf' {
  if (format === 'pdf') return 'pdf'
  if (format === 'csv' || format === 'excel') return 'csv'
  return 'json'
}
