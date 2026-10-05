import type { ReactNode } from 'react'
import { Shell, StoreProvider } from '@/components/store'

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <StoreProvider><Shell>{children}</Shell></StoreProvider>
}
