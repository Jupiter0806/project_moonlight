"use client";

import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SignOutButton } from "@/features/SignOutButton/SignOutButton";
import { User } from "@/features/user";
import { useAppSelector } from "@/store/hooks";
import { selectUserId } from "@/store/slices/sessionSlice";
import { HiMiniChevronUpDown } from "react-icons/hi2";

export function AppSidebarFooter() {
  const user = useAppSelector(selectUserId);

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <SignOutButton />
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem className="flex h-fit! items-center justify-center px-2 py-4">
          <User uid={user ?? ""} />
          <HiMiniChevronUpDown className="ml-auto" />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
