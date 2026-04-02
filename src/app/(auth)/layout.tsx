export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="surface overflow-hidden p-8 sm:p-10">
          <div className="flex h-full flex-col justify-between gap-10">
            <div className="space-y-4">
              <p className="section-label">SiraTrack</p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                A private discipline dashboard for hard, honest daily work.
              </h1>
              <p className="max-w-xl text-base leading-7 text-white/60">
                Measure the day, protect the streak, and keep the standard visible.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="section-label">Measure</p>
                <p className="mt-3 text-sm text-white/70">
                  Deep work, coding, learning, training, and prayer.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="section-label">Confront</p>
                <p className="mt-3 text-sm text-white/70">
                  Daily score, strict feedback, and visible streak loss.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="section-label">Repeat</p>
                <p className="mt-3 text-sm text-white/70">
                  No noise. No audience. Just execution and review.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="surface p-8 sm:p-10">{children}</section>
      </div>
    </div>
  );
}
