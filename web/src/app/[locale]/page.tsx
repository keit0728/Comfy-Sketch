import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, t] = await Promise.all([params, getTranslations()]);
  setRequestLocale(locale);

  return <div className="">{t("home.title")}</div>;
}
