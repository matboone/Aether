import { NextResponse } from "next/server";
import type { ApiErrorBody } from "@/src/types/dto";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function ok<T>(body: T, status = 200): NextResponse<T> {
  return NextResponse.json(body, { status });
}

export function fail(error: ApiError | Error): NextResponse<ApiErrorBody> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "Unexpected server error",
      },
    },
    { status: 500 },
  );
}

export async function parseJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError("INVALID_JSON", "Request body must be valid JSON");
  }
}

export function requireString(
  value: unknown,
  fieldName: string,
  options?: { allowEmpty?: boolean },
): string {
  if (typeof value !== "string") {
    throw new ApiError(
      "INVALID_INPUT",
      `Field "${fieldName}" must be a string`,
      400,
    );
  }

  const trimmed = value.trim();
  if (!options?.allowEmpty && trimmed.length === 0) {
    throw new ApiError(
      "INVALID_INPUT",
      `Field "${fieldName}" must not be empty`,
      400,
    );
  }

  return trimmed;
}

export function requireObjectIdString(
  value: unknown,
  fieldName: string,
): string {
  const text = requireString(value, fieldName);
  if (!/^[a-f\d]{24}$/i.test(text)) {
    throw new ApiError(
      "INVALID_INPUT",
      `Field "${fieldName}" must be a valid id`,
      400,
    );
  }
  return text;
}
