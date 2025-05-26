'use client'

import { MainLayout } from '../uIComponents/MainLayout'

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  )
} 