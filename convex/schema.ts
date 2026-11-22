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

  posts: defineTable({
    authorProfileId: v.id("profiles"),
    authorTokenIdentifier: v.string(),
    createdAt: v.number(),
    body: v.string(),
    category: v.string(),
    likeCount: v.number(),
    commentCount: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_category_and_created_at", ["category", "createdAt"]),

  postLikes: defineTable({
    postId: v.id("posts"),
    tokenIdentifier: v.string(),
  })
    .index("by_post_and_token", ["postId", "tokenIdentifier"])
    .index("by_token_and_post", ["tokenIdentifier", "postId"]),

  comments: defineTable({
    postId: v.id("posts"),
    parentCommentId: v.union(v.id("comments"), v.null()),
    authorProfileId: v.id("profiles"),
    authorTokenIdentifier: v.string(),
    createdAt: v.number(),
    body: v.string(),
  })
    .index("by_post_parent_and_created", ["postId", "parentCommentId", "createdAt"]),

  savedPosts: defineTable({
    postId: v.id("posts"),
    tokenIdentifier: v.string(),
  })
    .index("by_token_and_post", ["tokenIdentifier", "postId"]),

});
