import {
  Button,
  Card,
  FormField,
  PageDescription,
  PageHeader,
  PageTitle,
  Row,
  Select,
  Stack,
  Textarea,
  Input,
} from "@facility/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { useSites } from "@/features/sites/queries";
import { useUiStore } from "@/store/uiStore";

import { useSaveSystemInfo, useSystemInfo } from "../queries";
import { developerTypeOptions, systemInfoDefaultValues, systemInfoSchema } from "../schema";
import type { SystemInfoFormValues } from "../schema";

export default function SystemInfoPage() {
  const { data: sites = [] } = useSites();
  const activeSiteId = useUiStore((s) => s.activeSiteId);
  const setActiveSiteId = useUiStore((s) => s.setActiveSiteId);

  const site = sites.find((s) => s.id === activeSiteId) ?? null;
  const { data } = useSystemInfo(activeSiteId);
  const saveInfo = useSaveSystemInfo(activeSiteId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SystemInfoFormValues>({
    resolver: zodResolver(systemInfoSchema),
    defaultValues: systemInfoDefaultValues,
  });

  useEffect(() => {
    if (data) {
      reset({
        operationInfo: data.operationInfo,
        developerType: data.developerType,
        developerName: data.developerName,
      });
    }
  }, [data, reset]);

  const onSubmit = (values: SystemInfoFormValues) => saveInfo.mutate(values);

  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>시스템 관리</PageTitle>
          <PageDescription>현장 시스템의 운영 정보와 개발사 구분을 관리합니다.</PageDescription>
        </div>
      </PageHeader>

      <Stack gap="lg">
        <Card>
          <FormField label="현장 선택">
            <Select
              value={activeSiteId ?? ""}
              onChange={(e) => setActiveSiteId(e.target.value || null)}
            >
              <option value="">현장을 선택하세요</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormField>
        </Card>

        {!site && <Card>좌측에서 현장을 선택하면 시스템 정보를 관리할 수 있습니다.</Card>}

        {site && (
          <Card>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack gap="lg">
                <FormField
                  label="시스템 운영 정보"
                  required
                  error={errors.operationInfo?.message}
                  hint="관제 서버 운영 방식, 모니터링 체계 등을 기록합니다"
                >
                  <Textarea {...register("operationInfo")} rows={4} />
                </FormField>

                <Row gap="md">
                  <div style={{ flex: 1 }}>
                    <FormField label="개발사 구분" required error={errors.developerType?.message}>
                      <Select {...register("developerType")}>
                        {developerTypeOptions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>
                  <div style={{ flex: 1 }}>
                    <FormField label="개발사/담당팀명" required error={errors.developerName?.message}>
                      <Input {...register("developerName")} placeholder="예: 기술지원팀" />
                    </FormField>
                  </div>
                </Row>

                <Row style={{ justifyContent: "flex-end" }}>
                  <Button type="submit" disabled={saveInfo.isPending}>
                    저장
                  </Button>
                </Row>
              </Stack>
            </form>
          </Card>
        )}
      </Stack>
    </div>
  );
}
