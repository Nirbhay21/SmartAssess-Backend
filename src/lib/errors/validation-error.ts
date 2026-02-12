import { ApplicationError } from "./application-error.ts";

export class ValidationError extends ApplicationError<Record<string, string[]>> {
  constructor(message: string, details?: Record<string, string[]>) {
    super(message, 400, details);
  }
}
