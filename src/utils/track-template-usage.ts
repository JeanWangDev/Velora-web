import { ChartTemplateService } from "@/services/chart-template-service";
import type { ChartTemplate } from "@/types/chart-template";

/** 静默上报公开模版使用（失败不影响主流程） */
export function trackTemplateUsage(
  template: Pick<ChartTemplate, "id" | "visibility">,
  event: "apply" | "copy",
) {
  if (template.visibility !== "public") {
    return;
  }

  void ChartTemplateService.track(template.id, event).catch(() => {
    // ignore
  });
}
