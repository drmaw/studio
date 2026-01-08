
'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, User as UserIcon, FileHeart, Settings, History } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function SidebarNav() {
  const pathname = usePathname();
  const { hasRole } = useAuth();

  const menuItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ['doctor', 'patient', 'hospital_owner', 'marketing_rep'],
    },
    {
      href: "/dashboard/profile",
      label: "Profile",
      icon: UserIcon,
      roles: ['doctor', 'patient', 'hospital_owner', 'marketing_rep'],
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
      label: "Hospital Settings",
      icon: Settings,
      roles: ['hospital_owner'],
    }
  ];

  const availableMenuItems = menuItems.filter(item => item.roles.some(role => hasRole(role as any)));

  return (
    <SidebarMenu>
      {availableMenuItems.map((item) => (
        <SidebarMenuItem key={item.label}>
          <Link href={item.href} legacyBehavior>
            <SidebarMenuButton as="a" isActive={pathname === item.href}>
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
