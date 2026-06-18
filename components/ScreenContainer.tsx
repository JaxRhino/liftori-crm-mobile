import { ScrollView, View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";

type Props = ViewProps & {
  scroll?: boolean;
  contentPadding?: boolean;
  refreshControl?: React.ReactElement;
};

export function ScreenContainer({
  children,
  scroll = true,
  contentPadding = true,
  refreshControl,
  style,
  ...rest
}: Props) {
  const inner = (
    <View
      {...rest}
      style={[
        {
          flex: 1,
          paddingHorizontal: contentPadding ? theme.spacing.md : 0,
          paddingBottom: theme.spacing.xl,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      edges={["top", "left", "right"]}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}
