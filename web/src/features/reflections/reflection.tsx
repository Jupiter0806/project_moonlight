import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";
import { selectReflectionById } from "@/store/slices/entitiesSlice";
import { User } from "../user";

export function Reflection({ id }: { id: string }) {
  const reflection = useAppSelector((state) => selectReflectionById(state, id));

  if (!reflection) return null;

  return (
    <Card size="sm">
      <CardHeader>
        <User uid={reflection.uid} />
      </CardHeader>
      <CardContent>
        <CardDescription>{reflection.summary}</CardDescription>
      </CardContent>
    </Card>
  );
}
