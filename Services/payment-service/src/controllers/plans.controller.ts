import { Request, Response } from 'express';
import * as PlansService from '../services/plans.service';

export async function getAllPlans(req: Request, res: Response): Promise<void> {
  try {
    const plans = await PlansService.getAllPlans();

    if (!plans.length) {
      res.status(404).json({ success: false, message: 'No plans found' });
      return;
    }

    res.status(200).json({ success: true, count: plans.length, data: plans });
  } catch (error: any) {
    console.error('[PlansController.getAllPlans]', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch plans', error: error.message });
  }
}

export async function getPlanByKey(req: Request, res: Response): Promise<void> {
  const { planKey } = req.params;

  try {
    const plan = await PlansService.getPlanByKey(planKey);

    if (!plan) {
      res.status(404).json({ success: false, message: `Plan "${planKey}" not found` });
      return;
    }

    res.status(200).json({ success: true, data: plan });
  } catch (error: any) {
    console.error(`[PlansController.getPlanByKey] planKey=${planKey}`, error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch plan', error: error.message });
  }
}
