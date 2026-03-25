export default function AboutUs() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-start gap-8 py-32 px-16 bg-white dark:bg-black">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
          About Project Moonlight
        </h1>
        <div className="flex flex-col gap-4 text-lg text-zinc-600 dark:text-zinc-400">
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
