export default function AboutUs() {
  return (
    <div className="bg-surface flex flex-1 flex-col items-center justify-center p-8 font-sans">
      <main className="bg-surface-elevated flex w-full max-w-3xl flex-1 flex-col items-start gap-8 px-16 py-32">
        <h1 className="text-foreground text-4xl font-bold tracking-tight">
          About Project Moonlight
        </h1>
        <div className="text-muted flex flex-col gap-4 text-lg">
          <p>
            Welcome to Project Moonlight. Our mission is to transform how you
            learn and retain knowledge.
          </p>
          <p>Learn in Day, Review in Night.</p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </div>
      </main>
    </div>
  );
}
