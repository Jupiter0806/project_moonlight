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

export function AppSidebarFooter() {
  const user = useAppSelector(selectUserId);

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SignOutButton />
          <SidebarMenuButton>
            <User uid={user ?? ""} />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
