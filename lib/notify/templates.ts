import { brand } from "@/lib/brand.config";

/**
 * Texte aller Nachrichten an EINER Stelle. Reine Funktionen (gut testbar, leicht anpassbar).
 * Jede E-Mail gibt es als HTML und als reinen Text (für einfache Mailprogramme und Spam-Filter).
 */

export type AppointmentInfo = {
  firstName: string;
  serviceName: string;
  start: Date;
  end: Date;
  price: number;
  manageUrl: string;
};

export type Message = { subject: string; text: string; html: string };

const tz = brand.timezone;
const fmtDay = (d: Date) =>
  new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz }).format(d);
const fmtTime = (d: Date) => new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(d);
const fmtShort = (d: Date) =>
  new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: tz }).format(d);
const euro = (n: number) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
const address = `${brand.address.street}, ${brand.address.detail}, ${brand.address.zip} ${brand.address.city}`;
const hello = (name: string) => (name ? `Hallo ${name},` : "Hallo,");
const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Gemeinsamer Rahmen im Stil der Website: ruhig, warm, eckige Knöpfe */
function layout(body: string, footer = "") {
  return `<!doctype html><html lang="de"><body style="margin:0;background:#FAF7F2;font-family:Montserrat,Helvetica,Arial,sans-serif;color:#2B2420">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF">
<tr><td style="padding:32px 32px 8px;font-size:22px;font-weight:300;letter-spacing:.04em;text-transform:lowercase">${escape(brand.name)}<div style="font-size:10px;letter-spacing:.4em;text-transform:uppercase;color:#5F544C;margin-top:4px">${escape(brand.byline)}</div></td></tr>
<tr><td style="padding:16px 32px 32px;font-size:15px;line-height:1.7;color:#2B2420">${body}</td></tr>
</table>
<p style="max-width:560px;font-size:12px;line-height:1.6;color:#5F544C;margin:16px auto 0">${escape(brand.fullName)}, ${escape(address)}, ${escape(brand.contact.phone)}${footer}</p>
</td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:28px 0"><a href="${escape(href)}" style="display:inline-block;background:#2B2420;color:#FFFFFF;text-decoration:none;padding:14px 26px;font-size:12px;letter-spacing:.18em;text-transform:uppercase">${escape(label)}</a></p>`;

function details(a: AppointmentInfo) {
  const rows: [string, string][] = [
    ["Behandlung", a.serviceName],
    ["Datum", fmtDay(a.start)],
    ["Uhrzeit", `${fmtTime(a.start)} Uhr`],
    ["Preis", `${euro(a.price)} (Zahlung im Studio)`],
    ["Ort", address],
  ];
  const html = `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #DDD2C4;margin:20px 0">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 12px 10px 0;border-bottom:1px solid #DDD2C4;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#5F544C;vertical-align:top;width:110px">${k}</td><td style="padding:10px 0;border-bottom:1px solid #DDD2C4">${escape(v)}</td></tr>`,
    )
    .join("")}</table>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  return { html, text };
}

const cancelHint = `Kostenlos absagen kannst du bis ${brand.booking.freeCancellationHours} Stunden vorher über den Link. Danach ruf bitte im Studio an: ${brand.contact.phone}.`;

export function confirmationEmail(a: AppointmentInfo): Message {
  const d = details(a);
  return {
    subject: `Dein Termin am ${fmtShort(a.start)} um ${fmtTime(a.start)} Uhr ist bestätigt`,
    text: `${hello(a.firstName)}\n\ndanke für deine Buchung! Dein Termin steht:\n\n${d.text}\n\nTermin ansehen oder absagen: ${a.manageUrl}\n\n${cancelHint}\n\nBitte komm zur Gesichtsbehandlung möglichst ohne Make-up.\n\nBis bald,\nFilo`,
    html: layout(
      `<p>${escape(hello(a.firstName))}</p><p>danke für deine Buchung! Dein Termin steht:</p>${d.html}${button(a.manageUrl, "Termin ansehen")}<p style="color:#5F544C;font-size:14px">${escape(cancelHint)}</p><p style="color:#5F544C;font-size:14px">Bitte komm zur Gesichtsbehandlung möglichst ohne Make-up. Den Termin findest du auch im Anhang für deinen Kalender.</p><p>Bis bald,<br>Filo</p>`,
    ),
  };
}

export function reminderEmail(a: AppointmentInfo): Message {
  const d = details(a);
  return {
    subject: `Erinnerung: morgen um ${fmtTime(a.start)} Uhr bei ${brand.fullName}`,
    text: `${hello(a.firstName)}\n\nkleine Erinnerung an deinen Termin morgen:\n\n${d.text}\n\nDoch verhindert? Bitte gib kurz Bescheid: ${a.manageUrl} oder ${brand.contact.phone}\n\nIch freue mich auf dich,\nFilo`,
    html: layout(
      `<p>${escape(hello(a.firstName))}</p><p>kleine Erinnerung an deinen Termin morgen:</p>${d.html}<p style="color:#5F544C;font-size:14px">Doch verhindert? Bitte gib kurz Bescheid, dann kann jemand anderes den Termin bekommen.</p>${button(a.manageUrl, "Termin ansehen")}<p>Ich freue mich auf dich,<br>Filo</p>`,
    ),
  };
}

/** SMS: kurz halten (eine SMS = 160 Zeichen) */
export function reminderSms(a: AppointmentInfo): string {
  return `${brand.name}: Erinnerung an deinen Termin morgen, ${fmtTime(a.start)} Uhr (${a.serviceName.slice(0, 40)}). Verhindert? ${brand.contact.phone}`;
}

export function cancellationEmail(a: AppointmentInfo, bookUrl: string): Message {
  return {
    subject: `Dein Termin am ${fmtShort(a.start)} ist abgesagt`,
    text: `${hello(a.firstName)}\n\ndein Termin „${a.serviceName}" am ${fmtDay(a.start)} um ${fmtTime(a.start)} Uhr ist abgesagt.\n\nNeuen Termin buchen: ${bookUrl}\n\nLiebe Grüße,\nFilo`,
    html: layout(
      `<p>${escape(hello(a.firstName))}</p><p>dein Termin <strong style="font-weight:500">${escape(a.serviceName)}</strong> am ${escape(fmtDay(a.start))} um ${fmtTime(a.start)} Uhr ist abgesagt.</p>${button(bookUrl, "Neuen Termin buchen")}<p>Liebe Grüße,<br>Filo</p>`,
    ),
  };
}

export function rescheduleEmail(a: AppointmentInfo): Message {
  const d = details(a);
  return {
    subject: `Dein Termin wurde verschoben: ${fmtShort(a.start)}, ${fmtTime(a.start)} Uhr`,
    text: `${hello(a.firstName)}\n\ndein Termin hat eine neue Zeit:\n\n${d.text}\n\nTermin ansehen oder absagen: ${a.manageUrl}\n\nLiebe Grüße,\nFilo`,
    html: layout(`<p>${escape(hello(a.firstName))}</p><p>dein Termin hat eine neue Zeit:</p>${d.html}${button(a.manageUrl, "Termin ansehen")}<p>Liebe Grüße,<br>Filo</p>`),
  };
}

export function reviewRequestEmail(firstName: string, reviewUrl: string): Message {
  return {
    subject: "Wie hat dir deine Behandlung gefallen?",
    text: `${hello(firstName)}\n\ndanke, dass du bei mir warst! Ich würde mich sehr freuen, wenn du in ein, zwei Sätzen auf Google erzählst, wie du die Behandlung erlebt hast. Das hilft anderen bei der Entscheidung und mir sehr.\n\nZur Bewertung: ${reviewUrl}\n\nDanke dir,\nFilo`,
    html: layout(
      `<p>${escape(hello(firstName))}</p><p>danke, dass du bei mir warst! Ich würde mich sehr freuen, wenn du in ein, zwei Sätzen auf Google erzählst, wie du die Behandlung erlebt hast. Das hilft anderen bei der Entscheidung und mir sehr.</p>${button(reviewUrl, "Bewertung schreiben")}<p>Danke dir,<br>Filo</p>`,
    ),
  };
}

export function rebookEmail(firstName: string, serviceName: string, bookUrl: string, unsubscribeUrl: string): Message {
  return {
    subject: "Zeit für deine nächste Behandlung?",
    text: `${hello(firstName)}\n\ndeine letzte Behandlung „${serviceName}" ist schon eine Weile her. Für ein dauerhaft schönes Ergebnis empfehle ich regelmäßige Termine.\n\nJetzt Termin buchen: ${bookUrl}\n\nLiebe Grüße,\nFilo\n\nKeine solchen E-Mails mehr: ${unsubscribeUrl}`,
    html: layout(
      `<p>${escape(hello(firstName))}</p><p>deine letzte Behandlung <strong style="font-weight:500">${escape(serviceName)}</strong> ist schon eine Weile her. Für ein dauerhaft schönes Ergebnis empfehle ich regelmäßige Termine.</p>${button(bookUrl, "Termin buchen")}<p>Liebe Grüße,<br>Filo</p>`,
      `<br><a href="${escape(unsubscribeUrl)}" style="color:#5F544C">Keine solchen E-Mails mehr erhalten</a>`,
    ),
  };
}

export function ownerNewBookingEmail(a: AppointmentInfo & { customerName: string; phone: string; email: string; notes: string }, adminUrl: string): Message {
  const d = details(a);
  return {
    subject: `Neue Buchung: ${a.customerName}, ${fmtShort(a.start)} ${fmtTime(a.start)} Uhr`,
    text: `Neue Online-Buchung\n\n${a.customerName}\nTelefon: ${a.phone}\nE-Mail: ${a.email}\n${a.notes ? `Anmerkung: ${a.notes}\n` : ""}\n${d.text}\n\nIm Admin öffnen: ${adminUrl}`,
    html: layout(
      `<p style="font-size:18px;font-weight:300">Neue Online-Buchung</p><p><strong style="font-weight:500">${escape(a.customerName)}</strong><br>${escape(a.phone)}<br>${escape(a.email)}</p>${a.notes ? `<p style="color:#5F544C">Anmerkung: ${escape(a.notes)}</p>` : ""}${d.html}${button(adminUrl, "Im Admin öffnen")}`,
    ),
  };
}

export function ownerCancellationEmail(a: AppointmentInfo & { customerName: string }, adminUrl: string): Message {
  return {
    subject: `Absage: ${a.customerName}, ${fmtShort(a.start)} ${fmtTime(a.start)} Uhr`,
    text: `${a.customerName} hat online abgesagt:\n${a.serviceName}, ${fmtDay(a.start)}, ${fmtTime(a.start)} Uhr.\nDie Zeit ist wieder buchbar.\n\n${adminUrl}`,
    html: layout(
      `<p style="font-size:18px;font-weight:300">Online-Absage</p><p><strong style="font-weight:500">${escape(a.customerName)}</strong> hat abgesagt: ${escape(a.serviceName)}, ${escape(fmtDay(a.start))}, ${fmtTime(a.start)} Uhr.</p><p style="color:#5F544C">Die Zeit ist wieder online buchbar.</p>${button(adminUrl, "Im Admin öffnen")}`,
    ),
  };
}
