import type { Meta, StoryObj } from "@storybook/react-vite";

import { ActivePill, CodeTag, StatusPill } from "../components/StatusPill";

const meta: Meta = {
  title: "Facility DS/Status & Tags",
};
export default meta;

export const SiteStatusPills: StoryObj = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <StatusPill status="계약전" />
      <StatusPill status="구축중" />
      <StatusPill status="운영중" />
      <StatusPill status="종료" />
    </div>
  ),
};

export const Active: StoryObj = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <ActivePill active={true} />
      <ActivePill active={false} />
    </div>
  ),
};

export const EquipmentCodeTag: StoryObj = {
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      <CodeTag>CCTV-IPC-200</CodeTag>
      <CodeTag>OUT-2026-0001</CodeTag>
    </div>
  ),
};
