export type ParserMode = "demo" | "textract";

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function getOptionalEnv(name: string): string | undefined {
  return getEnv(name);
}

export function getRequiredEnv(
  name: "MONGODB_URI" | "GOOGLE_GENERATIVE_AI_API_KEY",
): string {
  const value = getEnv(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  mongodbUri: () => getRequiredEnv("MONGODB_URI"),
  googleApiKey: () => getRequiredEnv("GOOGLE_GENERATIVE_AI_API_KEY"),
  parserMode: (): ParserMode =>
    getOptionalEnv("BILL_PARSER_MODE") === "textract" ? "textract" : "demo",
  uploadDir: () => getOptionalEnv("UPLOAD_DIR") ?? ".demo/uploads",
  awsRegion: () => getOptionalEnv("AWS_REGION"),
  awsAccessKeyId: () => getOptionalEnv("AWS_ACCESS_KEY_ID"),
  awsSecretAccessKey: () => getOptionalEnv("AWS_SECRET_ACCESS_KEY"),
};

export function hasTextractConfig(): boolean {
  return Boolean(
    env.awsRegion() && env.awsAccessKeyId() && env.awsSecretAccessKey(),
  );
}
