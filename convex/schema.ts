import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    tokenIdentifier: v.string(),
    nickname: v.string(),
    normalizedNickname: v.string(),
  })
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_normalized_nickname", ["normalizedNickname"]),
});
