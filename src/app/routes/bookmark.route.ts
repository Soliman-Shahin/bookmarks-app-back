import express, { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/index";
import {
  getAllBookmarks,
  getBookmark,
  getBookmarkIcon,
  createBookmark,
  insertManyBookmarks,
  findBookmarkById,
  updateBookmark,
  deleteBookmark,
} from "../controllers/index";

// Define types and constants
interface DecodedToken {
  _id: string;
}

const router = express.Router();
const ACCESS_TOKEN_HEADER = "access-token";
const UNAUTHORIZED_STATUS = 500;

// Define middleware function to verify JWT token
const authenticate = async (req: any, res: any, next: any) => {
  // Get token from header
  const token = req.header(ACCESS_TOKEN_HEADER);

  try {
    // Get secret key from User model
    const secretKey = await User.getJWTSecret();
    // Verify token using secret key
    const decoded = jwt.verify(token, secretKey);
    // Token is valid - set user_id and proceed
    if (isDecodedToken(decoded)) {
      req.user_id = decoded._id;
    } else {
      // Handle invalid token case
    }
    next();
  } catch (err) {
    // Token is invalid - do not authenticate
    res.status(UNAUTHORIZED_STATUS).send(err);
  }
};

function isDecodedToken(value: any): value is DecodedToken {
  return typeof value === "object" && "_id" in value;
}

// Define routes using controller functions
router.get(
  "/bookmarks",
  authenticate,
  getAllBookmarks as unknown as RequestHandler
);
router.post(
  "/favicon",
  authenticate,
  getBookmarkIcon as unknown as RequestHandler
);
router.get("/:id", authenticate, getBookmark as unknown as RequestHandler);
router.post(
  "/create",
  authenticate,
  createBookmark as unknown as RequestHandler
);
router.post(
  "/import",
  authenticate,
  insertManyBookmarks as unknown as RequestHandler
);
router.patch(
  "/update/:id",
  authenticate,
  findBookmarkById as unknown as RequestHandler,
  updateBookmark as unknown as RequestHandler
);
router.delete(
  "/delete/:id",
  authenticate,
  findBookmarkById as unknown as RequestHandler,
  deleteBookmark as unknown as RequestHandler
);

// Export router object
export default router;
