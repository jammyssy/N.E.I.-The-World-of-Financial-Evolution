import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from '@/components/TopNav';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'PEVC 知识平台',
  description: '面向 VC / PE / FA 的垂直知识分享社区',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="zh-CN">
      <body>
        <TopNav user={user} />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
