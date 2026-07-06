import type { Preview } from "@storybook/react-vite";

import { GlobalStyle } from "../src/GlobalStyle";

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    backgrounds: {
      default: "app-bg",
      values: [{ name: "app-bg", value: "#F0F5FF" }],
    },
  },
  decorators: [
    (Story) => (
      <>
        <GlobalStyle />
        <div style={{ padding: 24 }}>
          <Story />
        </div>
      </>
    ),
  ],
};

export default preview;
