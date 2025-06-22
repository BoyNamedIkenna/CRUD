import { useEffect } from "react";
import { supabase } from "./supabase-client";

export default function RealtimeDebug() {
  useEffect(() => {
    const channel = supabase
      .channel("public:tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          console.log("🔔 Realtime event:", payload);
        }
      )
      .subscribe((status) => {
        console.log("✅ Channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return <div>Watching for realtime changes...</div>;
}
