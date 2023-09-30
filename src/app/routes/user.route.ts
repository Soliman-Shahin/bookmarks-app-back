import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import { signUp, login, userAccessToken } from "../controllers/index";
import { User, UserDocument } from "../models/index";

const router = express.Router();

interface CustomRequest extends Request {
  user_id: string;
  userObject: UserDocument;
  refreshToken: string;
}

// Define middleware function to verify refresh token
const verifySession = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // grab the refresh token from the request header
    const refreshToken = req.header("refresh-token")!;

    // grab the _id from the request header
    const _id = req.header("_id")!;

    // find the user by id and token
    const user: UserDocument = await User.findByIdAndToken(_id, refreshToken);

    if (!user) {
      // user couldn't be found
      throw new Error(
        "User not found. Make sure that the refresh token and user id are correct"
      );
    }

    // if the code reaches here - the user was found
    // therefore the refresh token exists in the database - but we still have to check if it has expired or not

    // use non-null assertion operator (!)
    req.user_id = req.header("_id")!;
    req.userObject = user;
    req.refreshToken = req.header("refresh-token")!;

    // check if any session has the same token and has not expired
    const isSessionValid = user.sessions.some(
      (session: any) =>
        session.token === refreshToken &&
        !User.hasRefreshTokenExpired(session.expiresAt)
    );

    if (isSessionValid) {
      // the session is VALID - call next() to continue with processing this web request
      next();
    } else {
      // the session is not valid
      throw new Error("Refresh token has expired or the session is invalid");
    }
  } catch (error: any) {
    res.status(401).send({ error: error.message });
  }
};

router.post("/signup", signUp);
router.post("/login", login);
router.get(
  "/access-token",
  verifySession as unknown as RequestHandler,
  userAccessToken as unknown as RequestHandler
);

export default router;
