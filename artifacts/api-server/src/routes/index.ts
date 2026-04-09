import { Router, type IRouter } from "express";
import healthRouter from "./health";
import organizationsRouter from "./organizations";
import workersRouter from "./workers";
import contractsRouter from "./contracts";
import paymentsRouter from "./payments";
import complianceRouter from "./compliance";
import onboardingRouter from "./onboarding";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";
import onboardingEngineRouter from "./onboarding-engine";

const router: IRouter = Router();

router.use(authRouter);
router.use(onboardingEngineRouter);
router.use(healthRouter);
router.use(organizationsRouter);
router.use(workersRouter);
router.use(contractsRouter);
router.use(paymentsRouter);
router.use(complianceRouter);
router.use(onboardingRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);

export default router;
