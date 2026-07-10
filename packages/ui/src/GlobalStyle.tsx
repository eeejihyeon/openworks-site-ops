import { Global, css } from "@emotion/react";

import { color, font, radius } from "./theme";

export function GlobalStyle() {
  return (
    <Global
      styles={css`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css");

        * {
          box-sizing: border-box;
          scrollbar-width: thin;
          scrollbar-color: ${color.border} transparent;
        }

        html,
        body,
        #root {
          height: 100%;
        }

        body {
          margin: 0;
          font-family: ${font.sans};
          background: ${color.bg};
          color: ${color.ink};
          font-size: 14px;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
        }

        code,
        kbd,
        .mono {
          font-family: ${font.mono};
        }

        a {
          color: inherit;
        }

        button {
          font-family: inherit;
        }

        :focus-visible {
          outline: 2px solid ${color.accent};
          outline-offset: 2px;
        }

        *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        *::-webkit-scrollbar-button {
          display: none;
          width: 0;
          height: 0;
        }

        *::-webkit-scrollbar-track {
          background: transparent;
        }

        *::-webkit-scrollbar-thumb {
          background: ${color.border};
          border-radius: ${radius.pill};
          border: 1px solid transparent;
          background-clip: padding-box;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: ${color.borderStrong};
          border: 1px solid transparent;
          background-clip: padding-box;
        }

        *::-webkit-scrollbar-corner {
          background: transparent;
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}
    />
  );
}
