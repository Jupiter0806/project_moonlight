import { User } from "@/types/User";
import { Firestore } from "firebase-admin/firestore";

export async function fetchUsers(
  db: Firestore,
  userIds: string[],
): Promise<User[]> {
  const usersRef = db.collection("users");

  const docRefs = userIds.map((id) => usersRef.doc(id));

  const snapshots = await db.getAll(...docRefs);

  // todo
  // check twitter, or others
  // how to handle users private profile and public profile?
  const users = snapshots
    .filter((snap) => snap.exists)
    .map((snap) => {
      const data = snap.data() as User;
      return {
        id: snap.id,
        displayName: data.displayName,
        email: data.email,
      };
    });
  return users;
}
