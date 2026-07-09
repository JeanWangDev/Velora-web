"use client";

import {
  ArrowDownToLine,
  ArrowLeftRight,
  ChevronRight,
  HandCoins,
  Wallet,
} from "lucide-react";
import { AppModal } from "@/components/ui/app-modal";
import { useExchangeT } from "@/hooks/use-exchange-t";
import { toast } from "@/services/toast";

interface DepositMethodModalProps {
  open: boolean;
  onClose: () => void;
}

const methods = [
  {
    key: "transfer",
    icon: ArrowLeftRight,
    titleKey: "trade.transferFunds" as const,
    descKey: "trade.transferFundsDesc" as const,
  },
  {
    key: "deposit",
    icon: ArrowDownToLine,
    titleKey: "trade.depositCrypto" as const,
    descKey: "trade.depositCryptoDesc" as const,
  },
  {
    key: "quickBuy",
    icon: HandCoins,
    titleKey: "trade.quickBuy" as const,
    descKey: "trade.quickBuyDesc" as const,
  },
  {
    key: "redeemEarn",
    icon: Wallet,
    titleKey: "trade.redeemEarn" as const,
    descKey: "trade.redeemEarnDesc" as const,
  },
] as const;

export function DepositMethodModal({ open, onClose }: DepositMethodModalProps) {
  const t = useExchangeT();

  const onSelect = (key: (typeof methods)[number]["key"]) => {
    onClose();
    if (key === "deposit") {
      toast.info(t("assets.depositContactAdmin"));
      return;
    }
    toast.info(t("common.comingSoon"));
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t("trade.depositMethodTitle")}
      panelClassName="max-w-[420px]"
    >
      <ul className="space-y-1">
        {methods.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onSelect(item.key)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-surface-muted"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted">
                  <Icon className="h-4 w-4 text-foreground" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {t(item.titleKey)}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {t(item.descKey)}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
              </button>
            </li>
          );
        })}
      </ul>
    </AppModal>
  );
}
