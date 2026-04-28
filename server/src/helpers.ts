/* eslint no-useless-escape: 0 */
export const toPriceFormat = (price: string | undefined | null) => {
  if (!price) return;

  if (typeof price === "string") {
    price = price.replace(/[^\d\.\,]/g, "");

    price = /^(\d+\.?){1}(\.\d{2,3})*\,\d{1,2}$/.test(price)
      ? price.replace(/\./g, "").replace(",", ".")
      : price.replace(/,/g, "");
  }

  const num = parseFloat(price as string);

  if (Number.isNaN(num)) {
    return;
  }

  return +num.toFixed(2);
};

export const getHostname = (url: string) => {
  return new URL(url).hostname.replace("www.", "");
};
