import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { hasLocale } from "next-intl";

const PAGE_NAMES = ["home"];

const getMessages = async (locale: string) => {
  const promises = [import(`../../messages/${locale}/common.json`)];
  PAGE_NAMES.forEach((pageName) => {
    promises.push(import(`../../messages/${locale}/${pageName}.json`));
  });

  const [common, ...pages] = await Promise.all(promises);

  const pageMessages = PAGE_NAMES.reduce(
    (acc, pageName, index) => {
      acc[pageName] = pages[index].default;
      return acc;
    },
    {} as Record<string, unknown>,
  );

  return {
    common: common.default,
    ...pageMessages,
  };
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: await getMessages(locale),
  };
});
