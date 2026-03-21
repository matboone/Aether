import mongoose, { Schema } from "mongoose";

export function getModel<T>(name: string, schema: Schema<T>) {
  return (mongoose.models[name] as mongoose.Model<T>) ||
    mongoose.model<T>(name, schema);
}
