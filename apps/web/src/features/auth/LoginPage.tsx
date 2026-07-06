import styled from "@emotion/styled";
import { color, font, radius, shadow } from "@facility/ui";
import { useState } from "react";
import { useNavigate } from "react-router";

import { authApi } from "./api";
import { useAuthStore } from "@/store/authStore";

const Page = styled.div({
  minHeight: "100vh",
  background: color.ink,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
});

const Card = styled.div({
  background: "#ffffff",
  borderRadius: radius.lg,
  boxShadow: shadow.lg,
  padding: "40px 36px",
  width: "100%",
  maxWidth: 380,
});

const Brand = styled.div({
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 32,
});

const BrandMark = styled.div({
  width: 36,
  height: 36,
  borderRadius: 10,
  background: color.primary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

const BrandDot = styled.span({
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: color.accent,
  boxShadow: `0 0 0 3px rgba(59, 130, 246, 0.35)`,
  display: "block",
});

const BrandLabel = styled.span({
  fontSize: 15,
  fontWeight: 700,
  color: color.ink,
  letterSpacing: "-0.01em",
});

const Title = styled.h1({
  fontSize: 20,
  fontWeight: 700,
  color: color.ink,
  margin: "0 0 4px",
});

const Subtitle = styled.p({
  fontSize: 13,
  color: color.inkFaint,
  margin: "0 0 28px",
});

const Label = styled.label({
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: color.inkMuted,
  marginBottom: 6,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
});

const Input = styled.input({
  width: "100%",
  padding: "9px 12px",
  fontSize: 14,
  border: `1px solid ${color.border}`,
  borderRadius: radius.md,
  background: color.bg,
  color: color.ink,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: font.sans,
  transition: "border-color 140ms",
  "&:focus": {
    borderColor: color.accent,
    background: "#fff",
  },
  "&::placeholder": {
    color: color.inkFaint,
  },
});

const FieldGroup = styled.div({
  marginBottom: 16,
});

const SubmitBtn = styled.button<{ $loading?: boolean }>(({ $loading }) => ({
  width: "100%",
  padding: "10px",
  marginTop: 8,
  background: $loading ? color.inkFaint : color.primary,
  color: "#ffffff",
  border: "none",
  borderRadius: radius.md,
  fontSize: 14,
  fontWeight: 600,
  cursor: $loading ? "not-allowed" : "pointer",
  transition: "background 140ms",
  fontFamily: font.sans,
  "&:hover:not(:disabled)": {
    background: color.primaryHover,
  },
}));

const ErrorBox = styled.div({
  marginTop: 16,
  padding: "9px 12px",
  background: "#FEE2E2",
  border: "1px solid #FCA5A5",
  borderRadius: radius.md,
  fontSize: 13,
  color: "#B91C1C",
});

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await authApi.login(email, password);
      login(user, token);
      navigate("/", { replace: true });
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <Card>
        <Brand>
          <BrandMark>
            <BrandDot />
          </BrandMark>
          <BrandLabel>설비관제 · 자산관리</BrandLabel>
        </Brand>

        <Title>로그인</Title>
        <Subtitle>계정 정보를 입력하세요.</Subtitle>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@facility.co.kr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FieldGroup>

          <SubmitBtn type="submit" disabled={loading} $loading={loading}>
            {loading ? "확인 중..." : "로그인"}
          </SubmitBtn>
        </form>

        {error && <ErrorBox>{error}</ErrorBox>}
      </Card>
    </Page>
  );
}
