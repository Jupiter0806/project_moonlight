import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";
import {
  selectReflectionById,
  selectUserById,
} from "@/store/slices/entitiesSlice";

export function Reflection({ id }: { id: string }) {
  const reflection = useAppSelector((state) => selectReflectionById(state, id));
  const user = useAppSelector((state) =>
    selectUserById(state, reflection?.user ?? ""),
  );

  if (!reflection) return null;

  return (
    <Card size="sm">
      <CardHeader>{user?.email}</CardHeader>
      <CardContent>
        <CardDescription>{reflection.summary}</CardDescription>
      </CardContent>
    </Card>
  );
}
