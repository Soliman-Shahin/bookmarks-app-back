// A generic error handler that handles different types of errors
const handleError = function (
  res: any,
  error: any = { message: "An error occurred" }
) {
  res.status(500).send({ status: 500, message: error.message });
  // Exit the process with a non-zero exit code
  // process.exit(1);
};

// A custom error class that inherits from Error
class NotFoundError extends Error {
  code: string;
  constructor(message: string) {
    // Call the parent constructor with the message
    super(message);
    // Set the name and code of the error
    this.name = "NotFoundError";
    this.code = "ENOENT";
  }
}

// A custom error class that inherits from Error
class ValidationError extends Error {
  code: string;
  constructor(message: string) {
    // Call the parent constructor with the message
    super(message);
    // Set the name and code of the error
    this.name = "ValidationError";
    this.code = "EVALID";
  }
}

export { handleError, NotFoundError, ValidationError };
