export class ApplicationError<T = undefined> extends Error {
  statusCode: number;
  details: T | undefined;

  constructor(message: string, statusCode = 500, details?: T) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;

    Object.setPrototypeOf(this, ApplicationError.prototype);
  }
}
