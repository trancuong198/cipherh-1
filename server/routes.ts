import { governance as symbiosisGovernance } from "./core/governance";

app.get("/api/health/symbiosis", (_req: Request, res: Response) => {
  try {
    // compute survival score using governance module (defaults used if no signals provided)
    const survivalScore = symbiosisGovernance.evaluateSurvivalScore();
    // simple ThreatLevel heuristic: higher threat when survival is low
    const threatLevel = Math.max(0, Math.min(100, 100 - survivalScore));

    res.json({
      survivalScore,
      threatLevel,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "failed to compute symbiosis health", details: String(err) });
  }
});
