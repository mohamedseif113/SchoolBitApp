export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export interface ValidationErrorMap {
  [field: string]: string[];
}

export interface ApiErrorResponse {
  message?: string;
  errors?: ValidationErrorMap;
  success?: boolean;
  status?: number;
  [key: string]: any;
}

export class ApiError extends Error {
  status: number;
  errors: ValidationErrorMap;
  body: Record<string, any>;

  constructor(
    message: string,
    status: number = 500,
    errors: ValidationErrorMap = {},
    body: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.body = body;
  }
}
