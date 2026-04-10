import { Chamber } from "@/widgets/Chamber/Chamber";

export default function Home() {
  return (
    /*
     * Root container: full viewport height, column flex.
     * On mobile, `dvh` units ensure the layout responds to the browser chrome
     * (address bar appearing/disappearing) correctly.
     */
    <div className="flex h-dvh max-w-xl flex-col">
      <Chamber />
    </div>
  );
}
