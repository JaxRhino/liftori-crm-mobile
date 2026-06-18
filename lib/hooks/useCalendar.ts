import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEvent, fetchEvents } from "@/lib/services/calendar";

export function useEvents(fromDate: string, toDate: string) {
  return useQuery({
    queryKey: ["events", fromDate, toDate],
    queryFn: () => fetchEvents(fromDate, toDate),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}
