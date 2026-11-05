import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import conversationsRouter from "./conversations";
import memoriesRouter from "./memories";
import transcribeRouter from "./transcribe";
import reviewsRouter from "./reviews";
import communityQuestionsRouter from "./community-questions";
import reportsRouter from "./reports";
import careerMatchRouter from "./career-match";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(conversationsRouter);
router.use(memoriesRouter);
router.use(transcribeRouter);
router.use(reviewsRouter);
router.use(communityQuestionsRouter);
router.use(reportsRouter);
router.use(careerMatchRouter);

export default router;
