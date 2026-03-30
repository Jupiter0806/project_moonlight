import dynamic from "next/dynamic";

export const BeingLazy = dynamic(() => import("./BeingLazy"), {
  loading: () => <div>Loading...</div>,
});
