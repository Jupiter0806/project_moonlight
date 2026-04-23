import { List } from "@/components/list";
import { Reflection } from "./reflection";

export function ReflectionList({
  ids,
  isLoading,
}: {
  ids: string[];
  isLoading: boolean;
}) {
  return (
    <List isLoading={isLoading}>
      {ids.map((id) => (
        <Reflection key={id} id={id} />
      ))}
    </List>
  );
}
