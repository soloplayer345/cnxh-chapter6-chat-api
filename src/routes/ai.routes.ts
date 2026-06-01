import { Router } from "express";
import * as aiController from "../controllers/ai.controller";

const router = Router();

router.post("/chat", aiController.chat);
router.get("/history/:sessionId", aiController.getHistory);
router.delete("/history/:sessionId", aiController.deleteHistory);

export default router;
