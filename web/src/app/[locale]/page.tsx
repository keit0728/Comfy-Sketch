import { setRequestLocale } from "next-intl/server";
import ViewClientOnly from "./view-client-only";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ViewClientOnly />;
}
