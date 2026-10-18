export function whatsappHref(number: string, message?: string) {
  const base = `https://wa.me/${number.replace(/\D/g, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const WA_MESSAGES = {
  general: "Hi Pantry LK, I would like to ask about a kitchen.",
  planning: "Hi Pantry LK, I would like help planning my kitchen.",
  similarProject: (title: string) =>
    `Hi Pantry LK, I saw the "${title}" project on your website and would like something similar.`,
  product: (name: string, finish?: string) =>
    `Hi Pantry LK, I'm interested in the ${name}${finish ? ` (${finish} finish)` : ""}. Could you share options and a quotation for my kitchen?`,
};
