/**
 * App Router remounts this template on every navigation, which gives us a
 * clean hook for page transitions without intercepting the router:
 *
 *  - `.anim-page-enter` fades/slides the new page in.
 *
 * The effect is pure CSS and is disabled under `prefers-reduced-motion`.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="anim-page-enter">{children}</div>;
}
