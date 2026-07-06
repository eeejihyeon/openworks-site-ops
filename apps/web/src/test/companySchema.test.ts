import { describe, expect, it } from "vitest";

import { companySchema } from "@/features/companies/schema";

describe("companySchema", () => {
  it("올바른 값은 통과한다", () => {
    const result = companySchema.safeParse({
      name: "한빛건설",
      contactName: "정태호",
      contactPhone: "010-2345-6789",
      contactEmail: "taeho.jung@hanbit-const.co.kr",
      address: "경기도 화성시",
      note: "",
      active: true,
    });
    expect(result.success).toBe(true);
  });

  it("이메일 형식이 아니면 실패한다", () => {
    const result = companySchema.safeParse({
      name: "한빛건설",
      contactName: "정태호",
      contactPhone: "010-2345-6789",
      contactEmail: "not-an-email",
      address: "경기도 화성시",
      note: "",
      active: true,
    });
    expect(result.success).toBe(false);
  });
});
