import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { LoadingView } from "@/components/ui/StateViews";
import { useMessages, useSendMessage } from "@/lib/hooks/useChat";
import { useMe } from "@/lib/hooks/useMe";
import { useRealtime } from "@/lib/realtime";
import { useAccent } from "@/lib/org";
import { theme } from "@/lib/theme";
import { timeAgo } from "@/lib/format";

export default function ChannelThread() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const accent = useAccent();
  const me = useMe();
  const messages = useMessages(id!);
  const send = useSendMessage(id!);
  useRealtime("chat_messages", [["messages", id!]], `channel_id=eq.${id}`);
  const [text, setText] = useState("");

  const onSend = () => {
    const content = text.trim();
    if (!content || !me.data) return;
    setText("");
    send.mutate({ content, me: me.data });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={["bottom"]}>
      <Stack.Screen options={{ title: name ? `#${name}` : "Channel" }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {messages.isLoading ? (
          <LoadingView />
        ) : (
          <FlatList
            data={messages.data ?? []}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.sm }}
            renderItem={({ item }) => {
              const mine = !!me.data?.userId && item.sender_id === me.data.userId;
              return (
                <View style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
                  {!mine ? (
                    <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginBottom: 2, marginLeft: 4 }}>
                      {item.sender_name ?? "Member"}
                    </Text>
                  ) : null}
                  <View
                    style={{
                      maxWidth: "82%",
                      backgroundColor: mine ? accent : theme.colors.surfaceElevated,
                      borderRadius: theme.radius.lg,
                      borderWidth: mine ? 0 : 1,
                      borderColor: theme.colors.border,
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                    }}
                  >
                    <Text style={{ color: mine ? "#0b0f17" : theme.colors.text, fontSize: theme.fontSize.base }}>
                      {item.content}
                    </Text>
                  </View>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginTop: 2, marginHorizontal: 4 }}>
                    {timeAgo(item.created_at)}
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={{ color: theme.colors.textMuted, textAlign: "center", marginTop: theme.spacing.xl }}>
                No messages yet. Say hello 👋
              </Text>
            }
          />
        )}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            padding: theme.spacing.sm,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          }}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            style={{
              flex: 1,
              color: theme.colors.text,
              backgroundColor: theme.colors.bg,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              maxHeight: 120,
              fontSize: theme.fontSize.base,
            }}
          />
          <Pressable
            onPress={onSend}
            disabled={!text.trim() || send.isPending}
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: text.trim() ? accent : theme.colors.surfaceElevated,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name="send" size={18} color={text.trim() ? "#0b0f17" : theme.colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
