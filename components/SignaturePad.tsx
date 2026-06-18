import { useRef, useState } from "react";
import { PanResponder, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { theme } from "@/lib/theme";

/**
 * Lightweight signature pad on react-native-svg + PanResponder — no webview
 * dependency, and renders in the web preview. Captures the drawing to a PNG
 * base64 via the Svg ref's toDataURL (native); on web that may be unavailable,
 * in which case capture returns null and the typed sign-off still stands.
 */
export function SignaturePad({
  onCapture,
  accent,
}: {
  onCapture: (base64: string | null) => void;
  accent: string;
}) {
  const [paths, setPaths] = useState<string[]>([]);
  const current = useRef<string>("");
  const [, force] = useState(0);
  const svgRef = useRef<any>(null);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        current.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        force((n) => n + 1);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        current.current += ` L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        force((n) => n + 1);
      },
      onPanResponderRelease: () => {
        if (current.current) {
          setPaths((p) => [...p, current.current]);
          current.current = "";
        }
      },
    })
  ).current;

  const clear = () => {
    setPaths([]);
    current.current = "";
    onCapture(null);
    force((n) => n + 1);
  };

  const capture = () => {
    const node = svgRef.current;
    if (node && typeof node.toDataURL === "function") {
      node.toDataURL((b64: string) => onCapture(b64));
    } else {
      onCapture(null);
    }
  };

  const all = current.current ? [...paths, current.current] : paths;
  const hasDrawing = all.length > 0;

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View
        {...pan.panHandlers}
        style={{
          height: 200,
          backgroundColor: "#ffffff",
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: "hidden",
        }}
      >
        <Svg ref={svgRef} width="100%" height="100%">
          {all.map((d, i) => (
            <Path key={i} d={d} stroke="#0b0f17" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </Svg>
      </View>
      <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
        <Pressable onPress={clear} style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border }}>
          <Text style={{ color: theme.colors.textMuted, fontWeight: "700" }}>Clear</Text>
        </Pressable>
        <Pressable
          onPress={capture}
          disabled={!hasDrawing}
          style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: theme.radius.md, backgroundColor: hasDrawing ? accent : theme.colors.surfaceElevated }}
        >
          <Text style={{ color: hasDrawing ? "#0b0f17" : theme.colors.textMuted, fontWeight: "700" }}>Use signature</Text>
        </Pressable>
      </View>
    </View>
  );
}
