import { title } from "process";

export const caseit2026Text = {
  header1: "Ready for iT?",
  header2: [
    "Competition Schedule",
    "Live Updates",
    "23rd iteration",
    "2026 Winners",
  ],
  disclaimer:
    "Note: An official detailed schedule for CaseIT 2026 will be updated soon.",
};

export const boldText = {
  section_2_Pargraph: (
    <p className="max-w-[65ch] md:text-center md:text-lg mt-4 md:mt-8">
      CaseIT is back and better, stronger, and faster than ever. With our 22nd
      iteration, the Organizing Committee promises a competition full of fun,
      challenges, leaving you with double the memories! We are excited to
      welcome top business technology undergraduates and their faculty advisors
      from around the world to the beautiful city of Vancouver from{" "}
      <strong>February 16 to 21, 2025</strong>.
    </p>
  ),

  section_3_Title: "Competition Information",
};

const Division1 = [
  "Peak Consulting",
  "Apex Consulting",
  "JP Consulting",
  "Sky Consulting",
];
const Division2 = ["Apollo", "Skeleton Crew", "Alliance 360", "LaunchPoint Consulting"];
const Division3 = [
  "Dynamic Consulting",
  "Beyond Consulting",
  "360 Degree Consulting",
  "BMCC",
];
const Division4 = [
  "Cinema",
  "Visionary Consulting",
  "EverGreen Consulting",
  "Viewpoint Group",
];

export const caseOneDivisionDraw = [
  {
    title: "Division 1",
    data: Division1.map((uni, idx) => {
      return {
        label: String.fromCharCode(65 + idx),
        teamName: uni,
      };
    }),
  },
  {
    title: "Division 2",
    data: Division2.map((uni, idx) => {
      return {
        label: String.fromCharCode(65 + idx),
        teamName: uni,
      };
    }),
  },
  {
    title: "Division 3",
    data: Division3.map((uni, idx) => {
      return {
        label: String.fromCharCode(65 + idx),
        teamName: uni,
      };
    }),
  },
  {
    title: "Division 4",
    data: Division4.map((uni, idx) => {
      return {
        label: String.fromCharCode(65 + idx),
        teamName: uni,
      };
    }),
  },
];

export const caseOneDivisionWinners = {
  title: "Division Winners",
  data:  ["Apex Consulting", "Skeleton Crew", "Beyond Consulting", "Evergreen Consulting"].map((uni, idx) => {
      return {
        label: `Division ${idx + 1}`,
        teamName: uni
      }
  })
}

export const caseTwoDivisionWinners = {
  title: "Division Winners",
  data:  ["Peak Consulting", "Alliance 360", "BMCC", "Visionary Consulting", "Skeleton Crew"].map((uni, idx) => {
      return {
        label: idx < 4 ? `Division ${idx + 1}` : "Wildcard",
        teamName: uni
      }
  })
}

export const compWeek = {
  caseOne: (
    <h2 className="font-semibold text-header3 sm:text-header2">
      <span className="text-redDark">Case I</span> Division Draw
    </h2>
  ),
  caseOneWinner: (
    <h2 className="font-semibold text-header3 sm:text-header2">
      <span className="text-redDark">Case I</span> Division Winners
    </h2>
  ),
  caseTwoWinner: (
    <h2 className="font-semibold text-header3 sm:text-header2">
      <span className="text-redDark">Case II</span> Division Winners
    </h2>
  ),
};


export const winners = [
  {
    img: "/imgs/winners/2026/first_place_emory_university.JPG",
    alt: "Emory University First Place Winner",
    title: "Emory University",
    place: "First Place",
  },
  {
    img: "/imgs/winners/2026/second_place_chinese_university_hk.JPG",
    alt: "Chinese University of Hong Kong Second Place Winner",
    title: "Chinese University of Hong Kong",
    place: "Second Place",
  },
  {
    img: "/imgs/winners/2026/third_place_panamericana.JPG",
    alt: "Universidad Panamericana Third Place Winner",
    title: "Universidad Panamericana",
    place: "Third Place",
  },
  {
    img: "/imgs/winners/2026/spirit_award_idiana_university.JPG",
    alt: "Indiana University Spirit Award",
    title: "Indiana University",
    place: "Spirit Award",
  },
  {
    img: "/imgs/winners/2026/best_speaker.JPG",
    alt: "Speaker winner",
    title: "Jenny Jiang",
    place: "Best Speaker",
  },
];
