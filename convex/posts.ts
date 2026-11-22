import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { isCuratedCategory } from "./categories";

const avatarColorValidator = v.union(
  v.literal("sky"), v.literal("violet"), v.literal("mint"),
  v.literal("coral"), v.literal("gold"), v.literal("rose"), v.null(),
);

const postResultValidator = v.object({
  _id: v.id("posts"),
  _creationTime: v.number(),
  body: v.string(),
  category: v.string(),
  likeCount: v.number(),
  commentCount: v.number(),
  author: v.object({
    nickname: v.string(),
    avatarColor: avatarColorValidator,
  }),
  viewer: v.object({ liked: v.boolean(), saved: v.boolean() }),
});

async function getProfile(ctx: QueryCtx | MutationCtx, tokenIdentifier: string) {
  return await ctx.db
    .query("profiles")
    .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();
}

async function requireProfile(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("You must be signed in.");
  const profile = await getProfile(ctx, identity.tokenIdentifier);
  if (!profile) throw new Error("Set up your public profile before posting.");
  return { identity, profile };
}

async function publicPost(ctx: QueryCtx, post: Doc<"posts">, tokenIdentifier: string | null) {
  const profile = await ctx.db.get(post.authorProfileId);
  let liked = false;
  let saved = false;
  if (tokenIdentifier) {
    const like = await ctx.db
      .query("postLikes")
      .withIndex("by_post_and_token", (q) =>
        q.eq("postId", post._id).eq("tokenIdentifier", tokenIdentifier))
      .unique();
    liked = like !== null;

    const save = await ctx.db
      .query("savedPosts")
      .withIndex("by_token_and_post", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier).eq("postId", post._id))
      .unique();
    saved = save !== null;
  }

  return {
    _id: post._id,
    _creationTime: post._creationTime,
    body: post.body,
    category: post.category,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    author: {
      nickname: profile?.nickname ?? "deleted_user",
      avatarColor: profile?.avatarColor ?? null,
    },
    viewer: { liked, saved },
  };
}

export const list = query({
  args: { category: v.string(), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(postResultValidator),
  handler: async (ctx, args) => {
    if (args.category !== "all" && !isCuratedCategory(args.category)) {
      throw new Error("Unknown category.");
    }

    const identity = await ctx.auth.getUserIdentity();
    const tokenIdentifier = identity?.tokenIdentifier ?? null;
    const query = args.category === "all"
      ? ctx.db.query("posts") .withIndex("by_created_at").order("desc")
      : ctx.db.query("posts")
           .withIndex("by_category_and_created_at", (q) => q.eq("category", args.category))
          .order("desc");
    const page = await query.paginate(args.paginationOpts);

    return {
      ...page,
      page: await Promise.all(page.page.map((post) => publicPost(ctx, post, tokenIdentifier))),
    };
  },
});

export const create = mutation({
  args: { body: v.string(), category: v.string() },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const { identity, profile } = await requireProfile(ctx);
    const body = args.body.trim();
    if (body.length < 1 || body.length > 2000) {
      throw new Error("A post must contain between 1 and 2000 characters.");
    }
    if (!isCuratedCategory(args.category)) throw new Error("Unknown category.");

    return await ctx.db.insert("posts", {
      authorProfileId: profile._id,
      authorTokenIdentifier: identity.tokenIdentifier,
      createdAt: Date.now(),
      body,
      category: args.category,
      likeCount: 0,
      commentCount: 0,
    });
  },
});

export const toggleLike = mutation({
  args: { postId: v.id("posts") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { identity } = await requireProfile(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found.");

    const existing = await ctx.db
      .query("postLikes")
      .withIndex("by_post_and_token", (q) =>
        q.eq("postId", args.postId).eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.postId, { likeCount: Math.max(0, post.likeCount - 1) });
      return false;
    }

    await ctx.db.insert("postLikes", {
      postId: args.postId,
      tokenIdentifier: identity.tokenIdentifier,
    });
    await ctx.db.patch(args.postId, { likeCount: post.likeCount + 1 });
    return true;
  },
});

export const toggleSave = mutation({
  args: { postId: v.id("posts") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { identity } = await requireProfile(ctx);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found.");

    const existing = await ctx.db
      .query("savedPosts")
      .withIndex("by_token_and_post", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier).eq("postId", args.postId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.insert("savedPosts", {
      postId: args.postId,
      tokenIdentifier: identity.tokenIdentifier,
    });
    return true;
  },
});

export const listSaved = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(postResultValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const page = await ctx.db
      .query("savedPosts")
      .withIndex("by_token_and_post", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .order("desc")
      .paginate(args.paginationOpts);

    const posts: Array<Awaited<ReturnType<typeof publicPost>>> = [];
    for (const saved of page.page) {
      const post = await ctx.db.get(saved.postId);
      if (post) posts.push(await publicPost(ctx, post, identity.tokenIdentifier));
    }

    return { ...page, page: posts };
  },
});
