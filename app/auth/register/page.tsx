import { Suspense } from "react"
import RegisterPageClient from "./register-page-client"

/**
 * Page d'inscription (Server Component).
 * Rend le composant client sous Suspense afin de permettre l'utilisation de useSearchParams() sans bloquer le build.
 */
export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageClient />
    </Suspense>
  )
}
