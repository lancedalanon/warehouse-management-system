'use client';

import { type ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AuthenticatedPageHeader from '@/components/AuthenticatedPageHeader';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="bg-background flex h-screen w-full md:overflow-hidden">
        <AppSidebar />
        <main className="flex w-full flex-1 flex-col md:overflow-hidden">
          <AuthenticatedPageHeader sidebarTrigger={<SidebarTrigger />} />
          <div className="flex flex-1 flex-col bg-gray-50 md:overflow-hidden">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
