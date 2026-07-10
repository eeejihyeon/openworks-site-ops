import {
  Button,
  Card,
  FormField,
  Input,
  MonoCell,
  PageDescription,
  PageHeader,
  PageTitle,
  Row,
  Select,
  Stack,
  StatusPill,
  Textarea,
  color,
} from "@facility/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { useCompanies } from "@/features/companies/queries";
import { equipmentCategoryOptions } from "@/features/equipment/schema";
import { useSites } from "@/features/sites/queries";
import { useUiStore } from "@/store/uiStore";

import { useSaveSiteRequirements, useSiteRequirements } from "../queries";
import { siteRequirementFormSchema } from "../schema";
import type { SiteRequirementFormValues } from "../schema";

export default function RequirementsPage() {
  const { data: sites = [] } = useSites();
  const { data: companies = [] } = useCompanies();
  const activeSiteId = useUiStore((s) => s.activeSiteId);
  const setActiveSiteId = useUiStore((s) => s.setActiveSiteId);

  const site = sites.find((s) => s.id === activeSiteId) ?? null;
  const { data: doc } = useSiteRequirements(activeSiteId);
  const saveDoc = useSaveSiteRequirements(activeSiteId);

  const { control, register, handleSubmit, reset } = useForm<SiteRequirementFormValues>({
    resolver: zodResolver(siteRequirementFormSchema),
    defaultValues: { requirements: [], routes: [] },
  });

  useEffect(() => {
    if (doc) reset({ requirements: doc.requirements, routes: doc.routes });
  }, [doc, reset]);

  const requirementsArray = useFieldArray({ control, name: "requirements" });
  const routesArray = useFieldArray({ control, name: "routes" });

  const onSubmit = (values: SiteRequirementFormValues) => {
    saveDoc.mutate(values);
  };

  return (
    <div>
      <PageHeader>
        <div>
          <PageTitle>시스템 요구사항</PageTitle>
          <PageDescription>현장별 요구사항 명세와 노선 정보를 작성합니다.</PageDescription>
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

        {!site && <Card>좌측에서 현장을 선택하면 요구사항을 작성할 수 있습니다.</Card>}

        {site && (
          <>
            {/* 현장 정보 */}
            <Card>
              <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>현장 정보</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 13 }}>
                <div>
                  <div style={{ color: color.inkFaint, fontSize: 12 }}>현장명</div>
                  <div>{site.name}</div>
                </div>
                <div>
                  <div style={{ color: color.inkFaint, fontSize: 12 }}>건설사</div>
                  <div>{companies.find((c) => c.id === site.companyId)?.name ?? "-"}</div>
                </div>
                <div>
                  <div style={{ color: color.inkFaint, fontSize: 12 }}>현장 상태</div>
                  <StatusPill status={site.status} />
                </div>
                <div>
                  <div style={{ color: color.inkFaint, fontSize: 12 }}>현장 주소</div>
                  <div>{site.address}</div>
                </div>
                <div>
                  <div style={{ color: color.inkFaint, fontSize: 12 }}>현장 담당자</div>
                  <div>{site.siteManagers?.map((m) => m.name).join(", ")}</div>
                </div>
                <div>
                  <div style={{ color: color.inkFaint, fontSize: 12 }}>기간</div>
                  <MonoCell>
                    {site.startDate} ~ {site.endDateExpected}
                  </MonoCell>
                </div>
              </div>
            </Card>

            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack gap="lg">
                {/* 요구사항 명세 작성 */}
                <Card>
                  <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 14 }}>요구사항 명세</h3>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => requirementsArray.append({ title: "", detail: "" })}
                    >
                      + 요구사항 추가
                    </Button>
                  </Row>
                  <Stack gap="md">
                    {requirementsArray.fields.length === 0 && (
                      <p style={{ fontSize: 13, color: color.inkFaint }}>등록된 요구사항이 없습니다.</p>
                    )}
                    {requirementsArray.fields.map((field, index) => (
                      <Row key={field.id} gap="sm" style={{ alignItems: "flex-start" }}>
                        <div style={{ flex: "0 0 220px" }}>
                          <Input
                            placeholder="요구사항 제목"
                            {...register(`requirements.${index}.title`)}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <Textarea
                            placeholder="상세 내용"
                            {...register(`requirements.${index}.detail`)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => requirementsArray.remove(index)}
                        >
                          삭제
                        </Button>
                      </Row>
                    ))}
                  </Stack>
                </Card>

                {/* 노선 정보 입력 - row 추가 */}
                <Card>
                  <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 14 }}>노선 정보</h3>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        routesArray.append({
                          routeName: "",
                          location: "",
                          equipmentCategory: "",
                          note: "",
                        })
                      }
                    >
                      + 노선 행 추가
                    </Button>
                  </Row>
                  <Stack gap="sm">
                    {routesArray.fields.length === 0 && (
                      <p style={{ fontSize: 13, color: color.inkFaint }}>등록된 노선이 없습니다.</p>
                    )}
                    {routesArray.fields.map((field, index) => (
                      <Row key={field.id} gap="sm">
                        <div style={{ flex: "0 0 120px" }}>
                          <Input placeholder="노선명" {...register(`routes.${index}.routeName`)} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <Input
                            placeholder="위치/구간"
                            {...register(`routes.${index}.location`)}
                          />
                        </div>
                        <div style={{ flex: "0 0 140px" }}>
                          <Select {...register(`routes.${index}.equipmentCategory`)}>
                            <option value="">장비분류</option>
                            {equipmentCategoryOptions.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <Input placeholder="비고" {...register(`routes.${index}.note`)} />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => routesArray.remove(index)}
                        >
                          삭제
                        </Button>
                      </Row>
                    ))}
                  </Stack>
                </Card>

                <Row style={{ justifyContent: "flex-end" }}>
                  <Button type="submit" disabled={saveDoc.isPending}>
                    저장
                  </Button>
                </Row>
              </Stack>
            </form>
          </>
        )}
      </Stack>
    </div>
  );
}
