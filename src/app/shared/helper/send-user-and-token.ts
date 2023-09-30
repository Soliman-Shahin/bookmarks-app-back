import { handleError } from ".";

// Get the environment variables
const { ACCESS_TOKEN_SECRET } = process.env;

// Constants for header names
const REFRESH_TOKEN_HEADER = "refresh-token";
const ACCESS_TOKEN_HEADER = "access-token";

// Helper function for sending user and tokens
const sendUserAndTokens = async (res: any, user: any) => {
  try {
    // Generate and send tokens in the response headers
    const [refreshToken, accessToken] = await generateAndSendTokens(res, user);
    // Send user in the response body
    res.send(user);
  } catch (error: any) {
    // Handle error
    handleError(error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function for generating and sending tokens
const generateAndSendTokens = async (res: any, user: any) => {
  // Generate refresh token and save it in the user's session
  const refreshToken = await user.createSession();
  // Generate access token using secret key
  const accessToken = await user.generateAccessAuthToken(ACCESS_TOKEN_SECRET);
  // Send tokens in the response headers
  res
    .header(REFRESH_TOKEN_HEADER, refreshToken)
    .header(ACCESS_TOKEN_HEADER, accessToken);
  // Return tokens as an array
  return [refreshToken, accessToken];
};

export { sendUserAndTokens };
