'use client';

import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronRight,
  LayoutDashboard,
  Box,
  Users,
  List,
  PackageSearch,
  Warehouse,
  Tag,
  MapPin,
  UserPlus,
  User,
  Truck,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { VerifiedEmailOnly } from '@/components/VerifiedEmailOnly';
import { useSelector } from 'react-redux';
import type { RootState } from '@/stores/types';
import { Role } from '@/enums/Role';

interface SidebarRoute {
  label: string;
  route?: string;
  icon?: React.ElementType;
  children?: SidebarRoute[];
  opened?: boolean;
}

const verifiedEmailRoutes: SidebarRoute[] = [
  { label: 'Dashboard', route: 'dashboard', icon: LayoutDashboard },
  { label: 'Products', route: 'products', icon: Tag },
  { label: 'Locations', route: 'locations', icon: MapPin },
  { label: 'Inventory', route: 'inventory', icon: PackageSearch },
  { label: 'Orders', route: 'orders', icon: Truck },
  { label: 'Invitation Requests', route: 'invitation-requests', icon: UserPlus },
  { label: 'Users', route: 'users', icon: Users },
  { label: 'Audit Logs', route: 'audit-logs', icon: List },
];

const alwaysVisibleRoutes: SidebarRoute[] = [{ label: 'Profile', route: 'profile', icon: User }];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const isMobile = useIsMobile();
  const effectiveCollapsed = isMobile ? false : isCollapsed;
  const { user } = useSelector((state: RootState) => state.auth);

  const isActive = (item: SidebarRoute, parentPath = ''): boolean => {
    // Build the full path for this item
    const currentPath = item.route
      ? `${parentPath}/${item.route}`.replace(/\/+/g, '/')
      : parentPath;

    // Exact match
    if (pathname === currentPath) return true;

    // Check children recursively
    if (item.children) {
      return item.children.some((child) => isActive(child, currentPath));
    }

    return false;
  };

  const filteredVerifiedRoutes = React.useMemo(() => {
    if (!user || !user.roles?.length) return [];

    // Helper to check if the user has a role code
    const hasRole = (roleCode: string) => user.roles!.some((r) => r.code === roleCode);

    // Superadmin: full access
    if (hasRole(Role.SUPERADMIN)) {
      return verifiedEmailRoutes;
    }

    if (hasRole(Role.WAREHOUSE_MANAGER)) {
      // Warehouse Manager: exclude Invitation Requests only
      return verifiedEmailRoutes.filter((r) => r.route !== 'invitation-requests');
    }

    // Other roles: exclude Invitation Requests, Users, Audit Logs
    return verifiedEmailRoutes.filter(
      (r) => r.route !== 'invitation-requests' && r.route !== 'users' && r.route !== 'audit-logs',
    );
  }, [user]);

  const renderDropdownItems = (items: SidebarRoute[]) => {
    return items.map((item) => {
      const Icon = item.icon;
      if (item.children) {
        return (
          <DropdownMenuSub key={item.label}>
            <DropdownMenuSubTrigger className="gap-2">
              {Icon && <Icon className="size-4 opacity-70" />}
              <span>{item.label}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-48">
              {renderDropdownItems(item.children)}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      }
      return (
        <DropdownMenuItem key={item.label} asChild className="gap-2">
          <Link to={item.route!}>
            {Icon && <Icon className="size-4 opacity-70" />}
            {item.label}
          </Link>
        </DropdownMenuItem>
      );
    });
  };

  const renderMenuItems = (items: SidebarRoute[], parentPath = '') => {
    return items.map((item) => {
      const active = isActive(item, parentPath);
      const Icon = item.icon || Box;
      const shouldBeOpen = active || item.opened;

      if (item.children && effectiveCollapsed) {
        return (
          <SidebarMenuItem key={item.label}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  isActive={active}
                  tooltip={item.label}
                  className="flex w-full justify-center p-0"
                >
                  <Icon className="size-6 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" sideOffset={16} className="min-w-56">
                <div className="text-muted-foreground mb-1 border-b px-2 py-1.5 text-xs font-semibold tracking-wider uppercase">
                  {item.label}
                </div>
                {renderDropdownItems(item.children)}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        );
      }

      if (item.children) {
        return (
          <Collapsible key={item.label} defaultOpen={shouldBeOpen} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton size="lg" isActive={active}>
                  <Icon className="size-5 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="mr-0 ml-4 border-l pr-0">
                  {renderMenuItems(item.children)}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        );
      }

      return (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton
            asChild
            size="lg"
            isActive={active}
            tooltip={item.label}
            className={effectiveCollapsed ? 'justify-center p-0' : 'px-3'}
          >
            <Link to={item.route!}>
              <Icon className={effectiveCollapsed ? 'size-6 shrink-0' : 'size-5 shrink-0'} />
              {!effectiveCollapsed && <span className="ml-3 font-medium">{item.label}</span>}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  };

  return (
    <Sidebar collapsible="icon" variant={isMobile ? 'floating' : 'sidebar'} className="border-r">
      <SidebarHeader
        className={cn(
          'flex h-auto min-h-20 flex-row items-center justify-between py-4 transition-all',
          effectiveCollapsed ? 'justify-center px-0' : 'px-4',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-3 overflow-hidden',
            effectiveCollapsed && 'justify-center',
          )}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Warehouse size={22} />
          </div>
          {!effectiveCollapsed && (
            <div className="flex flex-col pr-2">
              <span className="text-sm leading-tight font-bold">Warehouse Management System</span>
            </div>
          )}
        </div>

        {!effectiveCollapsed && !isMobile && <SidebarTrigger className="hover:bg-accent" />}
      </SidebarHeader>

      {effectiveCollapsed && !isMobile && (
        <div className="flex justify-center pb-4">
          <SidebarTrigger className="hover:bg-accent size-8" />
        </div>
      )}

      <SidebarContent className={effectiveCollapsed ? 'px-0' : 'px-2'}>
        <SidebarGroup>
          <SidebarMenu className="gap-1.5">
            <VerifiedEmailOnly>{renderMenuItems(filteredVerifiedRoutes)}</VerifiedEmailOnly>

            {renderMenuItems(alwaysVisibleRoutes)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
