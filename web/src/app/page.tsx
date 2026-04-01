import { SignOutButton } from "@/widgets/SignOutButton/SignOutButton";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-surface flex flex-1 flex-col items-center justify-center font-sans">
      <main className="bg-surface-elevated flex w-full max-w-3xl flex-1 flex-col items-center justify-between px-16 py-32 sm:items-start">
        <Image
          className="dark:invert"
          src="/file.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="text-foreground max-w-xs text-3xl leading-10 font-semibold tracking-tight">
            To get started, edit the page.tsx file.
          </h1>
          <p className="text-muted max-w-md text-lg leading-8">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="text-foreground-strong font-medium"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="text-foreground-strong font-medium"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="bg-foreground text-background hover:bg-foreground-hover flex h-12 w-full items-center justify-center gap-2 rounded-full px-5 transition-colors md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="border-border hover:bg-surface-hover flex h-12 w-full items-center justify-center rounded-full border border-solid px-5 transition-colors hover:border-transparent md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
          <Link
            className="border-border hover:bg-surface-hover flex h-12 w-full items-center justify-center rounded-full border border-solid px-5 transition-colors hover:border-transparent md:w-[158px]"
            href="/about-us"
          >
            About Us
          </Link>
          <SignOutButton />
        </div>
      </main>
    </div>
  );
}
