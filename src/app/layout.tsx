import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '家計簿 - 2人で管理するお金の記録',
  description: 'カップル・夫婦でリアルタイムに共有できる家計簿アプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
