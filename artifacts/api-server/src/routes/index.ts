import { Router, type IRouter } from "express";
import healthRouter from "./health";
import diningRouter from "./dining";

const router: IRouter = Router();

router.use(healthRouter);
router.use(diningRouter);

export default router;
