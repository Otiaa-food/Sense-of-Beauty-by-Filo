import { TZDate } from "@date-fns/tz";
import { brand } from "@/lib/brand.config";

/** Geburtstags-Kampagne: Einstellungen und Datumslogik (reine Funktionen, gut testbar) */

export type BirthdayCampaign = { enabled: boolean; channel: "email" | "sms" | "both"; gift: string; code: string; validDays: number };

export const defaultBirthdayCampaign: BirthdayCampaign = {
  enabled: false,
  channel: "email",
  gift: "10 % Rabatt auf deine nächste Behandlung",
  code: "",
  validDays: 30,
};

export function parseBirthdayCampaign(value: unknown): BirthdayCampaign {
  const v = (value ?? {}) as Partial<BirthdayCampaign>;
  return {
    enabled: v.enabled === true,
    channel: v.channel === "sms" || v.channel === "both" ? v.channel : "email",
    gift: typeof v.gift === "string" && v.gift.trim() ? v.gift.trim() : defaultBirthdayCampaign.gift,
    code: typeof v.code === "string" ? v.code.trim() : "",
    validDays: Number.isFinite(Number(v.validDays)) && Number(v.validDays) > 0 ? Math.min(365, Number(v.validDays)) : 30,
  };
}

/** Heute in Pforzheim: Tag, Monat, Jahr. Wer am 29.2. Geburtstag hat, bekommt in normalen Jahren am 28.2. Grüße. */
export function birthdayKeys(now: Date) {
  const d = TZDate.tz(brand.timezone, now.getTime());
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const leap = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1;
  const days = month === 2 && day === 28 && !leap ? [28, 29] : [day];
  return { days, month, year };
}

