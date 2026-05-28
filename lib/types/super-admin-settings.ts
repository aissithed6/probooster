export type SuperAdminSettingsScope = 'global' | 'vendor' | 'admin'

export interface VendorApprovalSettings {
  autoApproval: boolean
  requireDocumentVerification: boolean
  requirePhoneVerification: boolean
  approvalDelayHours: number
  maxPendingVendors: number
}

export interface AdminApprovalSettings {
  autoApproval: boolean
  requireEmailVerification: boolean
}

export interface SuperAdminSettings {
  vendor: VendorApprovalSettings
  admin: AdminApprovalSettings
  global?: Record<string, unknown>
}
