import { StrategyDetailClient } from "@/app/strategies/[strategyKey]/_components/strategy-detail-client";

interface PageProps {
  params: Promise<{ strategyKey: string }>;
}

export default async function StrategyDetailPage({ params }: PageProps) {
  const { strategyKey } = await params;
  return <StrategyDetailClient strategyKey={strategyKey} />;
}
