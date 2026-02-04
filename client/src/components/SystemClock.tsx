import { useState, useEffect, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";

interface SystemClockProps {
  timezone?: string;
  serverUptime?: number;
}

export const SystemClock = memo(function SystemClock({ timezone, serverUptime }: SystemClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="bg-[#121828] border-cyan-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          SYSTEM TIME (SOUL)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <Calendar className="w-6 h-6 text-cyan-400" />
            <div>
              <p className="text-2xl font-mono font-bold text-cyan-400">
                {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          {(timezone || serverUptime !== undefined) && (
            <div className="text-xs text-gray-500 space-y-1 mt-3 pt-3 border-t border-gray-700">
              {timezone && <p>Timezone: {timezone}</p>}
              {serverUptime !== undefined && (
                <p>Server uptime: {Math.floor(serverUptime / 3600)}h {Math.floor((serverUptime % 3600) / 60)}m</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
