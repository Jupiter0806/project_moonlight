import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";
import { selectReflectionById } from "@/store/slices/entitiesSlice";
import { User } from "../user";
import { useState } from "react";
import dynamic from "next/dynamic";

const ReflectionTracesDrawer = dynamic(
  () => import("./reflection-traces-drawer"),
);

export function Reflection({ id }: { id: string }) {
  const [open, setDrawerOpen] = useState(false);

  const reflection = useAppSelector((state) => selectReflectionById(state, id));

  if (!reflection) return null;

  return (
    <Card size="sm" onClick={() => setDrawerOpen(true)}>
      <CardHeader>
        <User uid={reflection.uid} />
      </CardHeader>
      <CardContent>
        <CardDescription>{reflection.summary}</CardDescription>
      </CardContent>
      <CardFooter>
        <p className="text-muted-foreground text-xs">
          {new Date(reflection.createdAt).toLocaleString()}
        </p>
      </CardFooter>
      {open && (
        <ReflectionTracesDrawer
          reflection={reflection}
          open={open}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </Card>
  );
}
