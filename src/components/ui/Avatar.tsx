const SIZES = {
  sm: "h-9 w-9 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-20 w-20 text-3xl",
} as const;

interface AvatarProps {
  name: string;
  url: string | null;
  size?: keyof typeof SIZES;
  /** Shadow Amulet owners get a darker, glowing frame. */
  shadow?: boolean;
}

/**
 * User avatar. External images never receive the referrer and load lazily;
 * the initial is shown when there is no image.
 */
export function Avatar({ name, url, size = "md", shadow = false }: AvatarProps) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border font-display font-bold ${SIZES[size]} ${
        shadow
          ? "border-purple-500/60 bg-black text-purple-300 shadow-[0_0_18px_rgba(168,85,247,0.35)]"
          : "border-zinc-700 bg-zinc-900 text-ritual-accent"
      }`}
    >
      {url ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}
