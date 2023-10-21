import express from "express";
import userRoutes from "./user.route";
import bookmarkRoutes from "./bookmark.route";
import tagRoutes from "./tag.route";

const router = express.Router();

router.use("/user", userRoutes);
router.use("/bookmark", bookmarkRoutes);
router.use("/tag", tagRoutes);

export default router;
