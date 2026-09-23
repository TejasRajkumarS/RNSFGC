"use client";

/**
 * Serif display masthead — white over the hero scrim,
 * with an italic gold accent line for the word "College".
 */
export default function HeroTypography() {
  return (
    <h1
      className="anim-fade-up mt-5 select-none font-display font-semibold leading-[0.95] tracking-[-0.01em] text-white"
      style={{ animationDelay: "240ms" }}
    >
      <span className="block" style={{ fontSize: "clamp(3rem, 8.4vw, 7.25rem)" }}>
        RNS First Grade
      </span>
      <span className="block italic text-gold-light" style={{ fontSize: "clamp(3rem, 8.4vw, 7.25rem)" }}>
        College.
      </span>
    </h1>
  );
}
