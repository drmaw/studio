
'use client';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, User as UserIcon, FileHeart, Settings } from "lucide-react";
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
          <Link href={item.href} passHref>
            <SidebarMenuButton asChild isActive={pathname === item.href}>
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
