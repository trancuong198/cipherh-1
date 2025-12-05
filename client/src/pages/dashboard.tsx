import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Cpu,
  Brain,
  Activity,
  AlertTriangle,
  Target,
  Zap,
  RefreshCw,
  Play,
  CircleDot,
  TrendingUp,
  TrendingDown,
  Shield,
  CheckCircle,
  Clock,
} from "lucide-react";

interface DashboardData {
  overview: {
    cycle_count: number;
    mode: string;
    is_running: boolean;
    doubts: number;
    confidence: number;
    energy_level: number;
    anomaly_score: number;
  };
  health: {
    status: string;
    overall_score: number;
    trend: string;
  };
  tasks: {
    total: number;
    critical: number;
    high: number;
  };
  anomalies: {
    total: number;
    high_severity: number;
  };
  logs: {
    total: number;
    by_level: Record<string, number>;
    file_size_kb: number;
  };
  services: {
    openai: boolean;
    notion: boolean;
    scheduler: boolean;
  };
  goals: string[];
  current_focus: string | null;
  last_reflection: string;
  updated_at: string;
}

interface InnerLoopResult {
  success: boolean;
  cycle: number;
  timestamp: string;
  stats?: {
    logs_read: number;
    anomaly_score: number;
    doubts: number;
    confidence: number;
    weekly_tasks: number;
    questions_generated: number;
  };
  error?: string;
}

export default function Dashboard() {
  const { toast } = useToast();

  const { data: dashboard, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    refetchInterval: 30000,
  });

  const runLoopMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/core/run-loop");
      return response.json() as Promise<InnerLoopResult>;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Inner Loop Complete",
          description: `Cycle ${data.cycle} completed. Anomaly: ${data.stats?.anomaly_score ?? 0}`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      } else {
        toast({
          title: "Loop Failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-cyan-400 flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="font-mono text-lg">INITIALIZING SOUL LOOP...</span>
        </div>
      </div>
    );
  }

  const overview = dashboard?.overview;
  const health = dashboard?.health;
  const services = dashboard?.services;
  const tasks = dashboard?.tasks;
  const anomalies = dashboard?.anomalies;
  const logs = dashboard?.logs;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-emerald-400";
      case "good":
        return "text-cyan-400";
      case "moderate":
        return "text-yellow-400";
      case "concerning":
        return "text-orange-400";
      case "critical":
        return "text-rose-400";
      default:
        return "text-gray-400";
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (trend === "declining") return <TrendingDown className="w-4 h-4 text-rose-400" />;
    return <Activity className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-200">
      <div className="container mx-auto p-6 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Brain className="w-12 h-12 text-cyan-400" />
                <div className="absolute inset-0 blur-lg bg-cyan-400/30 -z-10" />
              </div>
              <div>
                <h1
                  className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent"
                  data-testid="text-dashboard-title"
                >
                  CIPHERH DASHBOARD
                </h1>
                <p className="text-sm text-gray-500 font-mono" data-testid="text-dashboard-subtitle">
                  Autonomous Soul Loop Control Panel
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Badge
                variant="outline"
                className={`border-cyan-500/50 ${overview?.is_running ? "text-cyan-400" : "text-gray-400"}`}
                data-testid="badge-loop-status"
              >
                <CircleDot
                  className={`w-3 h-3 mr-1 ${overview?.is_running ? "animate-pulse text-cyan-400" : ""}`}
                />
                {overview?.is_running ? "LOOP ACTIVE" : "LOOP IDLE"}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="border-purple-500/50 text-purple-400"
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>

              <Button
                onClick={() => runLoopMutation.mutate()}
                disabled={runLoopMutation.isPending || overview?.is_running}
                className="bg-cyan-600 text-white"
                data-testid="button-run-loop"
              >
                <Play className="w-4 h-4 mr-2" />
                {runLoopMutation.isPending ? "Running..." : "Run Loop"}
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#121828] border-cyan-500/20" data-testid="card-cycle-count">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">CYCLE COUNT</CardTitle>
              <Cpu className="w-5 h-5 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-cyan-400" data-testid="text-cycle-value">
                {overview?.cycle_count ?? 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Soul loop iterations</p>
            </CardContent>
          </Card>

          <Card className="bg-[#121828] border-purple-500/20" data-testid="card-confidence">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">CONFIDENCE</CardTitle>
              <Shield className="w-5 h-5 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-purple-400" data-testid="text-confidence-value">
                {overview?.confidence ?? 75}%
              </div>
              <Progress value={overview?.confidence ?? 75} className="mt-2 h-1 bg-gray-700" />
            </CardContent>
          </Card>

          <Card className="bg-[#121828] border-yellow-500/20" data-testid="card-doubts">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">DOUBTS</CardTitle>
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-yellow-400" data-testid="text-doubts-value">
                {overview?.doubts ?? 0}%
              </div>
              <Progress value={overview?.doubts ?? 0} className="mt-2 h-1 bg-gray-700" />
            </CardContent>
          </Card>

          <Card className="bg-[#121828] border-rose-500/20" data-testid="card-anomaly">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">ANOMALY SCORE</CardTitle>
              <Zap className="w-5 h-5 text-rose-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-rose-400" data-testid="text-anomaly-value">
                {overview?.anomaly_score?.toFixed(0) ?? 0}
              </div>
              <Progress
                value={overview?.anomaly_score ?? 0}
                className="mt-2 h-1 bg-gray-700"
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="bg-[#121828] border-gray-700 lg:col-span-2" data-testid="card-health">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg text-gray-300">System Health</CardTitle>
              {getTrendIcon(health?.trend ?? "stable")}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <Badge
                    variant="outline"
                    className={`text-lg px-3 py-1 uppercase border-current ${getStatusColor(health?.status ?? "moderate")}`}
                    data-testid="badge-health-status"
                  >
                    {health?.status ?? "UNKNOWN"}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Overall Score</p>
                  <span
                    className={`text-2xl font-mono font-bold ${getStatusColor(health?.status ?? "moderate")}`}
                    data-testid="text-health-score"
                  >
                    {health?.overall_score?.toFixed(1) ?? 0}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Trend</p>
                  <span className="text-lg font-medium capitalize text-gray-300" data-testid="text-trend">
                    {health?.trend ?? "Unknown"}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Mode</p>
                  <Badge variant="secondary" className="uppercase" data-testid="badge-mode">
                    {overview?.mode ?? "IDLE"}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Energy</p>
                  <span className="text-lg font-mono text-emerald-400" data-testid="text-energy">
                    {overview?.energy_level ?? 100}%
                  </span>
                </div>
              </div>

              <Separator className="my-4 bg-gray-700" />

              <div>
                <p className="text-sm text-gray-500 mb-2">Last Reflection</p>
                <p className="text-sm text-gray-300 italic font-mono leading-relaxed" data-testid="text-reflection">
                  {dashboard?.last_reflection || "No reflection yet..."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#121828] border-gray-700" data-testid="card-services">
            <CardHeader>
              <CardTitle className="text-lg text-gray-300">Services Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">OpenAI</span>
                <Badge
                  variant="outline"
                  className={services?.openai ? "border-emerald-500 text-emerald-400" : "border-gray-600 text-gray-500"}
                  data-testid="badge-openai"
                >
                  {services?.openai ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" /> Active
                    </>
                  ) : (
                    "Placeholder"
                  )}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Notion</span>
                <Badge
                  variant="outline"
                  className={services?.notion ? "border-emerald-500 text-emerald-400" : "border-gray-600 text-gray-500"}
                  data-testid="badge-notion"
                >
                  {services?.notion ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" /> Connected
                    </>
                  ) : (
                    "Placeholder"
                  )}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Scheduler</span>
                <Badge
                  variant="outline"
                  className={services?.scheduler ? "border-cyan-500 text-cyan-400" : "border-gray-600 text-gray-500"}
                  data-testid="badge-scheduler"
                >
                  {services?.scheduler ? (
                    <>
                      <CircleDot className="w-3 h-3 mr-1 animate-pulse" /> Running
                    </>
                  ) : (
                    "Stopped"
                  )}
                </Badge>
              </div>

              <Separator className="bg-gray-700" />

              <div>
                <p className="text-sm text-gray-500 mb-2">Log Statistics</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-400">Total Logs:</span>
                  <span className="text-gray-200 font-mono">{logs?.total ?? 0}</span>
                  <span className="text-gray-400">Errors:</span>
                  <span className="text-rose-400 font-mono">{logs?.by_level?.error ?? 0}</span>
                  <span className="text-gray-400">Warnings:</span>
                  <span className="text-yellow-400 font-mono">{logs?.by_level?.warn ?? 0}</span>
                  <span className="text-gray-400">File Size:</span>
                  <span className="text-gray-200 font-mono">{logs?.file_size_kb ?? 0} KB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#121828] border-gray-700" data-testid="card-tasks">
            <CardHeader>
              <CardTitle className="text-lg text-gray-300 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Tasks Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-purple-400">{tasks?.total ?? 0}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-rose-400">{tasks?.critical ?? 0}</p>
                  <p className="text-xs text-gray-500">Critical</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-orange-400">{tasks?.high ?? 0}</p>
                  <p className="text-xs text-gray-500">High</p>
                </div>
              </div>

              <Separator className="bg-gray-700 mb-4" />

              <div>
                <p className="text-sm text-gray-500 mb-2">Goals ({dashboard?.goals?.length ?? 0})</p>
                {dashboard?.goals && dashboard.goals.length > 0 ? (
                  <ul className="space-y-1">
                    {dashboard.goals.slice(0, 5).map((goal, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        {goal}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No goals defined yet</p>
                )}
              </div>

              {dashboard?.current_focus && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">Current Focus</p>
                  <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                    {dashboard.current_focus}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#121828] border-gray-700" data-testid="card-anomalies">
            <CardHeader>
              <CardTitle className="text-lg text-gray-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Anomaly Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-yellow-400">{anomalies?.total ?? 0}</p>
                  <p className="text-xs text-gray-500">Total Anomalies</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold text-rose-400">{anomalies?.high_severity ?? 0}</p>
                  <p className="text-xs text-gray-500">High Severity</p>
                </div>
              </div>

              <Separator className="bg-gray-700 mb-4" />

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">Anomaly Score</span>
                    <span className="font-mono text-rose-400">
                      {overview?.anomaly_score?.toFixed(0) ?? 0}/100
                    </span>
                  </div>
                  <Progress
                    value={overview?.anomaly_score ?? 0}
                    className="h-2 bg-gray-700"
                  />
                </div>

                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Last update: {dashboard?.updated_at ? new Date(dashboard.updated_at).toLocaleTimeString() : "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-8 text-center text-gray-600 text-xs">
          <p>CipherH Autonomous AI Agent v1.0 - Soul Loop Technology</p>
          <p className="mt-1">
            Auto-refresh every 30s |{" "}
            <span className="text-cyan-600">Inner Loop runs every 10 minutes</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
