import { useEffect, useRef } from "react";

/**
 * 실시간(SSE) 연동 훅.
 * 실서버에서는 `/api/stream/xxx` 엔드포인트가 text/event-stream 을 내려주면
 * 그대로 EventSource 로 구독한다. 백엔드가 아직 없는 개발 단계에서는
 * onMockTick 콜백으로 주기적 더미 이벤트를 흘려보내 화면을 검증할 수 있다.
 */
export function useServerSentEvents<T>(
  path: string,
  onMessage: (data: T) => void,
  options?: { enabled?: boolean; mock?: { intervalMs: number; generate: () => T } }
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (options?.enabled === false) return;

    if (options?.mock) {
      const timer = setInterval(() => {
        onMessageRef.current(options.mock!.generate());
      }, options.mock.intervalMs);
      return () => clearInterval(timer);
    }

    const source = new EventSource(`/api${path}`);
    source.onmessage = (event) => {
      try {
        onMessageRef.current(JSON.parse(event.data) as T);
      } catch {
        // ignore malformed events
      }
    };
    return () => source.close();
  }, [path, options?.enabled, options?.mock]);
}
