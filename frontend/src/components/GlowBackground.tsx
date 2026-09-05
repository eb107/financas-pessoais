export function GlowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg">
      <div className="animate-float absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-accent-cyan/20 blur-[120px]" />
      <div className="animate-float-slow absolute top-1/3 -right-40 h-[36rem] w-[36rem] rounded-full bg-accent-violet/20 blur-[130px]" />
      <div className="animate-float absolute -bottom-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-accent-pink/10 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
