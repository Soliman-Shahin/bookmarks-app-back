// Import the required modules
import { Schema, model, Document, Model } from "mongoose";
import _ from "lodash";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "dotenv";
config();

// Define some constants
const CUSTOM_JWT = "51778657246321226641fsdklafjasdkljfsklfjd7148924065";
const TOKEN_EXPIRATION_TIME = "1h";
const TOKEN_ALGORITHM = "HS256";
const TOKEN_LENGTH = 64;
const SIGNUP_TYPES = {
  NORMAL: "normal",
  FACEBOOK: "facebook",
  GOOGLE: "google",
};

// Define an interface for the user document
export interface UserDocument extends Document {
  userId?: string;
  socialId?: string;
  signupType?: string;
  email: string;
  password: string;
  username?: string;
  image?: string;
  sessions: any[];
}

// Define an interface for the user model with static methods
export interface UserModel extends Model<UserDocument> {
  // Declare the static methods here
  findByIdAndToken(_id: string, token: string): Promise<UserDocument>;
  hasRefreshTokenExpired(expiresAt: number): boolean;
  generateAccessAuthToken(): Promise<string>;
  getJWTSecret(): Promise<any>;
}

// JWT Secret
const jwtSecret = process.env.ACCESS_TOKEN_SECRET ?? CUSTOM_JWT;

// Define the user schema
const UserSchema = new Schema<UserDocument>(
  {
    userId: String,
    socialId: String,
    signupType: {
      type: String,
      enum: Object.values(SIGNUP_TYPES),
      default: SIGNUP_TYPES.NORMAL,
    },
    email: {
      type: String,
      required: true,
      minlength: 1,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    username: {
      type: String,
    },
    image: {
      type: String,
    },
    sessions: [
      {
        token: {
          type: String,
          required: true,
        },
        expiresAt: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// *** Instance methods ***
UserSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  // return the document except the password and sessions (these shouldn't be made available)
  return _.omit(userObject, ["password", "sessions"]);
};

UserSchema.methods.generateAccessAuthToken =
  async function (): Promise<string> {
    // Used async/await syntax to simplify the promise logic
    try {
      // Used object destructuring to get the user id
      const { _id } = this;
      // Created the JSON Web Token and returned it
      const token: any = jwt.sign({ _id: _id.toString() }, jwtSecret, {
        algorithm: TOKEN_ALGORITHM,
        expiresIn: TOKEN_EXPIRATION_TIME,
      });
      return token;
    } catch (error) {
      // Threw the error instead of rejecting it
      throw error;
    }
  };

UserSchema.methods.createRefreshToken = async function () {
  try {
    // Generated a random buffer and converted it to hex
    const buf = crypto.randomBytes(TOKEN_LENGTH);
    const token = buf.toString("hex");
    return token;
  } catch (error) {
    // Threw the error instead of rejecting it
    throw error;
  }
};

UserSchema.methods.createSession = async function () {
  try {
    // Used a constant for the refresh token
    const refreshToken = await this.createRefreshToken();
    // Used await instead of then to handle the promise
    await saveSessionToDatabase(this, refreshToken);
    return refreshToken;
  } catch (error) {
    // Threw the error instead of rejecting it
    throw new Error(`Failed to save session to database.\n  ${error}`);
  }
};

/* MODEL METHODS (static methods) */
UserSchema.statics.getJWTSecret = () => jwtSecret;

UserSchema.statics.findByIdAndToken = async (
  _id,
  token
): Promise<UserDocument> => {
  try {
    const query = { _id, "sessions.token": token };
    const user: any = await User.findOne(query);
    return user;
  } catch (error) {
    throw error;
  }
};

UserSchema.statics.hasRefreshTokenExpired = (expiresAt): boolean => {
  const secondsSinceEpoch = Date.now() / 1000;
  return !(expiresAt > secondsSinceEpoch);
  // This method checks if a refresh token has expired or not
  // It takes the expiresAt parameter, which is a timestamp in seconds
  // It returns true if the token has expired, false otherwise
};

/* HELPER METHODS */
const saveSessionToDatabase = async (user: any, refreshToken: any) => {
  // This function saves a session to the database
  // It takes the user document and the refresh token as parameters
  // It updates the user document with the refresh token and its expiration time
  // It returns a promise that resolves with the refresh token or rejects with an error

  try {
    const expiresAt = generateRefreshTokenExpiryTime();

    // Initialize user.sessions as an empty array
    user.sessions = [];

    user.sessions.push({ token: refreshToken, expiresAt });

    await user.save();

    // Returned the refresh token directly
    return refreshToken;
  } catch (error) {
    throw error;
  }
};

const generateRefreshTokenExpiryTime = () => {
  // This function calculates the expiration time of a refresh token
  // It returns the expiration time as a timestamp in seconds

  // Used a constant for the number of days until the token expires
  const DAYS_UNTIL_EXPIRE = 10;
  // Used a mathematical expression to calculate the number of seconds
  const secondsUntilExpire = DAYS_UNTIL_EXPIRE * 24 * 60 * 60;
  // Used a constant for the conversion factor from milliseconds to seconds
  const MILLISECONDS_TO_SECONDS = 1000;
  // Divided the current time by the conversion factor
  const currentTimeInSeconds = Date.now() / MILLISECONDS_TO_SECONDS;
  // Added the number of seconds until expire to the current time
  return currentTimeInSeconds + secondsUntilExpire;
};

// Create the user model using generics
const User = model<UserDocument, UserModel>("User", UserSchema, "Users");

export { User }; // export the user model
