const venue = {
  sekolahmu: {
    name: "Sekolah.mu Tech Talks",
    link: "https://www.instagram.com/techinsekolahmu/",
    location: "Online (hosted by Sekolah.mu)"
  }
}

const topics = [
  {
    id: "chrome-extension",
    title: "Extensions: Level Up Your Browser",
    description:
      "Learn how to build a Chrome Extension using HTML, CSS, and JavaScript and power up your browser experience."
  },
  {
    id: "unit-testing-in-front-end",
    title: "Unit Testing in Frontend Web",
    description:
      "Learn how to write unit tests for your Vue web applications using Jest."
  }
]

const talks = {
  "chrome-extension": [
    {
      date: "2025-03-20",
      venue: "sekolahmu",
      slides: "https://talks.jaluwibowo.id/sekolahmu-talks-chrome-extension",
      pdf: "https://cdn.jaluwibowo.id/pdf/Extensions%2C+Level+Up+Your+Browser+-+Jalu.pdf",
      video: ""
    }
  ],
  "unit-testing-in-front-end": [
    {
      date: "2022-03-31",
      venue: "sekolahmu",
      slides: "",
      pdf: "",
      video:
        "https://www.youtube.com/watch?v=MbHpd0g2SVA&ab_channel=TechinSekolahmu"
    }
  ]
}

export { venue, topics, talks }
