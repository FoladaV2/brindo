/**
 * Reviews shown on the home page (rating line under the hero button, testimonials section).
 *
 * REVIEWS holds only genuine reviews from real customers, added with their permission.
 * Never invent entries here (CLAUDE.md, "Honesty in marketing"). While it is empty, production
 * shows neither the rating line nor the testimonials section.
 *
 * SAMPLE_REVIEWS exist so the design can be judged in development and in styleguide builds.
 * They are always labelled as samples and never render in a production build.
 */

export type Review = {
  name: string;
  /** e.g. "ქორწილი, თბილისი" */
  event: string;
  quote: string;
  rating: 1 | 2 | 3 | 4 | 5;
};

export const REVIEWS: Review[] = [];

/** DRAFT sample copy, design only. */
export const SAMPLE_REVIEWS: Review[] = [
  {
    name: "სახელი გვარი",
    event: "ქორწილი",
    quote: "ბმული ოჯახის ჩატში გავაგზავნეთ და ორ დღეში თითქმის ყველამ უპასუხა. რესტორანს ზუსტი რიცხვი პირველად ვუთხარით დროულად.",
    rating: 5,
  },
  {
    name: "სახელი გვარი",
    event: "დაბადების დღე",
    quote: "ათ წუთში მოვამზადე. სტუმრებმა თქვეს, რომ მოსაწვევი ძალიან ლამაზი იყო და პასუხი ერთი შეხებით გასცეს.",
    rating: 5,
  },
  {
    name: "სახელი გვარი",
    event: "კორპორატიული ღონისძიება",
    quote: "120 თანამშრომელს ერთი ბმული გავუგზავნეთ. ცხრილების შევსება აღარ დაგვჭირდა.",
    rating: 5,
  },
  {
    name: "სახელი გვარი",
    event: "ნათლობა",
    quote: "ბებია-ბაბუებმაც კი უპრობლემოდ უპასუხეს. აპლიკაციის ჩამოტვირთვა არავის დასჭირდა.",
    rating: 4,
  },
];
