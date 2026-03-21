import mongoose from "mongoose";
import { env } from "@/src/lib/env";

declare global {
  var __mongooseConnectionPromise:
    | Promise<typeof mongoose>
    | undefined;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!global.__mongooseConnectionPromise) {
    global.__mongooseConnectionPromise = mongoose.connect(env.mongodbUri(), {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
  }

  return global.__mongooseConnectionPromise;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    global.__mongooseConnectionPromise = undefined;
    return;
  }

  await mongoose.disconnect();
  global.__mongooseConnectionPromise = undefined;
}
