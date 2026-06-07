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
import {
  useDescriptionHeight,
  useDescriptionLineClamp,
} from "./hooks/useRowHeight";

const ReflectionTracesDrawer = dynamic(
  () => import("./reflection-traces-drawer"),
);

export function Reflection({ id }: { id: string }) {
  const [open, setDrawerOpen] = useState(false);
  const descriptionLineClamp = useDescriptionLineClamp();
  const descriptionHeight = useDescriptionHeight();

  const reflection = useAppSelector((state) => selectReflectionById(state, id));

  if (!reflection) return null;

  return (
    <Card size="sm" onClick={() => setDrawerOpen(true)}>
      <CardHeader>
        <User uid={reflection.uid} />
      </CardHeader>
      <CardContent>
        <CardDescription
          style={{
            display: "-webkit-box",
            WebkitLineClamp: descriptionLineClamp,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            height: descriptionHeight,
          }}
        >
          {reflection.summary}
        </CardDescription>
      </CardContent>
      <CardFooter>
        <p className="text-muted-foreground text-xs">
          {new Date(reflection.createdAt).toLocaleString()}
        </p>
      </CardFooter>
      {open && (
        <ReflectionTracesDrawer
          reflectionId={reflection.id}
          open={open}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </Card>
  );
}
