"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";

const avatarColors = [
  { id: "sky", label: "Sky blue", value: "#8bbcff" },
  { id: "violet", label: "Soft violet", value: "#a89af5" },
  { id: "mint", label: "Sea glass", value: "#81c8ad" },
  { id: "coral", label: "Coral", value: "#ed9c8d" },
  { id: "gold", label: "Golden hour", value: "#e6bd69" },
  { id: "rose", label: "Rose", value: "#dd91ae" },
] as const;

type AvatarColor = (typeof avatarColors)[number]["id"];

export default function PublicProfilePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { isAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth();
  const profile = useQuery(
    api.users.currentProfile,
    isAuthenticated ? {} : "skip",
  );
  const savePublicProfile = useMutation(api.users.savePublicProfile);
  const [nickname, setNickname] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState<AvatarColor | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/");
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (profile?.avatarColor) router.replace("/");
  }, [profile, router]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || (isAuthenticated && profile !== undefined))
      return;
    const timeout = window.setTimeout(() => setLoadingTimedOut(true), 12000);
    return () => window.clearTimeout(timeout);
  }, [isLoaded, isSignedIn, isAuthenticated, profile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await savePublicProfile({
        nickname: nicknameValue,
        avatarColor: selectedAvatarColor,
      });
      router.replace("/");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save your profile. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (
    !isLoaded ||
    !isSignedIn ||
    !isAuthenticated ||
    profile === undefined ||
    profile?.avatarColor
  ) {
    if (loadingTimedOut) {
      const profileQueryFailed = isAuthenticated && profile === undefined;
      return (
        <main className="profile-onboarding">
          <section className="profile-setup-card profile-recovery" role="alert">
            <div className="onboarding-eyebrow">
              <span /> PROFILE SETUP
            </div>
            <h1>
              {profileQueryFailed
                ? "We couldn’t load your profile."
                : "We couldn’t verify your session."}
            </h1>
            <p className="profile-intro">
              {profileQueryFailed
                ? "The profile service is not responding. Confirm the latest Convex schema and functions are synced to this deployment, then try again."
                : "Clerk signed you in, but Convex has not accepted the session. Confirm the Clerk Convex integration and issuer URL are configured on the same deployment."}
            </p>
            <div className="recovery-actions">
              <button
                className="profile-save"
                type="button"
                onClick={() => window.location.reload()}
              >
                Try again <span aria-hidden="true">↻</span>
              </button>
              <button
                className="recovery-signout"
                type="button"
                onClick={() => signOut({ redirectUrl: "/" })}
              >
                Sign out
              </button>
            </div>
          </section>
        </main>
      );
    }
    return (
      <main className="profile-onboarding" aria-live="polite">
        <div className="profile-loading">
          <span className="loading-mark">w.</span>
          <p>
            {isConvexAuthLoading
              ? "Connecting your secure session…"
              : "Preparing your private profile…"}
          </p>
        </div>
      </main>
    );
  }

  const nicknameValue = nickname ?? profile?.nickname ?? "";
  const selectedAvatarColor = avatarColor ?? profile?.avatarColor ?? "sky";
  const selectedColor = avatarColors.find(
    (color) => color.id === selectedAvatarColor,
  )!;

  return (
    <main className="profile-onboarding">
      <Link className="onboarding-brand" href="/" aria-label="Whisper home">
        <span className="brand-mark" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>
          whisper<span className="brand-period">.</span>
        </span>
      </Link>
      <section className="profile-setup-card" aria-labelledby="profile-title">
        <div className="onboarding-eyebrow">
          <span /> YOUR PUBLIC, ANONYMOUS PROFILE
        </div>
        <h1 id="profile-title">Choose how the world sees you.</h1>
        <p className="profile-intro">
          Pick a nickname and a colour. These are the only details people will
          see beside your posts.
        </p>

        <div className="profile-preview" aria-live="polite">
          <span
            className="profile-avatar"
            style={{ backgroundColor: selectedColor.value }}
          >
            {nicknameValue.trim().charAt(0).toUpperCase() || "?"}
          </span>
          <span className="preview-copy">
            <span className="preview-label">YOUR PROFILE PREVIEW</span>
            <strong>
              {nicknameValue.trim()
                ? `@${nicknameValue.trim()}`
                : "@your_nickname"}
            </strong>
          </span>
          <span className="anonymous-badge">
            <span /> ANONYMOUS
          </span>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <label htmlFor="nickname">Your nickname</label>
          <input
            id="nickname"
            name="nickname"
            value={nicknameValue}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="e.g. quietobserver"
            minLength={3}
            maxLength={20}
            pattern="[A-Za-z0-9_]{3,20}"
            autoComplete="off"
            required
          />
          <span className="profile-help">
            3–20 characters · letters, numbers, and underscores
          </span>

          <fieldset className="color-fieldset">
            <legend>Avatar colour</legend>
            <div className="color-options">
              {avatarColors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  className={`color-choice${selectedAvatarColor === color.id ? " selected" : ""}`}
                  style={{ "--swatch": color.value } as CSSProperties}
                  aria-label={color.label}
                  aria-pressed={selectedAvatarColor === color.id}
                  onClick={() => setAvatarColor(color.id)}
                >
                  <span />
                </button>
              ))}
              <span className="selected-color-label">
                {selectedColor.label}
              </span>
            </div>
          </fieldset>

          {error && (
            <p className="profile-error" role="alert">
              {error}
            </p>
          )}
          <button className="profile-save" type="submit" disabled={isSaving}>
            {isSaving ? "Saving your profile…" : "Finish setting up"}
            <span aria-hidden="true">→</span>
          </button>
        </form>
        <p className="profile-privacy">
          <span aria-hidden="true">◇</span> Your real name and email are never
          shown on your profile.
        </p>
      </section>
      <span className="onboarding-footer">A little less alone.</span>
    </main>
  );
}
