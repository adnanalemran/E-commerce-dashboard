import { PageMeta } from "@/components/shared/page-meta";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n";
import { getApiErrorMessage } from "@/utils/form-errors";
import { hasAnyRole, STAFF_ROLES } from "@/utils/roles";
import { useAuth } from "@/contexts";
import { useOrderStats } from "../../orders/use-orders";
import KpiCards from "./components/kpi-cards";
import LowStock from "./components/low-stock";
import RecentOrders from "./components/recent-orders";
import SalesChart from "./components/sales-chart";
import TopProducts from "./components/top-products";

export default function EcommercePage() {
  const t = useTranslations("ecommerce");
  const { user } = useAuth();
  const isStaff = hasAnyRole(user?.roles ?? [], STAFF_ROLES);

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("description")} />
      {isStaff ? <StoreOverview /> : <p className="surface-card p-6 text-sm text-label-secondary">{t("welcome", { name: user?.name ?? "" })}</p>}
    </>
  );
}

function StoreOverview() {
  const t = useTranslations("ecommerce");
  const stats = useOrderStats();

  if (stats.error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{getApiErrorMessage(stats.error, { network: t("errors.network"), unexpected: t("errors.unexpected") })}</AlertTitle>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => void stats.refetch()}>
          {t("errors.retry")}
        </Button>
      </Alert>
    );
  }

  const data = stats.data;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title-lg font-semibold text-label">{t("title")}</h1>
        <p className="text-sm text-label-secondary">{t("description")}</p>
      </div>
      <KpiCards stats={data} />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <SalesChart days={data?.last30Days} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <TopProducts items={data?.topProducts} />
        </div>
        <div className="col-span-12 xl:col-span-8">
          <RecentOrders />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <LowStock lowStock={data?.lowStock} />
        </div>
      </div>
    </div>
  );
}
