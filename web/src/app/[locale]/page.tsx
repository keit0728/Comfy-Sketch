import { setRequestLocale } from "next-intl/server";
import SketchApp from "@/components/sketch/SketchApp";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="w-full h-screen">
      <SketchApp />
    </div>
  );
}
