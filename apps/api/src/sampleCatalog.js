import { j300EnglishPageTextBlocks } from "./catalogTranslations.js";

export const catalogTemplate = {
  id: "j300-lm-template",
  name: "J300 LM 2026 Catalog",
  templateRevision: "2026-10-06-r4",
  preserveSourceArtwork: true,
  pageSize: {
    width: 1190.2,
    height: 841.89
  },
  page1: {
    background: "/api/assets/j300/page-1.png",
    titleRegion: {
      page: "page1",
      x: 728,
      y: 108,
      width: 250,
      height: 120,
      background: "#ffffff",
      sourceValue: "J300 LM"
    },
    machineCategoryRegion: {
      page: "page1",
      x: 832,
      y: 181,
      width: 150,
      height: 72,
      background: "#ffffff",
      textColor: "#4b4b4b",
      sourceValue: "CNC Turning Center"
    },
    heroOverlay: {
      page: "page1",
      x: 668,
      y: 238,
      width: 454,
      height: 448,
      radius: 0,
      shadow: false,
      frameStyle: "cutout",
      objectFit: "contain",
      objectPosition: "center center",
      placeholderImage: null
    },
    columns: [
      {
        key: "features",
        label: "Features",
        page: "page2",
        x: 648,
        y: 660,
        width: 505,
        height: 132,
        background: "#eeeeee",
        textColor: "#3b3b3b",
        titleColor: "#b3192d",
        compact: true,
        sourceItems: [
          "Heavily ribbed robust machine structure",
          "Thermally stabilised spindle with 4000 rpm",
          "Electro Mechanical turret with 0.45 sec indexing time",
          "Linear Motion guideways - 30 m/min rapid rate",
          "Pre-tensioned ball screws",
          "100% ball bar tested"
        ]
      },
      {
        key: "standardAccessories",
        label: "Standard Accessories",
        page: "page1",
        x: 40,
        y: 397,
        width: 205,
        height: 150,
        background: "#ffffff",
        textColor: "#333333",
        titleColor: "#be1e2d",
        compact: true,
        sourceItems: [
          "AC spindle & axes drives",
          "Precision LM guideways on both axes",
          "Heavy duty bi-directional turret (8 station)",
          "Tailstock with live center",
          "Automatic centralized oil lubrication",
          "Hydraulic power operated chuck (Ø165 mm)",
          "Programmable quill",
          "3 tier lamp",
          "Rigid tapping",
          "Drain line oil cooler",
          "Basic hydraulic system",
          "OD tool holder clamping block (8 nos)",
          "Boring bar holder (4 nos)",
          "Facing tool holder (2 nos)",
          "Set of sleeves"
        ]
      },
      {
        key: "optionalAccessories",
        label: "Optional Accessories",
        page: "page1",
        x: 245,
        y: 397,
        width: 200,
        height: 100,
        background: "#ffffff",
        textColor: "#333333",
        titleColor: "#be1e2d",
        compact: true,
        sourceItems: [
          "Hydraulic power operated Chuck (Ø200 mm)",
          "Voltage stabilizer - 15 kVA",
          "High pressure coolant system",
          "Max 4 bar at pump outlet",
          "Chip Conveyor - Slat (Long steel curly chips)/ Scrapper (Cast iron / Powder chips)",
          "12 Station Turret - Electro Mechanical"
        ]
      }
    ],
    legalNoteRegion: {
      page: "page1",
      x: 245,
      y: 497,
      width: 330,
      height: 48,
      background: "#eeeeee",
      textColor: "#3f3f3f",
      sourceValue: "Specifications are correct at the time of print and are subject to change without prior notice. We are continuously working on our product development. The information and specifications published in the catalog are subject to modification."
    }
  },
  page2: {
    background: "/api/assets/j300/page-2.png",
    specsPanel: {
      page: "page1",
      x: 40,
      y: 42,
      width: 520,
      height: 355,
      background: "#ffffff",
      borderColor: "#be1e2d",
      accentColor: "#be1e2d",
      layout: "columns",
      sourceColumns: true,
      showNote: false
    }
  },
  page3: {
    background: "/api/assets/j300/page-3.png"
  },
  page4: {
    background: "/api/assets/j300/page-4.png"
  },
  specValueRegions: [
    { label: "Swing Over Bed", sourceValue: "500 mm", page: "page1", x: 154, y: 87, width: 49, height: 12 },
    { label: "Swing Over Carriage", sourceValue: "225 mm", page: "page1", x: 154, y: 102, width: 49, height: 12 },
    { label: "Distance Between Centers", sourceValue: "312 mm", page: "page1", x: 154, y: 117, width: 49, height: 12 },
    { label: "Max. Turning Dia", sourceValue: "320 mm", page: "page1", x: 154, y: 132, width: 49, height: 12 },
    { label: "Max. Turning Length", sourceValue: "300 mm", page: "page1", x: 154, y: 146, width: 49, height: 12 },
    { label: "Tooling Type", sourceValue: "BTP - 80", page: "page1", x: 328, y: 87, width: 50, height: 12 },
    { label: "No. of Stations", sourceValue: "8 (12)", page: "page1", x: 328, y: 102, width: 50, height: 12 },
    { label: "Max Boring bar Dia", sourceValue: "Ø40 (Ø32)", page: "page1", x: 328, y: 117, width: 50, height: 12 },
    { label: "OD Turning tool", sourceValue: "25x25 (20x20)", page: "page1", x: 328, y: 132, width: 50, height: 12, minFontSize: 6.2 },
    { label: "X Axis Stroke", sourceValue: "165 mm", page: "page1", x: 502, y: 87, width: 50, height: 12 },
    { label: "Z Axis Stroke", sourceValue: "300 mm", page: "page1", x: 502, y: 102, width: 50, height: 12 },
    { label: "X & Z Axes Guideways", sourceValue: "linear Motion", page: "page1", x: 502, y: 117, width: 50, height: 12, minFontSize: 5.7 },
    { label: "X & Z Axes Rapid Traverse rate", sourceValue: "30m/min", page: "page1", x: 502, y: 138, width: 50, height: 12 },
    { label: "Spindle Nose", sourceValue: "A2-5", page: "page1", x: 154, y: 187, width: 224, height: 12 },
    { label: "Max. Spindle Speed", sourceValue: "4000 rpm", page: "page1", x: 154, y: 202, width: 224, height: 12 },
    { label: "Bore Through Spindle", sourceValue: "52.5 mm", page: "page1", x: 154, y: 217, width: 224, height: 12 },
    { label: "Max. Bar Capacity", sourceValue: "42 mm", page: "page1", x: 154, y: 232, width: 224, height: 12 },
    { label: "Spindle Motor Power", sourceValue: "Fanuc (Continuous/tS2-60min, S3/S6 60%, S2-15 min, S3/S6 25% / S3/S6-15% Rating) — 5.5 / 7.5 / 11 kW", page: "page1", x: 154, y: 246, width: 224, height: 28, minFontSize: 5.2 },
    { label: "Full Power Range - Fanuc", sourceValue: "1333 - 4000 rpm", page: "page1", x: 154, y: 270, width: 224, height: 12 },
    { label: "Standard Chuck Size", sourceValue: "165 mm", page: "page1", x: 154, y: 284, width: 224, height: 12 },
    { label: "Positioning X & Z", sourceValue: "0.007 mm", page: "page1", x: 502, y: 187, width: 50, height: 12 },
    { label: "Repeatability X & Z", sourceValue: "0.005 mm", page: "page1", x: 502, y: 202, width: 50, height: 12 },
    { label: "Standard", sourceValue: "Fanuct", page: "page1", x: 502, y: 250, width: 50, height: 12, minFontSize: 5.4 },
    { label: "Optional", sourceValue: "Siemens / Syntec / Mitsubishi", page: "page1", x: 502, y: 268, width: 50, height: 32, minFontSize: 5.4 },
    { label: "Hydraulic Pump Capacity", sourceValue: "14 Lpm", page: "page1", x: 205, y: 325, width: 173, height: 12 },
    { label: "Hydraulic Power Pack Tank Capacity", sourceValue: "40 L (ltr)", page: "page1", x: 205, y: 340, width: 173, height: 12 },
    { label: "Overall Dimensions (L×W×H)", sourceValue: "2020x1640x1985 mm", page: "page1", x: 205, y: 355, width: 173, height: 12 },
    { label: "Overall Weight - Net", sourceValue: "~2790 Kg", page: "page1", x: 205, y: 370, width: 173, height: 12 },
    { label: "Coolant Tank Capacity", sourceValue: "90L (l)", page: "page1", x: 502, y: 325, width: 50, height: 12 }
  ]
};

export const initialCatalog = {
  catalogId: "j300-lm",
  templateId: catalogTemplate.id,
  language: "English",
  layoutSettings: {
    fitLevel: 0
  },
  title: "J300 LM",
  machineCategory: "CNC Turning Center",
  specificationsTitle: "Specifications",
  sectionLabels: {
    features: "Features",
    standardAccessories: "Standard Accessories",
    optionalAccessories: "Optional Accessories",
    note: "Note"
  },
  badge: "Jobber Elite",
  heroOverlayImage: null,
  editableRegionOverrides: {},
  pageTextBlocks: j300EnglishPageTextBlocks,
  features: [
    "Heavily ribbed robust machine structure",
    "Thermally stabilised spindle with 4000 rpm",
    "Electro Mechanical turret with 0.45 sec indexing time",
    "Linear Motion guideways - 30 m/min rapid rate",
    "Pre-tensioned ball screws",
    "100% ball bar tested"
  ],
  standardAccessories: [
    "AC spindle & axes drives",
    "Precision LM guideways on both axes",
    "Heavy duty bi-directional turret (8 station)",
    "Tailstock with live center",
    "Automatic centralized oil lubrication",
    "Hydraulic power operated chuck (Ø165 mm)",
    "Programmable quill",
    "3 tier lamp",
    "Rigid tapping",
    "Drain line oil cooler",
    "Basic hydraulic system",
    "OD tool holder clamping block (8 nos)",
    "Boring bar holder (4 nos)",
    "Facing tool holder (2 nos)",
    "Set of sleeves"
  ],
  optionalAccessories: [
    "Hydraulic power operated Chuck (Ø200 mm)",
    "Voltage stabilizer - 15 kVA",
    "High pressure coolant system",
    "Max 4 bar at pump outlet",
    "Chip Conveyor - Slat (Long steel curly chips)/ Scrapper (Cast iron / Powder chips)",
    "12 Station Turret - Electro Mechanical"
  ],
  specSections: [
    {
      title: "Capacity",
      column: 1,
      items: [
        { label: "Swing Over Bed", value: "500 mm" },
        { label: "Swing Over Carriage", value: "225 mm" },
        { label: "Distance Between Centers", value: "312 mm" },
        { label: "Max. Turning Dia", value: "320 mm" },
        { label: "Max. Turning Length", value: "300 mm" }
      ]
    },
    {
      title: "Turret",
      column: 2,
      items: [
        { label: "Tooling Type", value: "BTP - 80" },
        { label: "No. of Stations", value: "8 (12)" },
        { label: "Max Boring bar Dia", value: "Ø40 (Ø32)" },
        { label: "OD Turning tool", value: "25x25 (20x20)" }
      ]
    },
    {
      title: "Axis",
      column: 3,
      items: [
        { label: "X Axis Stroke", value: "165 mm" },
        { label: "Z Axis Stroke", value: "300 mm" },
        { label: "X & Z Axes Guideways", value: "linear Motion" },
        { label: "X & Z Axes Rapid Traverse rate", value: "30m/min" }
      ]
    },
    {
      title: "Spindle",
      column: 1,
      items: [
        { label: "Spindle Nose", value: "A2-5" },
        { label: "Max. Spindle Speed", value: "4000 rpm" },
        { label: "Bore Through Spindle", value: "52.5 mm" },
        { label: "Max. Bar Capacity", value: "42 mm" },
        { label: "Spindle Motor Power", value: "Fanuc (Continuous/tS2-60min, S3/S6 60%, S2-15 min, S3/S6 25% / S3/S6-15% Rating) — 5.5 / 7.5 / 11 kW" },
        { label: "Full Power Range - Fanuc", value: "1333 - 4000 rpm" },
        { label: "Standard Chuck Size", value: "165 mm" }
      ]
    },
    {
      title: "Accuracy - ISO 230-2",
      column: 3,
      items: [
        { label: "Positioning X & Z", value: "0.007 mm" },
        { label: "Repeatability X & Z", value: "0.005 mm" }
      ]
    },
    {
      title: "Control System",
      column: 3,
      items: [
        { label: "Standard", value: "Fanuct" },
        { label: "Optional", value: "Siemens / Syntec / Mitsubishi" }
      ]
    },
    {
      title: "Hydraulic System",
      column: 1,
      items: [
        { label: "Hydraulic Pump Capacity", value: "14 Lpm" },
        { label: "Hydraulic Power Pack Tank Capacity", value: "40 L (ltr)" },
        { label: "Overall Dimensions (L×W×H)", value: "2020x1640x1985 mm" },
        { label: "Overall Weight - Net", value: "~2790 Kg" }
      ]
    },
    {
      title: "Coolant System",
      column: 3,
      items: [
        { label: "Coolant Tank Capacity", value: "90L (l)" }
      ]
    }
  ],
  legalNote:
    "Specifications are correct at the time of print and are subject to change without prior notice. We are continuously working on our product development. The information and specifications published in the catalog are subject to modification."
};
