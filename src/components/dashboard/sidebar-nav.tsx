

'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, User as UserIcon, FileHeart, Settings, History, CalendarCheck, DollarSign, Shield, BookOpenCheck, BedDouble } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Role } from "@/lib/definitions";
import { professionalRolesConfig, professionalRoleHierarchy } from "@/lib/roles";


export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, hasRole } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  if (!user) {
    return null;
  }

  const userProfessionalRoles = professionalRoleHierarchy.filter(role => user.roles.includes(role));

  const menuItems = [
    {
      href: "/dashboard",
      label: "My Dashboard",
      icon: LayoutDashboard,
      roles: ['patient'], 
    },
    {
      href: "/dashboard/profile",
      label: "Profile",
      icon: UserIcon,
      roles: ['patient'],
    },
    {
      href: "/dashboard/my-records",
      label: "My Health Records",
      icon: FileHeart,
      roles: ['patient'],
    },
    {
        href: "/dashboard/my-appointments",
        label: "My Appointments",
        icon: CalendarCheck,
        roles: ['patient'],
    },
     {
        href: "/dashboard/privacy-log",
        label: "Privacy Log",
        icon: History,
        roles: ['patient'],
    },
    {
      href: "/dashboard/settings",
      label: "Account Settings",
      icon: Settings,
      roles: ['patient'],
    },
    {
      href: "/dashboard/admin",
      label: "Admin Dashboard",
      icon: Shield,
      roles: ['admin'],
    },
    {
        href: "/dashboard/book-appointment",
        label: "Book Appointment",
        icon: BookOpenCheck,
        roles: ['hospital_owner', 'manager'],
    },
    {
        href: "/dashboard/admissions",
        label: "Admissions (ADT)",
        icon: BedDouble,
        roles: ['hospital_owner', 'manager', 'nurse'],
    },
    {
        href: "/dashboard/billing",
        label: "Billing & Invoicing",
        icon: DollarSign,
        roles: ['hospital_owner', 'manager'],
    },
    {
      href: "/dashboard/settings/hospital",
      label: "Hospital Settings",
      icon: Settings,
      roles: ['hospital_owner'],
    }
  ];

  const availableMenuItems = menuItems.filter(item => 
    user?.roles && item.roles.some(role => hasRole(role as any))
  );

  return (
    <SidebarMenu>
      {availableMenuItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <Link href={item.href} passHref>
            <SidebarMenuButton asChild isActive={pathname.startsWith(item.href) && item.href !== '/dashboard' || pathname === item.href} onClick={handleLinkClick}>
              <span>
                <item.icon />
                <span>{item.label}</span>
              </span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}

      {userProfessionalRoles.length > 0 && availableMenuItems.length > 0 && <Separator className="my-2" />}
      
      {userProfessionalRoles.map(role => {
          const config = professionalRolesConfig[role];
          if (!config) return null;
          
          const currentRoleParam = searchParams.get('role');
          const isActive = pathname === '/dashboard/professional' && currentRoleParam === role;

          return (
            <SidebarMenuItem key={role}>
              <Link href={`/dashboard/professional?role=${role}`} passHref>
                <SidebarMenuButton asChild isActive={isActive} onClick={handleLinkClick}>
                  <span>
                    <config.icon />
                    <span>{config.label}</span>
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )
      })}
    </SidebarMenu>
  );
}
