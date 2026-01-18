
'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, User as UserIcon, FileHeart, Settings, History, Briefcase, CalendarCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function SidebarNav() {
  const pathname = usePathname();
  const { user, hasRole, activeRole } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  if (!user) {
    return null;
  }

  const isProfessional = user?.roles?.some(r => r !== 'patient');

  const professionalDashboardLabel = activeRole 
    ? `${activeRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Dashboard`
    : 'Professional Dashboard';

  const menuItems = [
    {
      href: "/dashboard",
      label: "My Dashboard",
      icon: LayoutDashboard,
      roles: ['patient'], 
    },
    {
      href: "/dashboard/professional",
      label: professionalDashboardLabel,
      icon: Briefcase,
      roles: ['doctor', 'hospital_owner', 'marketing_rep', 'nurse', 'lab_technician', 'pathologist', 'pharmacist', 'manager', 'assistant_manager', 'front_desk'],
      condition: isProfessional
    },
    {
      href: "/dashboard/profile",
      label: "Profile",
      icon: UserIcon,
      roles: ['patient'],
    },
    {
        href: "/dashboard/my-appointments",
        label: "My Appointments",
        icon: CalendarCheck,
        roles: ['patient'],
    },
    {
      href: "/dashboard/my-records",
      label: "My Health Records",
      icon: FileHeart,
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
      roles: ['patient'], // Now visible to all users, as everyone has the 'patient' role.
    },
    {
      href: "/dashboard/settings/hospital",
      label: "Hospital Settings",
      icon: Settings,
      roles: ['hospital_owner'],
    }
  ];

  const availableMenuItems = menuItems.filter(item => 
    (item.condition !== false) && user?.roles && item.roles.some(role => hasRole(role as any))
  );

  return (
    <SidebarMenu>
      {availableMenuItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <Link href={item.href} passHref>
            <SidebarMenuButton asChild isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard')} onClick={handleLinkClick}>
              <span>
                <item.icon />
                <span>{item.label}</span>
              </span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
