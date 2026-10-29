// Re-mounts on every navigation, so each page fades in softly (pure CSS, works before JS loads).
export default function Template({ children }) {
  return <div className="animate-page-in">{children}</div>;
}
