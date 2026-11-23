"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import {
  useConvexAuth,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

const avatarColors = [
  { id: "sky", label: "Sky blue", value: "#8bbcff" },
  { id: "violet", label: "Soft violet", value: "#a89af5" },
  { id: "mint", label: "Sea glass", value: "#81c8ad" },
  { id: "coral", label: "Coral", value: "#ed9c8d" },
  { id: "gold", label: "Golden hour", value: "#e6bd69" },
  { id: "rose", label: "Rose", value: "#dd91ae" },
] as const;

type AvatarColor = (typeof avatarColors)[number]["id"];

const avatarColorMap: Record<string, string> = Object.fromEntries(
  avatarColors.map((color) => [color.id, color.value]),
);

function Avatar({
  nickname,
  color,
}: {
  nickname: string;
  color: string | null;
}) {
  return (
    <span
      className="community-avatar"
      style={{
        backgroundColor: avatarColorMap[color ?? "sky"] ?? avatarColorMap.sky,
      }}
      aria-hidden="true"
    >
      {nickname.charAt(0).toUpperCase()}
    </span>
  );
}

function CommentReplies({
  postId,
  parentCommentId,
}: {
  postId: Id<"posts">;
  parentCommentId: Id<"comments">;
}) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.comments.list,
    { postId, parentCommentId },
    { initialNumItems: 5 },
  );
  const createComment = useMutation(api.comments.create);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await createComment({ postId, parentCommentId, body });
      setBody("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not add your reply. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="community-replies">
      {results.map((reply) => (
        <div className="community-comment" key={reply._id}>
          <Avatar
            nickname={reply.author.nickname}
            color={reply.author.avatarColor}
          />
          <div className="community-comment-copy">
            <strong>@{reply.author.nickname}</strong>
            <p>{reply.body}</p>
          </div>
        </div>
      ))}
      {status === "CanLoadMore" && (
        <button
          className="community-text-button"
          type="button"
          onClick={() => loadMore(5)}
        >
          Show more replies
        </button>
      )}
      <form className="community-reply-form" onSubmit={submitReply}>
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={1000}
          placeholder="Write a thoughtful reply…"
          aria-label="Write a reply"
          required
        />
        <button type="submit" disabled={isSubmitting || !body.trim()}>
          Reply
        </button>
      </form>
      {error && (
        <p className="community-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function CommentThread({ postId }: { postId: Id<"posts"> }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.comments.list,
    { postId, parentCommentId: null },
    { initialNumItems: 10 },
  );
  const createComment = useMutation(api.comments.create);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Id<"comments"> | null>(null);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await createComment({ postId, parentCommentId: null, body });
      setBody("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not add your comment. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="community-comments" aria-label="Comments">
      <form className="community-comment-form" onSubmit={submitComment}>
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={1000}
          placeholder="Leave a kind comment…"
          aria-label="Write a comment"
          required
        />
        <button type="submit" disabled={isSubmitting || !body.trim()}>
          Comment
        </button>
      </form>
      {error && (
        <p className="community-error" role="alert">
          {error}
        </p>
      )}
      {results.length === 0 && status !== "LoadingFirstPage" ? (
        <p className="community-empty-comments">
          No comments yet. You can start the conversation.
        </p>
      ) : (
        <div className="community-comment-list">
          {results.map((comment) => (
            <div className="community-comment-block" key={comment._id}>
              <div className="community-comment">
                <Avatar
                  nickname={comment.author.nickname}
                  color={comment.author.avatarColor}
                />
                <div className="community-comment-copy">
                  <strong>@{comment.author.nickname}</strong>
                  <p>{comment.body}</p>
                  <button
                    className="community-text-button"
                    type="button"
                    onClick={() =>
                      setReplyingTo(
                        replyingTo === comment._id ? null : comment._id,
                      )
                    }
                  >
                    {replyingTo === comment._id ? "Close replies" : "Reply"}
                  </button>
                </div>
              </div>
              {replyingTo === comment._id && (
                <CommentReplies postId={postId} parentCommentId={comment._id} />
              )}
            </div>
          ))}
        </div>
      )}
      {status === "CanLoadMore" && (
        <button
          className="community-text-button"
          type="button"
          onClick={() => loadMore(10)}
        >
          Show more comments
        </button>
      )}
    </section>
  );
}

function PostCard({
  post,
}: {
  post: {
    _id: Id<"posts">;
    _creationTime: number;
    body: string;
    category: string;
    likeCount: number;
    commentCount: number;
    author: { nickname: string; avatarColor: string | null };
    viewer: { liked: boolean; saved: boolean };
  };
}) {
  const toggleLike = useMutation(api.posts.toggleLike);
  const toggleSave = useMutation(api.posts.toggleSave);
  const [showComments, setShowComments] = useState(false);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<"like" | "save" | null>(
    null,
  );
  const categoryLabel = post.category.replaceAll("_", " ");

  async function toggle(action: "like" | "save") {
    setError("");
    setPendingAction(action);
    try {
      if (action === "like") await toggleLike({ postId: post._id });
      else await toggleSave({ postId: post._id });
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : `Could not ${action === "like" ? "update your like" : "save this post"}.`,
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <article className="community-post">
      <div className="community-post-header">
        <Avatar
          nickname={post.author.nickname}
          color={post.author.avatarColor}
        />
        <div className="community-author">
          <strong>@{post.author.nickname}</strong>
          <span>
            {new Date(post._creationTime).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <span className="community-category">{categoryLabel}</span>
      </div>
      <p className="community-post-body">{post.body}</p>
      <div className="community-post-actions">
        <button
          className={`community-action${post.viewer.liked ? " selected" : ""}`}
          type="button"
          onClick={() => void toggle("like")}
          disabled={pendingAction !== null}
          aria-pressed={post.viewer.liked}
          aria-label={post.viewer.liked ? "Unlike post" : "Like post"}
        >
          <span aria-hidden="true">{post.viewer.liked ? "♥" : "♡"}</span>
          {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
        </button>
        <button
          className="community-action"
          type="button"
          onClick={() => setShowComments((shown) => !shown)}
          aria-expanded={showComments}
        >
          <span aria-hidden="true">◷</span>
          {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
        </button>
        <button
          className={`community-action community-save${post.viewer.saved ? " selected" : ""}`}
          type="button"
          onClick={() => void toggle("save")}
          disabled={pendingAction !== null}
          aria-pressed={post.viewer.saved}
        >
          {post.viewer.saved ? "Saved" : "Save"}
        </button>
      </div>
      {error && (
        <p className="community-error" role="alert">
          {error}
        </p>
      )}
      {showComments && <CommentThread postId={post._id} />}
    </article>
  );
}

export default function CommunityPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { isAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth();
  const profile = useQuery(
    api.users.currentProfile,
    isAuthenticated ? {} : "skip",
  );
  const categories = useQuery(api.categories.listCategories, {});
  const [category, setCategory] = useState("all");
  const [section, setSection] = useState<"community" | "saved">("community");
  const [body, setBody] = useState("");
  const [postCategory, setPostCategory] = useState("");
  const [composerError, setComposerError] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState<string | null>(null);
  const [avatarColorDraft, setAvatarColorDraft] = useState<string | null>(null);
  const [profileError, setProfileError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const createPost = useMutation(api.posts.create);
  const savePublicProfile = useMutation(api.users.savePublicProfile);
  const communityPosts = usePaginatedQuery(
    api.posts.list,
    { category },
    { initialNumItems: 10 },
  );
  const savedPosts = usePaginatedQuery(
    api.posts.listSaved,
    {},
    { initialNumItems: 10 },
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/");
      return;
    }
    if (!isAuthenticated || profile === undefined) return;
    if (!profile || profile.avatarColor === null) {
      router.replace("/onboarding/profile");
    }
  }, [isAuthenticated, isLoaded, isSignedIn, profile, router]);

  const activePostCategory = postCategory || categories?.[0]?.slug || "";

  function openProfileSettings() {
    setNicknameDraft(profile?.nickname ?? "");
    setAvatarColorDraft(profile?.avatarColor ?? "sky");
    setProfileError("");
    setShowProfileSettings(true);
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError("");
    setIsSavingProfile(true);
    try {
      await savePublicProfile({
        nickname: nicknameDraft ?? profile?.nickname ?? "",
        avatarColor: (avatarColorDraft ??
          profile?.avatarColor ??
          "sky") as AvatarColor,
      });
      setShowProfileSettings(false);
    } catch (saveError) {
      setProfileError(
        saveError instanceof Error
          ? saveError.message
          : "Could not update your profile. Please try again.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setComposerError("");
    setIsPosting(true);
    try {
      await createPost({ body, category: activePostCategory });
      setBody("");
      setCategory("all");
      setSection("community");
    } catch (submitError) {
      setComposerError(
        submitError instanceof Error
          ? submitError.message
          : "Could not share your post. Please try again.",
      );
    } finally {
      setIsPosting(false);
    }
  }

  const ready =
    isLoaded &&
    isSignedIn &&
    isAuthenticated &&
    profile !== undefined &&
    profile !== null &&
    profile.avatarColor !== null;

  if (!ready) {
    return (
      <main className="community-page community-loading" aria-live="polite">
        <span className="loading-mark">w.</span>
        <p>
          {isLoaded && isSignedIn && !isConvexAuthLoading
            ? "Opening your community…"
            : "Connecting to your community…"}
        </p>
      </main>
    );
  }

  const posts =
    section === "community" ? communityPosts.results : savedPosts.results;
  const postStatus =
    section === "community" ? communityPosts.status : savedPosts.status;
  const loadMorePosts =
    section === "community" ? communityPosts.loadMore : savedPosts.loadMore;

  return (
    <main className="community-page">
      <header className="community-topbar">
        <Link className="community-brand" href="/" aria-label="Whisper home">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            whisper<span className="brand-period">.</span>
          </span>
        </Link>
        <div className="community-account">
          <button
            className="community-profile-button"
            type="button"
            onClick={openProfileSettings}
            aria-haspopup="dialog"
          >
            <Avatar nickname={profile.nickname} color={profile.avatarColor} />
            <span>@{profile.nickname}</span>
          </button>
          <button type="button" onClick={() => signOut({ redirectUrl: "/" })}>
            Sign out
          </button>
        </div>
      </header>

      {showProfileSettings && (
        <div
          className="profile-settings-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setShowProfileSettings(false);
          }}
        >
          <section
            className="profile-settings"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-settings-title"
          >
            <div className="profile-settings-header">
              <div>
                <span className="community-eyebrow">
                  <span /> Public profile
                </span>
                <h2 id="profile-settings-title">Edit how you appear</h2>
              </div>
              <button
                className="profile-settings-close"
                type="button"
                onClick={() => setShowProfileSettings(false)}
                aria-label="Close profile settings"
              >
                ×
              </button>
            </div>

            <form className="profile-settings-form" onSubmit={submitProfile}>
              <div className="profile-settings-preview">
                <Avatar
                  nickname={nicknameDraft?.trim() || profile.nickname}
                  color={avatarColorDraft || profile.avatarColor}
                />
                <div>
                  <span>PREVIEW</span>
                  <strong>@{nicknameDraft?.trim() || profile.nickname}</strong>
                </div>
              </div>

              <label htmlFor="profile-nickname">Nickname</label>
              <input
                id="profile-nickname"
                value={nicknameDraft ?? profile.nickname}
                onChange={(event) => setNicknameDraft(event.target.value)}
                minLength={3}
                maxLength={20}
                pattern="[A-Za-z0-9_]{3,20}"
                autoComplete="off"
                required
              />
              <span className="profile-settings-help">
                3–20 characters · letters, numbers, and underscores
              </span>

              <fieldset className="profile-color-fieldset">
                <legend>Avatar colour</legend>
                <div className="profile-color-options">
                  {avatarColors.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      className={
                        avatarColorDraft === color.id ? "selected" : ""
                      }
                      style={{ "--swatch": color.value } as CSSProperties}
                      aria-label={color.label}
                      aria-pressed={avatarColorDraft === color.id}
                      onClick={() => setAvatarColorDraft(color.id)}
                    >
                      <span />
                    </button>
                  ))}
                </div>
              </fieldset>

              {profileError && (
                <p className="community-error" role="alert">
                  {profileError}
                </p>
              )}

              <div className="profile-settings-actions">
                <button
                  className="profile-settings-cancel"
                  type="button"
                  onClick={() => setShowProfileSettings(false)}
                >
                  Cancel
                </button>
                <button
                  className="profile-settings-save"
                  type="submit"
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <div className="community-layout">
        <section className="community-main">
          <div className="community-heading">
            <div>
              <span className="community-eyebrow">
                <span /> A little less alone
              </span>
              <h1>Community</h1>
              <p>Share what’s on your mind. Meet others with kindness.</p>
            </div>
            <span className="community-anonymous">
              <span aria-hidden="true">◇</span> Your identity stays private
            </span>
          </div>

          <form className="community-composer" onSubmit={submitPost}>
            <label htmlFor="community-post">
              What would you like to share?
            </label>
            <textarea
              id="community-post"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={2000}
              placeholder="You can say it here…"
              required
            />
            <div className="community-composer-footer">
              <label className="community-category-select">
                Category
                <select
                  value={activePostCategory}
                  onChange={(event) => setPostCategory(event.target.value)}
                  required
                >
                  {categories?.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <span>{body.length}/2000</span>
              <button
                type="submit"
                disabled={
                  isPosting ||
                  !body.trim() ||
                  !activePostCategory ||
                  !categories
                }
              >
                {isPosting ? "Sharing…" : "Share post"}
                <span aria-hidden="true">→</span>
              </button>
            </div>
            {composerError && (
              <p className="community-error" role="alert">
                {composerError}
              </p>
            )}
          </form>

          <div className="community-feed-controls">
            <div className="community-section-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={section === "community"}
                className={section === "community" ? "active" : ""}
                onClick={() => setSection("community")}
              >
                Community feed
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={section === "saved"}
                className={section === "saved" ? "active" : ""}
                onClick={() => setSection("saved")}
              >
                Saved posts
              </button>
            </div>
            {section === "community" && (
              <div
                className="community-filters"
                aria-label="Filter by category"
              >
                <button
                  type="button"
                  className={category === "all" ? "selected" : ""}
                  aria-pressed={category === "all"}
                  onClick={() => setCategory("all")}
                >
                  All
                </button>
                {categories?.map((item) => (
                  <button
                    type="button"
                    key={item.slug}
                    className={category === item.slug ? "selected" : ""}
                    aria-pressed={category === item.slug}
                    onClick={() => setCategory(item.slug)}
                    title={item.description}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="community-post-list">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
            {posts.length === 0 && postStatus !== "LoadingFirstPage" && (
              <div className="community-empty">
                <span aria-hidden="true">✳</span>
                <h2>
                  {section === "saved"
                    ? "Nothing saved yet."
                    : "A quiet moment."}
                </h2>
                <p>
                  {section === "saved"
                    ? "Save a post you want to come back to, and it will be waiting here."
                    : "Be the first to share something in this category."}
                </p>
              </div>
            )}
            {postStatus === "LoadingFirstPage" && (
              <p className="community-feed-status">Loading posts…</p>
            )}
            {postStatus === "CanLoadMore" && (
              <button
                className="community-load-more"
                type="button"
                onClick={() => loadMorePosts(10)}
              >
                Load more posts
              </button>
            )}
            {postStatus === "LoadingMore" && (
              <p className="community-feed-status">Loading more posts…</p>
            )}
          </div>
        </section>
        <aside className="community-guidelines">
          <span className="community-guidelines-icon">✳</span>
          <h2>A softer corner of the internet.</h2>
          <p>
            Be kind with someone else’s story. Share only what feels safe to
            share, and remember that a little compassion can go a long way.
          </p>
          <div>
            <span>01</span> Assume good intentions
          </div>
          <div>
            <span>02</span> Keep each other’s confidence
          </div>
          <div>
            <span>03</span> Make room for every voice
          </div>
        </aside>
      </div>
    </main>
  );
}
