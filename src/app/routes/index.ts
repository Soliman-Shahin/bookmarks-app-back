import express from "express";
import userRoutes from "./user.route";
import bookmarkRoutes from "./bookmark.route";

const router = express.Router();

router.use("/user", userRoutes);
router.use("/bookmark", bookmarkRoutes);

export default router;
