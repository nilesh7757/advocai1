const AuthBackground = () => (
  <>
    {/* Video background — muted, desaturated, dimmed loop */}
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover pointer-events-none grayscale opacity-[0.15] hidden sm:block"
      src="/signing video.mp4"
    />

    {/* Dot-grid fallback (visible while video loads, and always on mobile) */}
    <div
      className="absolute inset-0 pointer-events-none opacity-40"
      style={{
        backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    />
  </>
);

export default AuthBackground;
