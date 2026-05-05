import { getRequestKey } from "@/lib/getRequestKey";
import { qaRatelimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

const QA_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
        thoughtSignature: string;
      }[];
      role: string;
    };
    finishReason: string;
    index: number;
  }[];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
    promptTokensDetails: {
      modality: string;
      tokenCount: number;
    }[];
    thoughtsTokenCount: number;
  };
  modelVersion: string;
  responseId: string;
}

export interface QAApiResponse {
  answers: string[];
}

// todo: stream response from Gemini API and forward to client
//  in real-time instead of waiting for the whole answer to be generated. This will require some changes on the client side as well to handle streaming responses.
export async function POST(request: NextRequest) {
  const key = await getRequestKey(request);
  const { success, limit, remaining, reset } = await qaRatelimit.limit(key);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      },
    );
  }

  const { question } = await request.json();

  const response = await fetch(QA_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-goog-api-key": process.env.GEMINI_API_KEY!,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: question,
            },
          ],
        },
      ],
    }),
  });

  const data: GeminiResponse = await response.json();
  return NextResponse.json({
    answers: data.candidates.map((candidate) =>
      candidate.content.parts.map((part) => part.text).join("\n"),
    ),
  });
}

/**
 * 
 * {
    "candidates": [
        {
            "content": {
                "parts": [
                    {
                        "text": "Both `useState` and Jotai’s `useAtom` are used to manage state in React, but they operate at different levels of the \"state management\" spectrum. \n\nHere is a detailed comparison to help you decide which to use.\n\n---\n\n### 1. The Core Difference\n\n*   **`useState` (Local State):** State is tied directly to the **component instance**. If you move the component or it unmounts, the state is gone. To share it, you must use \"lifting state up\" (props) or React Context.\n*   **`useAtom` (Atomic/Global State):** State is stored in an **\"atom\"** (a small piece of state) that lives outside the component tree. Components \"subscribe\" to these atoms. This allows state to be shared across distant components without prop drilling or the re-render issues of Context.\n\n---\n\n### 2. Comparison Table\n\n| Feature | `useState` | Jotai (`useAtom`) |\n| :--- | :--- | :--- |\n| **Scope** | Local to the component. | Global (or scoped to a `Provider`). |\n| **Sharing State** | Prop drilling or Context API. | Import the atom and use it anywhere. |\n| **Re-renders** | Re-renders the component and its children. | Only re-renders components subscribed to that specific atom. |\n| **Boilerplate** | Zero (Built-in). | Minimal (Define an atom in a separate file). |\n| **Derived State** | Manual (use `useMemo`). | Built-in via \"Derived Atoms.\" |\n| **Persistence** | Lost on unmount (unless lifted). | Can persist outside the lifecycle; easy to sync with `localStorage`. |\n\n---\n\n### 3. When to use `useState`\n\n`useState` should be your **default** choice for any state that doesn't need to be accessed by other parts of the application.\n\n*   **UI-only state:** Is a dropdown open? Is a mobile menu expanded?\n*   **Form inputs:** Temporary data typed into a specific form that doesn't need to be shared until submitted.\n*   **Component-specific logic:** A counter or a toggle that only affects one visual element.\n*   **Prototyping:** It requires no external libraries and zero setup.\n\n**Example:**\n```javascript\nconst ExpandableCard = () => {\n  const [isExpanded, setIsExpanded] = useState(false);\n  return <div onClick={() => setIsExpanded(!isExpanded)}>...</div>;\n};\n```\n\n---\n\n### 4. When to use Jotai (`useAtom`)\n\nJotai is ideal when your state management becomes complex or when you face performance bottlenecks with React Context.\n\n*   **Global App State:** User authentication status, theme settings (dark/light mode), or language preferences.\n*   **Cross-component communication:** When Component A (in the Header) needs to update Component B (in the Footer) without passing props through 10 levels of components.\n*   **Derived State:** When you have a piece of state that depends on another (e.g., a `filteredList` atom that automatically updates whenever the `searchQuery` atom changes).\n*   **Performance Optimization:** If you use React Context and notice that the entire app re-renders whenever one small value changes, Jotai solves this by only updating the specific components that use the specific atom.\n*   **State outside React:** If you need to read/write state from outside a React component (e.g., in a utility function or a websocket listener).\n\n**Example:**\n```javascript\n// atoms.js\nimport { atom } from 'jotai';\nexport const countAtom = atom(0);\n\n// ComponentA.js\nconst [count, setCount] = useAtom(countAtom);\n```\n\n---\n\n### 5. Summary: Which one should you pick?\n\n#### Choose `useState` if:\n1. The state is **private** to the component.\n2. The state is **simple** and doesn't trigger complex side effects.\n3. You want to keep your bundle size as small as possible (no extra libraries).\n\n#### Choose Jotai (`useAtom`) if:\n1. You find yourself **\"Prop Drilling\"** (passing data through components that don't use it).\n2. You need to share state between **siblings** or distant branches of the tree.\n3. You want to avoid the **\"Provider Hell\"** of React Context (where wrapping your app in 10 different Providers becomes messy).\n4. You need **Derived State** (computed values that update automatically).\n\n**Pro Tip:** You don't have to choose just one. Most professional React apps use `useState` for 80% of UI logic and a tool like Jotai (or Zustand/Redux) for the 20% of truly \"global\" data.",
                        "thoughtSignature": "EskPCsYPAb4+9vv8WkyThUV+ryllSZ7hRXpRTeBsolLeeOhqRV7vtJY2sKRGsZ7ADqxTzRRMKGx4BCZfoPNxm3NOKsjSTMYLtWLPboqwiBT5JWAoICGzSHxu5jOdmL5lKUh9z0HELI+C7voDF25DWIg4ViniTh8Eu4ZanHQYY68E80OZvBH5dzvPdLmAe8sdVEC0volds+2VKJFfL6i8dEmiNXZstEeXgcaQxJBqJ7DzCgQplhG7tj2H2IzK+G+EFmhC200ihAnEMT0Mndaxe2mguwAvqYYWFUFMZk5mIAgsQpDDxaFNwaUrwsXYPUCEEQ8fYNi6v+sswDFquvnkd/RRHel6JWqUMmmBxVsXhxdD/yp0Y4a+REnFFzXHOxJmUT4H0FIqeRIQvKISOic955qa7MHiKq9ckAMVcDlTGd0iuIv0q4Dzw6MhcRyH5EV+eZq5wmnySJOdr/qSVal2cwUoj8ItggrdH/i/N/SHnx8JkMohVsM3gyVCmJv5hmldRaB+75T/gXB6rMlGDKTK0sRALa9zBI2nsjMCN9x+pPOW3Dpl8maf2KsdHO51zwz1nXZhxxbrYyKjb3Vzo1pdIv83Obgl2ZuYSWMj9XI2Z/kS45IYozku2qXF1T/bPC1bYW5gnX/d6hMpe4EppTSUoqmtds4Sws9oUNErUz8zqfRRLOtcErHaKjuhnJLstyxNNQ24S0peB1dRpsG/ub8qqQRR6J7Shf0YIQTyW/bDXdtNuTg4Buo91gnd/Xda36I9ag1zDhPFANfX9FDMT6o5m66eccCBhycPjcvAxvqwPOhpQdiSM3Eo/Yutz02rxdMFsbBWGqEROlfroThg2SEAx1NNQcYYnbJ4eP4B0u+7cYEoLrDfK5sILHFncTBwY/TXTYJb8MgS7uR6V42byMzvpnnCyMdIXVFrcbuQZFJOtspf1Wzds9VckW2d40w0MgP7Ax1MjSieEwRD5jWr9jKr4AaBjpBhQ0mDhpIxiRhWMCOPHVdAf0EnFMnK4rYJ2ftbAe2WnoVeNvawg3e2AyQOaZCzvw0x0wn6zwa4PF7KG0K+pQMUmCJ03FbI5778/nQr/pHMkaFO+mY2V8ryKaV3FOIiSg0B+DiPwWQbAykjqrwLwJrnzV4SH+b1BvnQMw6nYQWW1A51RPYEVK8WnER+0whNAPWTmvIj1LwIDTpK7xevRc+PuUXZlWkozatcB1NugV4yO1QIfR7sVvabemrwUTgDCn2Z9ZHXZF0cLG0JJ2wgsaXbt3uPG5RfOjTHyhAZAXQwrjOO0IxwWNQCj/1seqM/24+eY3Cei7NHjyNx1p81NDUo4nu++DfPh+N8Aad4PARPS059w+wkw8GfZ2PhYxzDlP7El5nNkc8NGBGJpNKHwUXR2PCNEnAkak+aKq+gRQZC4IsIwYR3PN5xzAZD54ycrNxqWDXpNoya8DFi9q2TEbNcmpx+ul2BROp70kjAdyJk7im3ukILlYhLKQGnjUh7kBRTmXLUI78bezGKLFEfBf5fX1/KVxu3qGvroW1q64Dv14W/LyohaMaew/CyQxFlig6hxdpMUZl+teVRdbHScz0fmmmbfc9v9+fNUM79cjfrLmdPT4Beurk/sBx89ewSjs+1Av+6/fuqQuLG4WFa84/S7U7WWYrrpybHnFGXkAhUaWWsYeslBTxHPDyl9UQMOeqWPPHQ2T/1XWTU22LaoKpObYY2pFnpwrNebyhGoMlAZz4jDCtIOgPhGutODKRxFShREPU6//HdwSu+yj7m5G7NFacV9F/30Bh0h4POdAQ7BwwDMDlC9w3HjbcWRbmQhV/FNB4hw7+3DiijYBrDAM6XlEK6HOwTIyJ9ebemjnTBWvbS7aYvC0SzK/x4DZhhnf127+GrALIQ6Btg6kpyjdbimbRgzQPUMRdN30NCUG3F4VlgL9h5UOuTuRZ9dYL1CUchu1ffSUuFfe7XiF1xRu9SqTNNCbzF1Jb2CHS6FkvftTpmtUbkMeuntDUz62YCQEKeEROeWLz4plUoDikrftiSAs2+8ZhX94mAy2aosKCwqfkzwsScJoR+DubvmrlhEYI65MyqgmhhzS15IaoZNaLtGO/59U7bTPWP905KUcVtVM068kJFbKFzXINxEctP50pSnKGiuJYhmIPXrPAKSUPqc/aomDk+Liz2bNQH0c5A1gc51/gPaOXtMK4s3/6R4wTkw5GetTlQST2VCRYBB1JkfxWDBMdwd4Dzl08m16mnR4d2O7vgF+ZrBTZ/3PxbTsQBXiuJWLK+CTttKRhvILMY7yM386Om7mr9T/bnQVEGqjUJ4iZ4MRN6ybQ64tcOjK6I2VCkCTaJvA4AhfXbPg7lAkXwg+254KHIOkfwVE6PRhQPjK/o8a1zdYE3+ui8sytpPQ93gI8jM4wIszt+GQeBbEL3xCbS8yfatJygl/sBAeWkAoroVblH329GofaaeToBa+udI6cjEVRG3wOgH8fbtdRCCtZXzFzcAi3cqwoDX3dmWhkiZ0VtpobmVkwUqvXJiw+tYqYPntYAfna42SLVx3pVQiB41VzS+AbLDKuVAjJPjPJ5jQx1aRfN24mumMXm9cJU+5vxNA9fqhKS2A9eynuP6BibJWkQJNgMa3ix/smMmHopG5kBxahW/xhacz4kJ7vvutoMdQ=="
                    }
                ],
                "role": "model"
            },
            "finishReason": "STOP",
            "index": 0
        }
    ],
    "usageMetadata": {
        "promptTokenCount": 13,
        "candidatesTokenCount": 1056,
        "totalTokenCount": 1577,
        "promptTokensDetails": [
            {
                "modality": "TEXT",
                "tokenCount": 13
            }
        ],
        "thoughtsTokenCount": 508
    },
    "modelVersion": "gemini-3-flash-preview",
    "responseId": "wIHgaZS2OteL4-EPkYvD8A8"
}
 */
