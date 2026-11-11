import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { useTranslations } from "@/i18n";
import CategoryManager from "../shared/category-manager";

export default function SubcategoriesPage() {
  const t = useTranslations("catalog.subcategories");

  return (
    <>
      <PageMeta title={t("metaTitle")} description={t("description")} />
      <PageBreadcrumb pageTitle={t("title")} />
      <CategoryManager level="sub" />
    </>
  );
}
