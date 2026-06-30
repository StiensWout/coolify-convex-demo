import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  checks: defineTable({
    source: v.string(),
    url: v.string(),
    userAgent: v.optional(v.string()),
    clientTime: v.number(),
    buildId: v.string(),
  }),
  counters: defineTable({
    key: v.string(),
    value: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
