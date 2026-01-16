import { Router } from 'express';
import { getSoulState, loadState } from '../core/soulState.js';
import { runInnerLoop } from '../core/innerLoop.js';

const router = Router();

// Get system status
router.get('/core/status', async (_req, res) => {
  try {
    const state = await loadState();
    res.json({
      status: 'ok',
      state: {
        cycle: state.cycle,
        confidence: state.agency_state.confidence,
        energy: state.agency_state.energyLevel,
        mode: state.agency_state.mode,
        stabilityScore: state.reality_metrics_summary.stabilityScore,
        evolutionScore: state.reality_metrics_summary.evolutionScore,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get full dashboard data
router.get('/dashboard', async (_req, res) => {
  try {
    const state = await loadState();
    res.json({
      soulState: state,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Trigger Inner Loop manually
router.get('/core/run-loop', async (_req, res) => {
  try {
    console.log('Manual Inner Loop trigger received');
    const result = await runInnerLoop();
    res.json({
      success: result.success,
      cycle: result.cycle,
      duration: result.duration,
      summary: result.summary,
      error: result.error,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to run Inner Loop',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Set goals
router.post('/core/goals', async (req, res) => {
  try {
    const { goals } = req.body;
    if (!Array.isArray(goals)) {
      return res.status(400).json({ error: 'Goals must be an array' });
    }
    
    const state = getSoulState();
    state.goals = goals;
    
    res.json({
      success: true,
      goals: state.goals,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to set goals',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Set focus
router.post('/core/focus', async (req, res) => {
  try {
    const { focus } = req.body;
    if (typeof focus !== 'string') {
      return res.status(400).json({ error: 'Focus must be a string' });
    }
    
    const state = getSoulState();
    state.agency_state.currentFocus = focus;
    
    res.json({
      success: true,
      focus: state.agency_state.currentFocus,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to set focus',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
