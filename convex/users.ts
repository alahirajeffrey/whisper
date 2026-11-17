import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const currentProfile = query({
  args: {},
  returns: v.union(v.object({ nickname: v.string() }), v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    return profile ? { nickname: profile.nickname } : null;
  },
});

export const saveNickname = mutation({
  args: { nickname: v.string() },
  returns: v.object({ nickname: v.string() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("You must be signed in to choose a nickname.");

    const nickname = args.nickname.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(nickname)) {
      throw new Error("Use 3–20 letters, numbers, or underscores.");
    }

    const normalizedNickname = nickname.toLowerCase();
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (existingProfile) {
      return { nickname: existingProfile.nickname };
    }

    const takenNickname = await ctx.db
      .query("profiles")
      .withIndex("by_normalized_nickname", (q) =>
        q.eq("normalizedNickname", normalizedNickname),
      )
      .unique();

    if (takenNickname) throw new Error("That nickname is already taken.");

    await ctx.db.insert("profiles", {
      tokenIdentifier: identity.tokenIdentifier,
      nickname,
      normalizedNickname,
    });

    return { nickname };
  },
});
