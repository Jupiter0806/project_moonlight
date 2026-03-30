"use client";

import { useState } from "react";
import { BeingLazy } from "./components/BeingLazy/DynamicWrapper";

// const BeingLazy = lazy(() => import("./components/BeingLazy/BeingLazy"));

export function LazyLoad() {
  const [showLazy, setShowLazy] = useState(false);

  return (
    <div>
      <button onClick={() => setShowLazy(true)}>Load Lazy Component</button>

      {showLazy && <BeingLazy />}
    </div>
  );
}
