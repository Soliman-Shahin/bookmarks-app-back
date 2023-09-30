// Import the types for express, dotenv, cookie-parser and cors
import express, { Request, Response, NextFunction } from "express";
import { config } from "dotenv";
import { connectToDB } from "./db";
import cookieParser from "cookie-parser";
import cors from "cors";
import routes from "./routes";

// Define the types for the environment variables
type Env = { PORT?: string };

// Define the types for the allowed origins array
type AllowedOrigins = string[];

// Define a constant for the default port
const DEFAULT_PORT = 3000;

// Connect to the database and load the environment variables
void connectToDB();
config();

// Create an express app and get the port from the environment variables or use the default port
const app = express();
const port = (process.env as Env).PORT ?? DEFAULT_PORT;

// Enable CORS for all origins and set some headers
app.use(cors());
app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins: AllowedOrigins = [
    "http://localhost:4200",
    "http://localhost:8200",
    "http://localhost:8100",
  ];
  const origin = req.headers.origin as string;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.set("Access-Control-Expose-Headers", "access-token, refresh-token");
  res
    .header("Access-Control-Allow-Methods", "")
    .header("Access-Control-Allow-Credentials", "true")
    .header("Access-Control-Allow-Headers", "");
  next();
});

// Use some middleware to parse the request body and cookies
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Load routes
app.use("/v1", routes);

// Define a named function for the callback
function logServerStatus() {
  console.log(`[server]: Server is running at http://localhost:${port}`);
}

// Start the server and listen on the port
app.listen(port, logServerStatus);
