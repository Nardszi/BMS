import { NextResponse } from "next/server";

interface APIError {
  error: string;
  code?: string;
  details?: unknown;
}

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 500, code?: string) {
  const body: APIError = { error: message };
  if (code) body.code = code;
  return NextResponse.json(body, { status });
}

export function apiUnauthorized() {
  return apiError("Unauthorized", 401, "UNAUTHORIZED");
}

export function apiForbidden() {
  return apiError("Forbidden", 403, "FORBIDDEN");
}

export function apiNotFound(resource = "Resource") {
  return apiError(`${resource} not found`, 404, "NOT_FOUND");
}

export function apiBadRequest(message: string) {
  return apiError(message, 400, "BAD_REQUEST");
}

export function apiConflict(message: string) {
  return apiError(message, 409, "CONFLICT");
}

export function apiInternalError(error?: unknown) {
  console.error("Internal error:", error);
  return apiError("Internal server error", 500, "INTERNAL_ERROR");
}
