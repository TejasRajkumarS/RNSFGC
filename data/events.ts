// Shared display shape for public event cards. Events come exclusively from
// Firestore — there are intentionally no hardcoded placeholder events.
export type CollegeEvent = {
  date: string;
  day: string;
  title: string;
  description: string;
  location: string;
};
