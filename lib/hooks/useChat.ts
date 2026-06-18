import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchChannels,
  fetchMessages,
  sendMessage,
} from "@/lib/services/chat";
import type { Me } from "@/lib/services/me";

export function useChannels() {
  return useQuery({ queryKey: ["channels"], queryFn: fetchChannels });
}

export function useMessages(channelId: string) {
  return useQuery({
    queryKey: ["messages", channelId],
    queryFn: () => fetchMessages(channelId),
    enabled: !!channelId,
    refetchInterval: 20000, // fallback; realtime drives live updates
  });
}

export function useSendMessage(channelId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, me }: { content: string; me: Me }) =>
      sendMessage(channelId, content, me),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages", channelId] }),
  });
}
