import { OrderDetailClient } from "@/app/orders/[orderNo]/_components/order-detail-client";

interface PageProps {
  params: Promise<{ orderNo: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderNo } = await params;
  return <OrderDetailClient orderNo={orderNo} />;
}
