import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const avatarColor = v.union(
  v.literal("sky"),
  v.literal("violet"),
  v.literal("mint"),
  v.literal("coral"),
  v.literal("gold"),
  v.literal("rose"),
);

export const currentProfile = query({
  args: {},
  returns: v.union(
    v.object({ nickname: v.string(), avatarColor: v.union(avatarColor, v.null()) }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    return profile
      ? { nickname: profile.nickname, avatarColor: profile.avatarColor ?? null }
      : null;
  },
});

export const savePublicProfile = mutation({
  args: { nickname: v.string(), avatarColor },
  returns: v.object({ nickname: v.string(), avatarColor }),
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

    const takenNickname = await ctx.db
      .query("profiles")
      .withIndex("by_normalized_nickname", (q) =>
        q.eq("normalizedNickname", normalizedNickname),
      )
      .unique();

    if (
      takenNickname &&
      takenNickname.tokenIdentifier !== identity.tokenIdentifier
    ) {
      throw new Error("That nickname is already taken.");
    }

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        nickname,
        normalizedNickname,
        avatarColor: args.avatarColor,
      });
    } else {
      await ctx.db.insert("profiles", {
        tokenIdentifier: identity.tokenIdentifier,
        nickname,
        normalizedNickname,
        avatarColor: args.avatarColor,
      });
    }

    return { nickname, avatarColor: args.avatarColor };
  },
});
