// Import the required modules
import { User, UserDocument, UserModel } from "../models/index";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { handleError, sendUserAndTokens } from "../shared/helper";

interface CustomRequest extends Request {
  userObject: UserModel;
}

// Get the environment variables
const { SALT_ROUNDS } = process.env;

// Constants for header names
const ACCESS_TOKEN_HEADER = "access-token";

// Define a type for the user credentials
type UserCredentials = { email: string; password: string };

// Define a function to validate the user credentials
const validateUserCredentials = async (
  credentials: UserCredentials
): Promise<UserDocument> => {
  // Destructure the email and password from the credentials
  const { email, password } = credentials;

  // Find the user by email
  const user = await User.findOne({ email });

  // Throw an error if the user is not found
  if (!user) {
    throw new Error("User not found");
  }

  // Compare the password with the hashed password
  const isPasswordMatch = await bcrypt.compare(password, user.password);

  // Throw an error if the password is invalid
  if (!isPasswordMatch) {
    throw new Error("Invalid Password");
  }

  // Return the user if everything is valid
  return user;
};

/**

POST /signup

Purpose: Sign up a new user */
const signUp = async (req: Request, res: Response) => {
  try {
    // Get the user’s email and password from the request body
    const { email, password } = req.body as UserCredentials;

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Send a conflict response with a message
      return res.status(409).json({ message: "Email already used" });
    }

    // Hash the password using bcrypt and salt rounds
    const hashedPassword = await bcrypt.hash(password, Number(SALT_ROUNDS));

    // Create a new user instance with the email and hashed password
    const newUser = new User({ email, password: hashedPassword });

    // Save the user to the database
    await newUser.save();

    // Use helper function to send user and tokens
    await sendUserAndTokens(res, newUser);
  } catch (error: any) {
    handleError(error);
    // Handle error
    res.status(400).json({ error: error.message });
  }
};

/**

POST /users/login

Purpose: Login */
const login = async (req: Request, res: Response) => {
  try {
    // Get the user’s email and password from the request body
    const credentials = req.body as UserCredentials;

    // Validate the user credentials and get the user object
    const user = await validateUserCredentials(credentials);

    // Use helper function to send user and tokens
    await sendUserAndTokens(res, user);
  } catch (error: any) {
    handleError(error);
    res.status(400).json({ error: error.message });
  }
};

/**

GET /users/me/access-token
Purpose: generates and returns an access token */
const userAccessToken = async (req: CustomRequest, res: Response) => {
  try {
    // we know that the user/caller is authenticated and we have the user_id and user object available to us
    const accessToken = await req.userObject.generateAccessAuthToken();
    res.header(ACCESS_TOKEN_HEADER, accessToken).send({ accessToken });
  } catch (error: any) {
    handleError(error);
    res.status(400).json({ error: error.message });
  }
};

export { signUp, login, userAccessToken };
