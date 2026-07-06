import { Button } from "@facility/ui";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("Button", () => {
  it("클릭 이벤트를 전달한다", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>저장</Button>);

    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled 상태에서는 클릭이 무시된다", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        저장
      </Button>
    );

    await userEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
