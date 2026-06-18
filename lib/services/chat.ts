/** Team chat — chat_channels + chat_messages (sender fields denormalized). */
import { supabase } from "@/lib/supabase";
import type { Me } from "./me";

export type Channel = {
  id: string;
  name: string | null;
  description: string | null;
  type: string | null;
  is_archived: boolean | null;
};

export type ChatMessage = {
  id: string;
  channel_id: string;
  sender_id: string | null;
  sender_name: string | null;
  sender_role: string | null;
  sender_title: string | null;
  content: string | null;
  created_at: string | null;
};

export async function fetchChannels(): Promise<Channel[]> {
  const { data, error } = await supabase
    .from("chat_channels")
    .select("id, name, description, type, is_archived")
    .eq("is_archived", false)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Channel[];
}

export async function fetchMessages(channelId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, channel_id, sender_id, sender_name, sender_role, sender_title, content, created_at")
    .eq("channel_id", channelId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function sendMessage(
  channelId: string,
  content: string,
  me: Me
): Promise<void> {
  const { error } = await supabase.from("chat_messages").insert({
    channel_id: channelId,
    sender_id: me.userId,
    sender_name: me.displayName,
    sender_role: me.role,
    sender_title: me.member?.title ?? null,
    content: content.trim(),
  });
  if (error) throw error;
}
