/**
 * Current-user resolution. Auth identity lives in auth.users; the human details
 * (name, role, title) live in org_team_members keyed by email. Used for chat
 * sender fields, task assignment, and EOS ownership.
 */
import { supabase } from "@/lib/supabase";

export type Member = {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string | null;
  title: string | null;
  department: string | null;
};

export type Me = {
  userId: string | null;
  email: string | null;
  member: Member | null;
  displayName: string;
  role: string;
};

export async function fetchMe(): Promise<Me> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? null;

  let member: Member | null = null;
  if (email) {
    const { data } = await supabase
      .from("org_team_members")
      .select("id, user_id, first_name, last_name, email, role, title, department")
      .eq("email", email)
      .maybeSingle();
    member = (data as Member) ?? null;
  }

  const displayName =
    member && (member.first_name || member.last_name)
      ? `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim()
      : email ?? "Me";

  return {
    userId: user?.id ?? null,
    email,
    member,
    displayName,
    role: member?.role ?? "member",
  };
}

export async function fetchTeam(): Promise<Member[]> {
  const { data, error } = await supabase
    .from("org_team_members")
    .select("id, user_id, first_name, last_name, email, role, title, department")
    .order("first_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Member[];
}
