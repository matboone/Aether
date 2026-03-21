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
    });
  }

  return global.__mongooseConnectionPromise;
}
