import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const avatarColor = v.union(
  v.literal("sky"),
  v.literal("violet"),
  v.literal("mint"),
  v.literal("coral"),
  v.literal("gold"),
  v.literal("rose"),
);

export default defineSchema({
  profiles: defineTable({
    tokenIdentifier: v.string(),
    nickname: v.string(),
    normalizedNickname: v.string(),
    avatarColor: v.optional(avatarColor),
  })
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_normalized_nickname", ["normalizedNickname"]),
});
