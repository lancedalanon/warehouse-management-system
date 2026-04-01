'use client';

import { type FC, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, UserCircle, LogOut } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/stores';
import { logoutThunk } from '@/features/auth/stores/auth.slice';

interface AuthenticatedPageHeaderProps {
  sidebarTrigger?: ReactNode;
}

const AuthenticatedPageHeader: FC<AuthenticatedPageHeaderProps> = ({ sidebarTrigger }) => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logoutThunk());
  };

  const pathSegments = location.pathname.split('/').filter(Boolean);

  const formatSegment = (seg: string) => {
    return seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const renderBreadcrumbs = () => {
    const fullSegments = ['Home', ...pathSegments];
    if (fullSegments.length === 1) {
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Home</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    }

    const itemsToShow =
      fullSegments.length > 4
        ? [fullSegments[0], '...', fullSegments[fullSegments.length - 1]]
        : fullSegments;

    return (
      <Breadcrumb>
        <BreadcrumbList className="text-md flex items-center gap-1">
          {itemsToShow.map((seg, idx) => {
            const isLast = idx === itemsToShow.length - 1;

            if (seg === '...') {
              return (
                <BreadcrumbItem key={idx}>
                  <span className="px-1">…</span>
                  {!isLast && <BreadcrumbSeparator />}
                </BreadcrumbItem>
              );
            }

            const path =
              seg === 'Home'
                ? '/dashboard'
                : '/dashboard' + pathSegments.slice(0, pathSegments.indexOf(seg) + 1).join('/');

            return (
              <BreadcrumbItem key={idx}>
                {!isLast ? (
                  <>
                    <BreadcrumbLink asChild>
                      <Link to={path} className="capitalize hover:underline">
                        {formatSegment(seg)}
                      </Link>
                    </BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </>
                ) : (
                  <BreadcrumbPage className="capitalize">{formatSegment(seg)}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };

  return (
    <div className="bg-background/95 sticky top-0 z-40 flex items-center justify-between border-b px-4 py-4 backdrop-blur md:px-8">
      {/* Left: Breadcrumbs or Sidebar Trigger on small screens */}
      <div className="flex items-center gap-2">
        <div className="md:hidden">{sidebarTrigger}</div>
        <div className="hidden md:block">{renderBreadcrumbs()}</div>
      </div>

      {/* Right: Profile */}
      <div className="flex items-center gap-4">
        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:bg-muted/20 flex items-center gap-2 rounded-lg px-2 py-1">
              <Avatar className="h-10 w-10 rounded-full border border-gray-300">
                <AvatarImage src="/images/default-user.png" />
                <AvatarFallback className="text-sm font-semibold text-gray-700">
                  {user?.firstName?.[0]?.toUpperCase() || ''}
                  {user?.lastName?.[0]?.toUpperCase() || ''}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col text-left text-sm leading-tight md:flex">
                <span className="truncate font-bold">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="truncate text-xs font-normal text-gray-500">
                  {user?.roles?.[0]?.name || 'No Role'}
                </span>
              </div>
              <ChevronDown className="size-4 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" sideOffset={12}>
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center gap-2 py-2">
                <UserCircle className="size-4" /> Profile settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer py-2"
              onSelect={handleLogout}
            >
              <div className="flex items-center gap-2">
                <LogOut className="size-4" />
                <span>Sign out</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default AuthenticatedPageHeader;
