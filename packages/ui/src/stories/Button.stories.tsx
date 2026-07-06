import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../components/Button";

const meta: Meta<typeof Button> = {
  title: "Facility DS/Button",
  component: Button,
  args: { children: "저장" },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: "primary" } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Danger: Story = { args: { variant: "danger", children: "삭제" } };
export const Disabled: Story = { args: { variant: "primary", disabled: true } };
