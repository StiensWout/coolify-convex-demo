import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const COUNTER_KEY = "browserChecks";
const MAX_RECENT_CHECKS = 25;

export const snapshot = queryGeneric({
  args: {},
  handler: async ({ db }) => {
    const counter = await db
      .query("counters")
      .withIndex("by_key", (q) => q.eq("key", COUNTER_KEY))
      .unique();
    const recentChecks = await db.query("checks").order("desc").take(8);

    return {
      checkCount: counter?.value ?? 0,
      recentChecks,
      serverNow: Date.now(),
    };
  },
});

export const checkIn = mutationGeneric({
  args: {
    source: v.string(),
    url: v.string(),
    userAgent: v.optional(v.string()),
    clientTime: v.number(),
    buildId: v.string(),
  },
  handler: async ({ db }, args) => {
    const now = Date.now();
    const counter = await db
      .query("counters")
      .withIndex("by_key", (q) => q.eq("key", COUNTER_KEY))
      .unique();

    const nextValue = (counter?.value ?? 0) + 1;
    if (counter) {
      await db.patch(counter._id, { value: nextValue, updatedAt: now });
    } else {
      await db.insert("counters", {
        key: COUNTER_KEY,
        value: nextValue,
        updatedAt: now,
      });
    }

    await db.insert("checks", args);

    const staleChecks = await db
      .query("checks")
      .order("desc")
      .take(MAX_RECENT_CHECKS + 10);
    await Promise.all(
      staleChecks.slice(MAX_RECENT_CHECKS).map((check) => db.delete(check._id)),
    );

    return { checkCount: nextValue, recordedAt: now };
  },
});
