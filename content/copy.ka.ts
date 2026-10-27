/**
 * DRAFT — all Georgian copy for Brindo.
 * Needs proofreading by a native Georgian speaker before launch. Do not hard-code
 * Georgian text anywhere else; import it from this file.
 */

export const DRAFT = true;

export const copy = {
  meta: {
    siteName: "Brindo",
    description: "ელეგანტური ციფრული მოსაწვევები ქორწილისთვის. გაუგზავნეთ სტუმრებს ბმული და მიიღეთ პასუხები ერთ ადგილას.",
  },

  ui: {
    loading: "იგზავნება…",
    decrease: "შემცირება",
    increase: "გაზრდა",
  },

  /** Sample content used by /styleguide to test the font and layout with real Georgian text. */
  styleguide: {
    namesShort: ["ნინო", "გიორგი"],
    namesLong: ["ალექსანდრე", "ელისაბედ"],
    namesInline: "ნინო და გიორგი",
    ampersand: "&",
    weekday: "შაბათი",
    month: "ივნისი",
    day: "14",
    year: "2026",
    time: "18:00",
    countdownUnits: ["დღე", "საათი", "წუთი", "წამი"],
    venueName: "მთაწმინდის ბაღი",
    address: "თბილისი, ილია ჭავჭავაძის გამზირი 37, მეორე სართული, დიდი დარბაზი",
    message:
      "ძვირფასო მეგობრებო,\nგვიხარია, რომ ჩვენი ცხოვრების ყველაზე მნიშვნელოვან დღეს ჩვენთან ერთად იქნებით.\nთქვენი სიყვარული და მხარდაჭერა ჩვენთვის ყველაფერს ნიშნავს. მოდით, ერთად ავწიოთ სადღეგრძელო.",
    labels: {
      invitation: "მოსაწვევი",
      date: "თარიღი",
      venue: "ადგილი",
      program: "პროგრამა",
      rsvp: "დასწრება",
    },
    headings: {
      h2: "გელოდებით ჩვენს დღესასწაულზე",
      h3: "ცერემონია და ვახშამი",
    },
    buttons: {
      accept: "სიამოვნებით მოვალ",
      decline: "სამწუხაროდ, ვერ მოვალ",
      calendar: "კალენდარში დამატება",
      maps: "რუკაზე ნახვა",
    },
    fields: {
      name: "სახელი და გვარი",
      nameValue: "ნინო ბერიძე-ჩიქოვანი",
      nameError: "გთხოვთ, მიუთითოთ სახელი",
      message: "მისალოცი სიტყვა",
      messageHint: "არასავალდებულო",
      partySize: "სტუმრების რაოდენობა",
    },
    halo: "სინათლე ჩვენი მთავარი მასალაა",
  },
} as const;

export type Copy = typeof copy;
