import { StaticImageData } from "next/image";
// import images here, also makes it easier for the next Image component
import ph from "@/public/imgs/CaseIT_On3.png";
import Andrew2025 from "@/public/imgs/getinvolved/2025/andrew.png";
import Suki2025 from "@/public/imgs/getinvolved/2025/suki.png";
import Shirley2025 from "@/public/imgs/getinvolved/2025/shirley.png";
import Cameron2025 from "@/public/imgs/getinvolved/2025/cameron.png";
import Stephanie2025 from "@/public/imgs/getinvolved/2025/stephanie.png";
import Troy2025 from "@/public/imgs/getinvolved/2025/troy.png";

import AndrewOberson2026 from "@/public/imgs/getinvolved/2026/andrew-oberson.jpg";
import MatthiasChun2026 from "@/public/imgs/getinvolved/2026/matthias-chun.png";
import ReinaCastaneda2026 from "@/public/imgs/getinvolved/2026/reina-castaneda.jpg";
import ShannonTang2026 from "@/public/imgs/getinvolved/2026/shannon-tang.png";
import TroyCheah2026 from "@/public/imgs/getinvolved/2026/troy-cheah.png";


export const historyText = {
  header2: "Relive our best moments",
};

export const heroContent = {};

export type MemberTypes = {
  name: string;
  quote: string;
  position: string;
  img: StaticImageData;
};

export const memberData: MemberTypes[] = [
  {
    img: ShannonTang2026,
    name: "Shannon Tang",
    quote:
      "\"Being a team host for CaseIT enriched my undergraduate experience by giving me a global network and community hosting universities from around the world. I made friends in my community and internationally beyond the CaseIT week. It was an impactful and meaningful experience connecting with a global teams, blending diverse cultures in one week.\nIt was a pleasure hosting, University of Minnesota and seeing them compete! Being apart of CaseIT has been a rewarding and inspiring experience that I would recommend to anyone!\"",
    position: "CaseIT 2025, Team Host",
  },
  {
    img: MatthiasChun2026,
    name: "Matthias Chun",
    quote:
      "\"I'll always remember being a Team Host at CaseIT as more than just a role. It was a fun and rewarding experience that shaped my Beedie journey. From exploring Vancouver with international teams to sharing conversations and laughter that turned strangers into friends, I gained valuable knowledge, perspective, and lifelong connections. CaseIT helped me grow both personally and professionally, and I would highly recommend the Team Host role to anyone looking to make the most of their university experience!\"",
    position: "CaseIT 2025, Team Host",
  },
  {
    img: TroyCheah2026,
    name: "Troy Cheah",
    quote:
      "\"My favourite week? CaseIT week! Last year, I was a Team Host for HEC Montréal and had the most amazing time with my team. From exploring different restaurants, to racing around Vancouver to complete challenges, to the exhilarating competition itself, every moment was unforgettable! If you would like to spend time and connect with passionate, talented, and driven business students from around the world, apply as a Team Host!\"",
    position: "CaseIT 2025, Team Host",
  },
  {
    img: ReinaCastaneda2026,
    name: "Reina Castaneda",
    quote:
      "\"As Director of Events, I had the privilege of creating exciting, impactful, and memorable experiences for competitors across the globe. This role challenged me to think creatively, lead confidently, and collaborate with talented individuals. Being apart of such a passionate team pushed me to grow personally and professionally, and create lasting friendships. Being part of CaseIT has been the highlight of my undergraduate journey. If given the chance, I'd do it all over again in a heartbeat!\"",
    position: "CaseIT 2025, Director of Events",
  },
  {
    img: AndrewOberson2026,
    name: "Andrew Oberson",
    quote:
      "\"As director of University Relations I had the privilege of communicating with and managing CaseIT's external university stakeholders. In addition, I had the privilege in having a hand in creating our incredible Team Host portfolio. CaseIT was a major point of growth in my undergraduate degree, building my professional skillset and creating lifelong connections. I will forever remember this unforgettable experience.\"",
    position: "CaseIT 2025, Director of University Relations",
  },
  {
    img: Andrew2025,
    name: "Andrew Lee",
    quote:
      "\"Working as the Director of University Relations was truly one of the most rewarding experiences throughout my undergraduate career. My time at CaseIT significantly enhanced my professional skill set, allowed me to meet other like-minded individuals, and helped me build life-long connections.\"",
    position: "CaseIT 2024, Director of University Relations",
  },
  {
    img: Suki2025,
    name: "Suki Leung",
    quote:
      "\"CaseIT was not just a competition; it was a journey of collaboration, innovation, and growth. As a Team Host, I had the privilege of witnessing our competitors' dedication and creativity firsthand. The friendships I made and the lessons I learned are something I will carry with me forever.\"",
    position: "CaseIT 2024, Team Host",
  },
  {
    img: Shirley2025,
    name: "Shirley Wen",
    quote:
    "\"As a University Relations Associate, I had the incredible opportunity to engage with universities worldwide and gain a global perspective. CaseIT was truly one of my most memorable and unique experiences at Beedie, creating lasting friendships and cherished memories.\"",
    position: "CaseIT 2024, University Relations Associate",
  },
  {
    img: Troy2025,
    name: "Troy Cheah",
    quote:
    "\"CaseIT was an unforgettable, extremely rewarding experience; I greatly strengthened my professional skill set, met so many amazing students, and learned from incredibly hardworking, dedicated leaders. The passionate, devoted community that CaseIT creates is inspiring and truly special.\"",
    position: "CaseIT 2024, Logistics Associate",
  },
  {
    img: Stephanie2025,
    name: "Stephanie Lim",
    quote:
    "\"If there is one thing that I would recommend anyone do in their undergraduate degree is to be a Team Host. My time at CaseIT was truly a unique and meaningful experience that I will never forget. This is an excellent opportunity for anyone looking to enhance their interpersonal skills, make new connections, and have lots of fun!\"",
    position: "CaseIT 2024, Team Host",
  },
  {
    img: Cameron2025,
    name: "Cameron Miranda",
    quote:
      "\"As the Director of Hospitality, I had the privilege of crafting an exceptional competition experience for our global competitors. I witnessed firsthand the vibrant enthusiasm everyone brought to the event. Their spirit made CaseIT an immensely rewarding experience for all involved.\"",
    position: "CaseIT 2024, Director of Hospitality",
  },
];

export const imgButtons = [
  {
    img: "/imgs/2024_OC.PNG",
    alt: "2024 OC team pic",
    text: "2024 RECAP",
    link: "/history/recap/",
  },
  {
    img: "/imgs/CaseIT_On3.PNG",
    alt: "2024 OC team pic",
    text: "2024 MEDIA GALLERY",
    link: "/history/media/",
  },
];
