/**
 * Your own photograph: add it, replace it, remove it.
 *
 * The file is stored privately and only ever linked through short-lived links,
 * so nothing sits on a guessable public address. Only a real photograph of a
 * real person belongs here — there are no generated faces anywhere in this app.
 */

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PersonAvatar } from "./person-avatar";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function ProfilePhoto({
  userId,
  displayName,
  path,
  onChange,
}: {
  userId: string;
  displayName: string;
  /** What is stored on the profile: a storage path, or nothing yet. */
  path: string | null;
  onChange: (next: string | null) => Promise<void> | void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    if (!path) {
      setPreview(null);
      return;
    }
    if (path.startsWith("http")) {
      setPreview(path);
      return;
    }
    void supabase.storage
      .from("profile-photos")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (alive) setPreview(data?.signedUrl ?? null);
      });
    return () => {
      alive = false;
    };
  }, [path]);

  const pick = async (file: File) => {
    setProblem(null);
    if (!ALLOWED.includes(file.type)) {
      setProblem("That file type isn't supported. A JPEG, PNG or WebP photograph works.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setProblem("That photograph is over 2MB. A smaller one will do.");
      return;
    }
    setBusy(true);
    const extension =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const next = `${userId}/photo-${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from("profile-photos")
      .upload(next, file, { upsert: true, contentType: file.type });
    if (error) {
      setBusy(false);
      setProblem("The photograph didn't upload. Try again in a moment.");
      return;
    }
    if (path && !path.startsWith("http")) {
      await supabase.storage.from("profile-photos").remove([path]);
    }
    await onChange(next);
    setBusy(false);
  };

  const remove = async () => {
    setBusy(true);
    if (path && !path.startsWith("http")) {
      await supabase.storage.from("profile-photos").remove([path]);
    }
    await onChange(null);
    setPreview(null);
    setBusy(false);
  };

  return (
    <div className="flex items-start gap-4">
      <PersonAvatar name={displayName || "You"} photoUrl={preview} size={72} />
      <div className="text-sm">
        <input
          ref={input}
          type="file"
          accept={ALLOWED.join(",")}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void pick(file);
            event.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="focus-ink rounded-full border border-border bg-card px-4 py-2 text-sm disabled:opacity-60"
          >
            {path ? "Replace photograph" : "Add a photograph"}
          </button>
          {path ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove()}
              className="focus-ink rounded-full border border-border bg-card px-4 py-2 text-sm disabled:opacity-60"
            >
              Remove
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          A real photograph of you, if you have one. An empty space is better than an invented face,
          so there are none here.
        </p>
        {problem ? <p className="mt-2 text-xs text-destructive">{problem}</p> : null}
      </div>
    </div>
  );
}
