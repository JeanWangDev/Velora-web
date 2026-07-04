import { OrderPayClient } from "@/app/orders/[orderNo]/pay/_components/order-pay-client";

interface PageProps {
  params: Promise<{ orderNo: string }>;
}

export default async function OrderPayPage({ params }: PageProps) {
  const { orderNo } = await params;
  return <OrderPayClient orderNo={orderNo} />;
}
