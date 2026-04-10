import { WithClassName } from "@/types/withClassName";
import { PropsWithChildren } from "react";
import { clsx } from "clsx";

export function Page(props: PropsWithChildren & WithClassName) {
  /*
   * Root container: full viewport height, column flex.
   * On mobile, `dvh` units ensure the layout responds to the browser chrome
   * (address bar appearing/disappearing) correctly.
   */
  return (
    <div
      className={clsx(
        "mx-auto flex h-dvh w-full max-w-xl flex-col",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}
