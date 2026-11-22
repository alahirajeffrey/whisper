import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

const avatarColorValidator = v.union(
  v.literal("sky"), v.literal("violet"), v.literal("mint"),
  v.literal("coral"), v.literal("gold"), v.literal("rose"), v.null(),
);

const commentResultValidator = v.object({
  _id: v.id("comments"),
  _creationTime: v.number(),
  postId: v.id("posts"),
  parentCommentId: v.union(v.id("comments"), v.null()),
  body: v.string(),
  author: v.object({ nickname: v.string(), avatarColor: avatarColorValidator }),
});

export const list = query({
  args: {
    postId: v.id("posts"),
    parentCommentId: v.optional(v.union(v.id("comments"), v.null())),
    paginationOpts: paginationOptsValidator,
  },
  returns: paginationResultValidator(commentResultValidator),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("comments")
       .withIndex("by_post_parent_and_created", (q) =>
        q.eq("postId", args.postId).eq("parentCommentId", args.parentCommentId ?? null))
      .order("asc")
      .paginate(args.paginationOpts);

    const comments = await Promise.all(page.page.map(async (comment: Doc<"comments">) => {
      const profile = await ctx.db.get(comment.authorProfileId);
      return {
        _id: comment._id,
        _creationTime: comment._creationTime,
        postId: comment.postId,
        parentCommentId: comment.parentCommentId,
        body: comment.body,
        author: {
          nickname: profile?.nickname ?? "deleted_user",
          avatarColor: profile?.avatarColor ?? null,
        },
      };
    }));

    return { ...page, page: comments };
  },
});

export const create = mutation({
  args: {
    postId: v.id("posts"),
    body: v.string(),
    parentCommentId: v.union(v.id("comments"), v.null()),
  },
  returns: v.id("comments"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must be signed in.");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!profile) throw new Error("Set up your public profile before commenting.");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found.");

    const body = args.body.trim();
    if (body.length < 1 || body.length > 1000) {
      throw new Error("A comment must contain between 1 and 1000 characters.");
    }

    if (args.parentCommentId) {
      const parent = await ctx.db.get(args.parentCommentId);
      if (!parent) throw new Error("Parent comment not found.");
      if (parent.postId !== args.postId) throw new Error("Reply must belong to the same post.");
      if (parent.parentCommentId !== null) throw new Error("Only replies to top-level comments are supported.");
    }

    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      parentCommentId: args.parentCommentId,
      authorProfileId: profile._id,
      authorTokenIdentifier: identity.tokenIdentifier,
      createdAt: Date.now(),
      body,
    });

    await ctx.db.patch(args.postId, { commentCount: post.commentCount + 1 });
    return commentId;
  },
});
