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
  data:  ["Peak Consulting", "Alliance 360", "BMCC", "Visionary Consulting"].map((uni, idx) => {
      return {
        label: `Division ${idx + 1}`,
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
  caseTwoPreliminaryWinner: (
    <h2 className="font-semibold text-header3 sm:text-header2">
      <span className="text-redDark">Case II Preliminary</span> Division Winners
    </h2>
  ),
};
