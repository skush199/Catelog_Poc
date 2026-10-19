const englishFeatures = [
  "Heavily ribbed robust machine structure",
  "Thermally stabilised spindle with 4000 rpm",
  "Electro Mechanical turret with 0.45 sec indexing time",
  "Linear Motion guideways - 30 m/min rapid rate",
  "Pre-tensioned ball screws",
  "100% ball bar tested"
];

const kannadaFeatures = [
  "ಭಾರವಾದ ರಿಬ್‌ಗಳಿರುವ ದೃಢವಾದ ಯಂತ್ರ ರಚನೆ",
  "4000 rpm ವೇಗದ ಉಷ್ಣ-ಸ್ಥಿರ ಸ್ಪಿಂಡಲ್",
  "0.45 ಸೆಕೆಂಡ್ ಇಂಡೆಕ್ಸಿಂಗ್ ಸಮಯದ ಎಲೆಕ್ಟ್ರೋ-ಮೆಕ್ಯಾನಿಕಲ್ ಟರೆಟ್",
  "ಲೀನಿಯರ್ ಮೋಶನ್ ಗೈಡ್‌ವೇಗಳು - 30 m/min ರ್ಯಾಪಿಡ್ ದರ",
  "ಪೂರ್ವ-ಒತ್ತಡಿತ ಬಾಲ್ ಸ್ಕ್ರೂಗಳು",
  "100% ಬಾಲ್ ಬಾರ್ ಪರೀಕ್ಷಿತ"
];

const hindiFeatures = [
  "भारी रिब वाली मजबूत मशीन संरचना",
  "4000 rpm वाला तापीय रूप से स्थिर स्पिंडल",
  "0.45 सेकंड इंडेक्सिंग समय वाला इलेक्ट्रो-मैकेनिकल टरेट",
  "लीनियर मोशन गाइडवे - 30 m/min रैपिड दर",
  "पूर्व-तनावित बॉल स्क्रू",
  "100% बॉल बार परीक्षणित"
];

const englishStandardAccessories = [
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
];

const kannadaStandardAccessories = [
  "ಎಸಿ ಸ್ಪಿಂಡಲ್ ಮತ್ತು ಅಕ್ಷಗಳ ಡ್ರೈವ್‌ಗಳು",
  "ಎರಡೂ ಅಕ್ಷಗಳಲ್ಲಿ ನಿಖರ LM ಗೈಡ್‌ವೇಗಳು",
  "ಹೆವಿ-ಡ್ಯೂಟಿ ದ್ವಿದಿಶ ಟರೆಟ್ (8 ಸ್ಟೇಷನ್)",
  "ಲೈವ್ ಸೆಂಟರ್ ಸಹಿತ ಟೇಲ್‌ಸ್ಟಾಕ್",
  "ಸ್ವಯಂಚಾಲಿತ ಕೇಂದ್ರೀಕೃತ ತೈಲ ಸ್ನೇಹನ",
  "ಹೈಡ್ರಾಲಿಕ್ ಚಾಲಿತ ಚಕ್ (Ø165 mm)",
  "ಪ್ರೋಗ್ರಾಮ್ ಮಾಡಬಹುದಾದ ಕ್ವಿಲ್",
  "3-ಹಂತದ ದೀಪ",
  "ರಿಜಿಡ್ ಟ್ಯಾಪಿಂಗ್",
  "ಡ್ರೇನ್ ಲೈನ್ ಆಯಿಲ್ ಕೂಲರ್",
  "ಮೂಲ ಹೈಡ್ರಾಲಿಕ್ ವ್ಯವಸ್ಥೆ",
  "OD ಟೂಲ್ ಹೋಲ್ಡರ್ ಕ್ಲ್ಯಾಂಪಿಂಗ್ ಬ್ಲಾಕ್ (8 nos)",
  "ಬೋರಿಂಗ್ ಬಾರ್ ಹೋಲ್ಡರ್ (4 nos)",
  "ಫೇಸಿಂಗ್ ಟೂಲ್ ಹೋಲ್ಡರ್ (2 nos)",
  "ಸ್ಲೀವ್‌ಗಳ ಸೆಟ್"
];

const hindiStandardAccessories = [
  "AC स्पिंडल और अक्ष ड्राइव",
  "दोनों अक्षों पर परिशुद्ध LM गाइडवे",
  "भारी-कार्य द्विदिश टरेट (8 स्टेशन)",
  "लाइव सेंटर सहित टेलस्टॉक",
  "स्वचालित केंद्रीकृत तेल स्नेहन",
  "हाइड्रोलिक संचालित चक (Ø165 mm)",
  "प्रोग्राम योग्य क्विल",
  "3-स्तरीय संकेतक लैंप",
  "रिजिड टैपिंग",
  "ड्रेन लाइन ऑयल कूलर",
  "मूल हाइड्रोलिक प्रणाली",
  "OD टूल होल्डर क्लैम्पिंग ब्लॉक (8 नग)",
  "बोरिंग बार होल्डर (4 नग)",
  "फेसिंग टूल होल्डर (2 नग)",
  "स्लीव का सेट"
];

const englishOptionalAccessories = [
  "Hydraulic power operated Chuck (Ø200 mm)",
  "Voltage stabilizer - 15 kVA",
  "High pressure coolant system",
  "Max 4 bar at pump outlet",
  "Chip Conveyor - Slat (Long steel curly chips)/ Scrapper (Cast iron / Powder chips)",
  "12 Station Turret - Electro Mechanical"
];

const kannadaOptionalAccessories = [
  "ಹೈಡ್ರಾಲಿಕ್ ಚಾಲಿತ ಚಕ್ (Ø200 mm)",
  "ವೋಲ್ಟೇಜ್ ಸ್ಟೆಬಿಲೈಸರ್ - 15 kVA",
  "ಅಧಿಕ ಒತ್ತಡದ ಕೂಲೆಂಟ್ ವ್ಯವಸ್ಥೆ",
  "ಪಂಪ್ ಔಟ್‌ಲೆಟ್‌ನಲ್ಲಿ ಗರಿಷ್ಠ 4 bar",
  "ಚಿಪ್ ಕನ್ವೇಯರ್ - ಸ್ಲಾಟ್ (ಉದ್ದ ಉಕ್ಕಿನ ಸುರುಳಿ ಚಿಪ್‌ಗಳು) / ಸ್ಕ್ರೇಪರ್ (ಕಾಸ್ಟ್ ಐರನ್ / ಪುಡಿ ಚಿಪ್‌ಗಳು)",
  "12 ಸ್ಟೇಷನ್ ಟರೆಟ್ - ಎಲೆಕ್ಟ್ರೋ-ಮೆಕ್ಯಾನಿಕಲ್"
];

const hindiOptionalAccessories = [
  "हाइड्रोलिक संचालित चक (Ø200 mm)",
  "वोल्टेज स्टेबलाइजर - 15 kVA",
  "उच्च-दाब कूलेंट प्रणाली",
  "पंप आउटलेट पर अधिकतम 4 bar",
  "चिप कन्वेयर - स्लैट (लंबे स्टील के घुमावदार चिप) / स्क्रेपर (कास्ट आयरन / पाउडर चिप)",
  "12 स्टेशन टरेट - इलेक्ट्रो-मैकेनिकल"
];

const englishSectionTitles = [
  "Capacity",
  "Turret",
  "Axis",
  "Spindle",
  "Accuracy - ISO 230-2",
  "Control System",
  "Hydraulic System",
  "Coolant System"
];

const kannadaSectionTitles = [
  "ಸಾಮರ್ಥ್ಯ",
  "ಟರೆಟ್",
  "ಅಕ್ಷ",
  "ಸ್ಪಿಂಡಲ್",
  "ನಿಖರತೆ - ISO 230-2",
  "ನಿಯಂತ್ರಣ ವ್ಯವಸ್ಥೆ",
  "ಹೈಡ್ರಾಲಿಕ್ ವ್ಯವಸ್ಥೆ",
  "ಶೀತಕ ವ್ಯವಸ್ಥೆ"
];

const hindiSectionTitles = [
  "क्षमता",
  "टरेट",
  "अक्ष",
  "स्पिंडल",
  "परिशुद्धता - ISO 230-2",
  "नियंत्रण प्रणाली",
  "हाइड्रोलिक प्रणाली",
  "कूलेंट प्रणाली"
];

const englishSpecLabels = [
  ["Swing Over Bed", "Swing Over Carriage", "Distance Between Centers", "Max. Turning Dia", "Max. Turning Length"],
  ["Tooling Type", "No. of Stations", "Max Boring bar Dia", "OD Turning tool"],
  ["X Axis Stroke", "Z Axis Stroke", "X & Z Axes Guideways", "X & Z Axes Rapid Traverse rate"],
  ["Spindle Nose", "Max. Spindle Speed", "Bore Through Spindle", "Max. Bar Capacity", "Spindle Motor Power", "Full Power Range - Fanuc", "Standard Chuck Size"],
  ["Positioning X & Z", "Repeatability X & Z"],
  ["Standard", "Optional"],
  ["Hydraulic Pump Capacity", "Hydraulic Power Pack Tank Capacity", "Overall Dimensions (L×W×H)", "Overall Weight - Net"],
  ["Coolant Tank Capacity"]
];

const kannadaSpecLabels = [
  ["ಬೆಡ್ ಮೇಲಿನ ಸ್ವಿಂಗ್", "ಕ್ಯಾರೇಜ್ ಮೇಲಿನ ಸ್ವಿಂಗ್", "ಕೇಂದ್ರಗಳ ನಡುವಿನ ಅಂತರ", "ಗರಿಷ್ಠ ಟರ್ನಿಂಗ್ ವ್ಯಾಸ", "ಗರಿಷ್ಠ ಟರ್ನಿಂಗ್ ಉದ್ದ"],
  ["ಟೂಲಿಂಗ್ ಪ್ರಕಾರ", "ಸ್ಟೇಷನ್‌ಗಳ ಸಂಖ್ಯೆ", "ಗರಿಷ್ಠ ಬೋರಿಂಗ್ ಬಾರ್ ವ್ಯಾಸ", "OD ಟರ್ನಿಂಗ್ ಟೂಲ್"],
  ["X ಅಕ್ಷ ಸ್ಟ್ರೋಕ್", "Z ಅಕ್ಷ ಸ್ಟ್ರೋಕ್", "X ಮತ್ತು Z ಅಕ್ಷ ಗೈಡ್‌ವೇಗಳು", "X ಮತ್ತು Z ಅಕ್ಷ ರ್ಯಾಪಿಡ್ ಟ್ರಾವರ್ಸ್ ದರ"],
  ["ಸ್ಪಿಂಡಲ್ ನೋಸ್", "ಗರಿಷ್ಠ ಸ್ಪಿಂಡಲ್ ವೇಗ", "ಸ್ಪಿಂಡಲ್ ಮೂಲಕ ಬೋರ್", "ಗರಿಷ್ಠ ಬಾರ್ ಸಾಮರ್ಥ್ಯ", "ಸ್ಪಿಂಡಲ್ ಮೋಟಾರ್ ಶಕ್ತಿ", "ಪೂರ್ಣ ಶಕ್ತಿ ವ್ಯಾಪ್ತಿ - Fanuc", "ಪ್ರಮಾಣಿತ ಚಕ್ ಗಾತ್ರ"],
  ["X ಮತ್ತು Z ಸ್ಥಾನದ ನಿಖರತೆ", "X ಮತ್ತು Z ಪುನರಾವರ್ತನೀಯತೆ"],
  ["ಪ್ರಮಾಣಿತ", "ಐಚ್ಛಿಕ"],
  ["ಹೈಡ್ರಾಲಿಕ್ ಪಂಪ್ ಸಾಮರ್ಥ್ಯ", "ಹೈಡ್ರಾಲಿಕ್ ಪವರ್ ಪ್ಯಾಕ್ ಟ್ಯಾಂಕ್ ಸಾಮರ್ಥ್ಯ", "ಒಟ್ಟು ಆಯಾಮಗಳು (L×W×H)", "ಒಟ್ಟು ತೂಕ - ನೆಟ್"],
  ["ಶೀತಕ ಟ್ಯಾಂಕ್ ಸಾಮರ್ಥ್ಯ"]
];

const hindiSpecLabels = [
  ["बेड के ऊपर स्विंग", "कैरिज के ऊपर स्विंग", "केंद्रों के बीच दूरी", "अधिकतम टर्निंग व्यास", "अधिकतम टर्निंग लंबाई"],
  ["टूलिंग प्रकार", "स्टेशनों की संख्या", "अधिकतम बोरिंग बार व्यास", "OD टर्निंग टूल"],
  ["X अक्ष स्ट्रोक", "Z अक्ष स्ट्रोक", "X और Z अक्ष गाइडवे", "X और Z अक्ष रैपिड ट्रैवर्स दर"],
  ["स्पिंडल नोज", "अधिकतम स्पिंडल गति", "स्पिंडल बोर", "अधिकतम बार क्षमता", "स्पिंडल मोटर शक्ति", "पूर्ण शक्ति सीमा - Fanuc", "मानक चक आकार"],
  ["X और Z पोजिशनिंग", "X और Z पुनरावृत्ति"],
  ["मानक", "वैकल्पिक"],
  ["हाइड्रोलिक पंप क्षमता", "हाइड्रोलिक पावर पैक टैंक क्षमता", "समग्र आयाम (L×W×H)", "कुल शुद्ध भार"],
  ["कूलेंट टैंक क्षमता"]
];

const englishLegalNote = "Specifications are correct at the time of print and are subject to change without prior notice. We are continuously working on our product development. The information and specifications published in the catalog are subject to modification.";
const kannadaLegalNote = "ಮುದ್ರಣದ ಸಮಯದಲ್ಲಿ ವಿಶೇಷಣಗಳು ಸರಿಯಾಗಿವೆ ಮತ್ತು ಮುಂಚಿತ ಸೂಚನೆ ಇಲ್ಲದೆ ಬದಲಾಗಬಹುದು. ನಾವು ನಮ್ಮ ಉತ್ಪನ್ನಗಳ ಅಭಿವೃದ್ಧಿಯಲ್ಲಿ ನಿರಂತರವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದ್ದೇವೆ. ಈ ಕ್ಯಾಟಲಾಗ್‌ನಲ್ಲಿ ಪ್ರಕಟಿಸಿದ ಮಾಹಿತಿ ಮತ್ತು ವಿಶೇಷಣಗಳು ಮಾರ್ಪಾಡಿಗೆ ಒಳಪಟ್ಟಿರುತ್ತವೆ.";
const hindiLegalNote = "मुद्रण के समय विनिर्देश सही हैं और बिना पूर्व सूचना के बदल सकते हैं। हम अपने उत्पादों के विकास पर निरंतर कार्य कर रहे हैं। इस कैटलॉग में प्रकाशित जानकारी और विनिर्देश संशोधन के अधीन हैं।";

const customItemTranslations = {
  English: [
    { aliases: ["Auto tool setter", "ಸ್ವಯಂಚಾಲಿತ ಟೂಲ್ ಸೆಟರ್", "स्वचालित टूल सेटर"], value: "Auto tool setter" },
    { aliases: ["Coolant auto-monitor", "ಶೀತಕ ಸ್ವಯಂ ಮಾನಿಟರ್", "कूलेंट स्वचालित मॉनिटर"], value: "Coolant auto-monitor" },
    { aliases: ["Machine health dashboard", "ಯಂತ್ರ ಆರೋಗ್ಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", "मशीन स्वास्थ्य डैशबोर्ड"], value: "Machine health dashboard" }
  ],
  Kannada: [
    { aliases: ["Auto tool setter", "ಸ್ವಯಂಚಾಲಿತ ಟೂಲ್ ಸೆಟರ್", "स्वचालित टूल सेटर"], value: "ಸ್ವಯಂಚಾಲಿತ ಟೂಲ್ ಸೆಟರ್" },
    { aliases: ["Coolant auto-monitor", "ಶೀತಕ ಸ್ವಯಂ ಮಾನಿಟರ್", "कूलेंट स्वचालित मॉनिटर"], value: "ಶೀತಕ ಸ್ವಯಂ ಮಾನಿಟರ್" },
    { aliases: ["Machine health dashboard", "ಯಂತ್ರ ಆರೋಗ್ಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", "मशीन स्वास्थ्य डैशबोर्ड"], value: "ಯಂತ್ರ ಆರೋಗ್ಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" }
  ],
  Hindi: [
    { aliases: ["Auto tool setter", "ಸ್ವಯಂಚಾಲಿತ ಟೂಲ್ ಸೆಟರ್", "स्वचालित टूल सेटर"], value: "स्वचालित टूल सेटर" },
    { aliases: ["Coolant auto-monitor", "ಶೀತಕ ಸ್ವಯಂ ಮಾನಿಟರ್", "कूलेंट स्वचालित मॉनिटर"], value: "कूलेंट स्वचालित मॉनिटर" },
    { aliases: ["Machine health dashboard", "ಯಂತ್ರ ಆರೋಗ್ಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", "मशीन स्वास्थ्य डैशबोर्ड"], value: "मशीन स्वास्थ्य डैशबोर्ड" }
  ]
};

export const j300EnglishPageTextBlocks = [
  {
    id: "page1-optional-features-heading",
    page: "page1",
    x: 445,
    y: 397,
    width: 218,
    height: 18,
    background: "#ffffff",
    textColor: "#be1e2d",
    fontSize: 8.6,
    fontWeight: 500,
    lineHeight: 1.1,
    text: "OPTIONAL FEATURES"
  },
  {
    id: "page1-optional-features-body",
    page: "page1",
    x: 445,
    y: 420,
    width: 218,
    height: 58,
    background: "#ffffff",
    textColor: "#333333",
    fontSize: 7.3,
    fontWeight: 400,
    lineHeight: 1.32,
    text: "AC unit for electrical cabinet\nMitsubishi / Syntec / Siemens CNC controller"
  },
  {
    id: "page1-weight-note",
    page: "page1",
    x: 40,
    y: 375,
    width: 164,
    height: 17,
    background: "#ffffff",
    textColor: "#333333",
    fontSize: 6.8,
    fontWeight: 400,
    lineHeight: 1.1,
    text: "(without packing & special accessories)"
  },
  {
    id: "page2-engineered-continuity",
    page: "page2",
    x: 55,
    y: 61,
    width: 275,
    height: 88,
    background: "#ffffff",
    textColor: "#ad1e31",
    fontSize: 29,
    fontWeight: 500,
    lineHeight: 1.02,
    text: "ENGINEERED\nCONTINUITY"
  },
  {
    id: "page2-company-intro",
    page: "page2",
    x: 288,
    y: 154,
    width: 255,
    height: 255,
    background: "#ffffff",
    textColor: "#303030",
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.42,
    text: "There are engineering companies that deliver reliable machines.\n\nAnd then there is Ace Micromatic, which delivers something beyond the machine: manufacturing continuity.\n\nWith advanced manufacturing infrastructure designed for precision, repeatability, and dependable performance, we ensure that our customers’ operations keep moving, with minimal disruption and maximum continuity.\n\nBecause when manufacturing keeps moving, business does too."
  },
  {
    id: "page2-advanced-heading",
    page: "page2",
    x: 280,
    y: 444,
    width: 280,
    height: 100,
    background: "#ffffff",
    textColor: "#b21d30",
    fontSize: 22,
    fontWeight: 400,
    lineHeight: 1.03,
    text: "ADVANCED\nMANUFACTURING\nCAPABILITY"
  },
  {
    id: "page2-capability-list",
    page: "page2",
    x: 286,
    y: 566,
    width: 270,
    height: 220,
    background: "#ffffff",
    textColor: "#303030",
    fontSize: 9.6,
    fontWeight: 400,
    lineHeight: 1.32,
    text: "3,00,000+ sq ft state-of-the-art assembly facility for high-precision, scalable production\n\nClass 10,000 clean room for contamination-controlled spindle assembly\n\nLean, flow-line assembly of Turning Centres for consistent production\n\n4-hour takt time for consistent quality and reliable delivery\n\nComprehensive portfolio of CNC Turning Centres, CNC Machining Centres and CNC Multi Axes Machines"
  },
  {
    id: "page2-product-intro",
    page: "page2",
    x: 640,
    y: 112,
    width: 510,
    height: 104,
    background: "#ffffff",
    textColor: "#303030",
    fontSize: 11,
    fontWeight: 400,
    lineHeight: 1.42,
    text: "The J300 LM CNC Turning Centre, a flagship model from ADL, has empowered manufacturers worldwide, with over 10,000+ machines installed globally. Known for its performance and dependability, the J300 LM is designed to meet the demands of modern production environments."
  },
  {
    id: "page3-machine-structure-heading",
    page: "page3",
    x: 38,
    y: 316,
    width: 190,
    height: 62,
    background: "#bb1f35",
    textColor: "#ffffff",
    fontSize: 22,
    fontWeight: 400,
    lineHeight: 1.03,
    text: "MACHINE\nSTRUCTURE"
  },
  {
    id: "page3-machine-structure-body",
    page: "page3",
    x: 53,
    y: 385,
    width: 155,
    height: 230,
    background: "#bb1f35",
    textColor: "#ffffff",
    fontSize: 9.4,
    fontWeight: 600,
    lineHeight: 1.28,
    text: "A class CI Gr25 construction for exceptional rigidity and long-term accuracy\n\nHeavily ribbed design enhances stiffness and dynamic rigidity\n\nExcellent vibration damping for stable and high accuracy machining\n\nX Axis: 165 mm | Z Axis: 300 mm\nX & Z Axes Rapid: 30 m/min"
  },
  {
    id: "page3-headstock-heading",
    page: "page3",
    x: 270,
    y: 52,
    width: 320,
    height: 27,
    background: "#ffffff",
    textColor: "#414141",
    fontSize: 15,
    fontWeight: 500,
    lineHeight: 1.1,
    text: "1  Headstock & Spindle"
  },
  {
    id: "page3-headstock-body",
    page: "page3",
    x: 270,
    y: 88,
    width: 324,
    height: 150,
    background: "#ffffff",
    textColor: "#424242",
    fontSize: 8.7,
    fontWeight: 400,
    lineHeight: 1.32,
    text: "• Robust headstock construction engineered to withstand heavy cutting loads while ensuring efficient heat dissipation for sustained accuracy and performance.\n• Meticulous assembly and testing of high precision spindles in a controlled class 10,000 clean room.\n• Angular contact ball bearings deliver optimum performance at higher speeds.\n• Defined and documented process of balancing, dynamic stabilisation and testing on computerised automated test rigs.\n• Cartridge type spindle construction for easy maintenance."
  },
  {
    id: "page3-chuck-heading",
    page: "page3",
    x: 262,
    y: 658,
    width: 330,
    height: 42,
    background: "#ffffff",
    textColor: "#414141",
    fontSize: 15,
    fontWeight: 500,
    lineHeight: 1.1,
    text: "2  Chuck"
  },
  {
    id: "page3-chuck-body",
    page: "page3",
    x: 262,
    y: 699,
    width: 330,
    height: 96,
    background: "#ffffff",
    textColor: "#424242",
    fontSize: 8.8,
    fontWeight: 400,
    lineHeight: 1.33,
    text: "• Chuck Size: 165 mm / (200 mm optional)\n• 3 Jaw self-centering hollow chuck\n• Metric serration (inches - optional)\n• 42 mm bar capacity"
  },
  {
    id: "page3-turret-heading",
    page: "page3",
    x: 820,
    y: 38,
    width: 340,
    height: 27,
    background: "#ffffff",
    textColor: "#414141",
    fontSize: 15,
    fontWeight: 500,
    lineHeight: 1.1,
    text: "3  Turret"
  },
  {
    id: "page3-turret-body",
    page: "page3",
    x: 820,
    y: 78,
    width: 345,
    height: 108,
    background: "#ffffff",
    textColor: "#424242",
    fontSize: 8.8,
    fontWeight: 400,
    lineHeight: 1.32,
    text: "• Bi-directional electro mechanical turret\n• Indexing in both directions helps achieve shorter indexing time\n• Robust mechanism and construction\n• Completely enclosed with oil bath lubrication\n• Three-piece coupling construction\n• Highly rigid repeatability and positioning accuracy"
  },
  {
    id: "page3-turret-standard-heading",
    page: "page3",
    x: 820,
    y: 188,
    width: 170,
    height: 16,
    background: "#3da092",
    textColor: "#ffffff",
    fontSize: 7.5,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "STANDARD"
  },
  {
    id: "page3-turret-optional-heading",
    page: "page3",
    x: 990,
    y: 188,
    width: 170,
    height: 16,
    background: "#3da092",
    textColor: "#ffffff",
    fontSize: 7.5,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "OPTIONAL"
  },
  {
    id: "page3-turret-standard-body",
    page: "page3",
    x: 820,
    y: 207,
    width: 165,
    height: 55,
    background: "#ffffff",
    textColor: "#5b5b5b",
    fontSize: 7.5,
    fontWeight: 400,
    lineHeight: 1.4,
    text: "BTP-80 - 8 Station\nBoring Bar - Ø40 mm\nTool Shank - 25 × 25 mm"
  },
  {
    id: "page3-turret-optional-body",
    page: "page3",
    x: 990,
    y: 207,
    width: 165,
    height: 55,
    background: "#ffffff",
    textColor: "#5b5b5b",
    fontSize: 7.5,
    fontWeight: 400,
    lineHeight: 1.4,
    text: "BTP - 12 Station\nBoring Bar - Ø32 mm\nTool Shank - 20 × 20 mm"
  },
  {
    id: "page3-tailstock-heading",
    page: "page3",
    x: 820,
    y: 278,
    width: 340,
    height: 27,
    background: "#ffffff",
    textColor: "#414141",
    fontSize: 15,
    fontWeight: 500,
    lineHeight: 1.1,
    text: "4  Tailstock"
  },
  {
    id: "page3-tailstock-body",
    page: "page3",
    x: 820,
    y: 304,
    width: 345,
    height: 101,
    background: "#ffffff",
    textColor: "#424242",
    fontSize: 8.8,
    fontWeight: 400,
    lineHeight: 1.32,
    text: "• Hydraulically operated quill\n• Quill and body are independently movable\n• Widely spaced guideways and heavy-duty design ensure high rigidity\n• Foot pedal or by program for quill actuation"
  },
  {
    id: "page3-tailstock-data",
    page: "page3",
    x: 820,
    y: 405,
    width: 335,
    height: 35,
    background: "#3da092",
    textColor: "#ffffff",
    fontSize: 8,
    fontWeight: 600,
    lineHeight: 1.35,
    text: "Base Travel: 135 mm | Quill Dia: 60 mm\nQuill Travel: 75 mm | Taper: MT-4"
  },
  {
    id: "page3-chip-heading",
    page: "page3",
    x: 820,
    y: 470,
    width: 340,
    height: 38,
    background: "#ffffff",
    textColor: "#414141",
    fontSize: 15,
    fontWeight: 500,
    lineHeight: 1.1,
    text: "5  Chip Disposal"
  },
  {
    id: "page3-chip-body",
    page: "page3",
    x: 820,
    y: 502,
    width: 345,
    height: 112,
    background: "#ffffff",
    textColor: "#424242",
    fontSize: 8.8,
    fontWeight: 400,
    lineHeight: 1.32,
    text: "• Chip disposal - right / rear side (with chip tray - standard)\n• Wider chip disposal area for better chip evacuation\n• Both right and rear side disposal option for better space planning and utilisation\n• Right side chip disposal with chip conveyor (optional)"
  },
  {
    id: "page3-guideways-heading",
    page: "page3",
    x: 820,
    y: 648,
    width: 340,
    height: 39,
    background: "#ffffff",
    textColor: "#414141",
    fontSize: 15,
    fontWeight: 500,
    lineHeight: 1.1,
    text: "6  Precision Ball Guideways"
  },
  {
    id: "page3-guideways-body",
    page: "page3",
    x: 820,
    y: 682,
    width: 345,
    height: 110,
    background: "#ffffff",
    textColor: "#424242",
    fontSize: 8.8,
    fontWeight: 400,
    lineHeight: 1.32,
    text: "• Hydraulically operated quill\n• Quill and body are independently movable\n• Widely spaced guideways and heavy-duty design ensure high rigidity\n• Foot pedal or by program for quill actuation"
  },
  {
    id: "page4-front-loading-heading",
    page: "page4",
    x: 640,
    y: 558,
    width: 350,
    height: 40,
    background: "#ffffff",
    textColor: "#c01f32",
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "FRONT LOADING FEATURES"
  },
  {
    id: "page4-front-loading-body",
    page: "page4",
    x: 640,
    y: 600,
    width: 350,
    height: 80,
    background: "#ffffff",
    textColor: "#404040",
    fontSize: 9.6,
    fontWeight: 400,
    lineHeight: 1.32,
    text: "• Automatic Minimum Buffer / Loading Notification\n• Plug and Play Integration With CNC Machine\n• No Pinch Points\n• Easy User Interface (Production, Count, HMI, Fault, Etc.)\n• Auto Lubrication - Maintenance Friendly"
  },
  {
    id: "page4-industry-heading",
    page: "page4",
    x: 640,
    y: 680,
    width: 350,
    height: 40,
    background: "#ffffff",
    textColor: "#c01f32",
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "INDUSTRY 4.0 - OPTIONAL"
  },
  {
    id: "page4-industry-body",
    page: "page4",
    x: 640,
    y: 722,
    width: 350,
    height: 108,
    background: "#ffffff",
    textColor: "#404040",
    fontSize: 9.5,
    fontWeight: 400,
    lineHeight: 1.3,
    text: "• Real-time visibility of machine load, temperature, and OEE performance.\n• Ensures timely maintenance with autonomous and periodic maintenance\n• Helps supervisors analyze trends by tracking performance and downtime\n• Prevents unauthorized modification"
  },
  {
    id: "page4-cutting-heading",
    page: "page4",
    x: 46,
    y: 47,
    width: 112,
    height: 55,
    background: "#3da092",
    textColor: "#ffffff",
    fontSize: 8.5,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "Cutting (External)"
  },
  {
    id: "page4-udrilling-heading",
    page: "page4",
    x: 226,
    y: 47,
    width: 112,
    height: 55,
    background: "#3da092",
    textColor: "#ffffff",
    fontSize: 8.5,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "U-Drilling"
  },
  {
    id: "page4-external-threading-heading",
    page: "page4",
    x: 400,
    y: 47,
    width: 112,
    height: 55,
    background: "#3da092",
    textColor: "#ffffff",
    fontSize: 8.2,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "External Threading"
  },
  {
    id: "page4-internal-threading-heading",
    page: "page4",
    x: 46,
    y: 231,
    width: 112,
    height: 55,
    background: "#3da092",
    textColor: "#ffffff",
    fontSize: 8.2,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "Internal Threading"
  },
  {
    id: "page4-tapping-heading",
    page: "page4",
    x: 226,
    y: 231,
    width: 112,
    height: 55,
    background: "#3da092",
    textColor: "#ffffff",
    fontSize: 8.5,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "Tapping"
  },
  {
    id: "page4-grooving-heading",
    page: "page4",
    x: 400,
    y: 231,
    width: 112,
    height: 55,
    background: "#3da092",
    textColor: "#ffffff",
    fontSize: 8.2,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "External Grooving"
  },
  {
    id: "page4-cutting-labels",
    page: "page4",
    x: 48,
    y: 87,
    width: 91,
    height: 126,
    background: "#ffffff",
    textColor: "#333333",
    fontSize: 6.4,
    fontWeight: 500,
    lineHeight: 1,
    rows: ["Material Dia (mm)", "Cutting Speed (m/min)", "Feed (mm/rev)", "Spindle Speed (rpm)", "Cutting Depth (mm)", "MRR (cm³/min)"]
  },
  {
    id: "page4-udrilling-labels",
    page: "page4",
    x: 228,
    y: 87,
    width: 91,
    height: 126,
    background: "#ffffff",
    textColor: "#333333",
    fontSize: 6.4,
    fontWeight: 500,
    lineHeight: 1,
    rows: ["Tool Dia (mm)", "Cutting Speed (m/min)", "Feed (mm/rev)", "Spindle Speed (rpm)", "Cutting Depth (mm)", "MRR (cm³/min)"]
  },
  {
    id: "page4-external-threading-labels",
    page: "page4",
    x: 402,
    y: 87,
    width: 91,
    height: 126,
    background: "#ffffff",
    textColor: "#333333",
    fontSize: 6.2,
    fontWeight: 500,
    lineHeight: 1,
    rows: ["Material Dia (mm)", "Cutting Speed (m/min)", "Feed / Pitch (mm/rev)", "Spindle Speed (rpm)", "Cutting Depth (mm)", "No. of Pass"]
  },
  {
    id: "page4-internal-threading-labels",
    page: "page4",
    x: 48,
    y: 271,
    width: 91,
    height: 126,
    background: "#ffffff",
    textColor: "#333333",
    fontSize: 6.2,
    fontWeight: 500,
    lineHeight: 1,
    rows: ["Material Dia (mm) (ID)", "Cutting Speed (m/min)", "Feed/Pitch (mm/rev)", "Spindle Speed (rpm)", "Cutting Depth (mm)", "No. of Pass"]
  },
  {
    id: "page4-tapping-labels",
    page: "page4",
    x: 228,
    y: 271,
    width: 91,
    height: 126,
    background: "#ffffff",
    textColor: "#333333",
    fontSize: 6.4,
    fontWeight: 500,
    lineHeight: 1,
    rows: ["Tap Size (mm)", "Cutting Speed (m/min)", "Feed / Pitch (mm/rev)", "Spindle Speed (rpm)", "Tapping Depth (mm)", "Material"]
  },
  {
    id: "page4-grooving-labels",
    page: "page4",
    x: 402,
    y: 271,
    width: 91,
    height: 126,
    background: "#ffffff",
    textColor: "#333333",
    fontSize: 6.4,
    fontWeight: 500,
    lineHeight: 1,
    rows: ["Material Dia (mm)", "Cutting Speed (m/min)", "Feed (mm/rev)", "Spindle Speed (rpm)", "Cutting Depth (mm)", "MRR (cm³/min)"]
  },
  {
    id: "page4-loader-spec-heading",
    page: "page4",
    x: 640,
    y: 458,
    width: 136,
    height: 28,
    background: "#ba2034",
    textColor: "#ffffff",
    fontSize: 8.5,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "Specification"
  },
  {
    id: "page4-loader-x-heading",
    page: "page4",
    x: 776,
    y: 458,
    width: 120,
    height: 28,
    background: "#ba2034",
    textColor: "#ffffff",
    fontSize: 8.5,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "X-Axis (Slide)"
  },
  {
    id: "page4-loader-y-heading",
    page: "page4",
    x: 896,
    y: 458,
    width: 128,
    height: 28,
    background: "#ba2034",
    textColor: "#ffffff",
    fontSize: 8.5,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "Y-Axis (Loader)"
  },
  {
    id: "page4-loader-swivel-heading",
    page: "page4",
    x: 1024,
    y: 458,
    width: 130,
    height: 28,
    background: "#ba2034",
    textColor: "#ffffff",
    fontSize: 8.5,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "Swivel (Deg)"
  },
  {
    id: "page4-loader-row-labels",
    page: "page4",
    x: 640,
    y: 486,
    width: 136,
    height: 66,
    background: "#ffffff",
    textColor: "#333333",
    fontSize: 8.4,
    fontWeight: 600,
    lineHeight: 1,
    rows: ["Stroke - Axis", "Speed", "Axis Controls"]
  },
  {
    id: "page4-power-torque-heading-top",
    page: "page4",
    x: 640,
    y: 54,
    width: 510,
    height: 30,
    background: "#ffffff",
    textColor: "#c01f32",
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "POWER TORQUE DIAGRAM - FANUC / SIEMENS / MITSUBISHI / SYNTEC"
  },
  {
    id: "page4-power-torque-heading-bottom",
    page: "page4",
    x: 640,
    y: 423,
    width: 510,
    height: 27,
    background: "#ffffff",
    textColor: "#c01f32",
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "POWER TORQUE DIAGRAM - FANUC / SIEMENS / MITSUBISHI / SYNTEC"
  },
  {
    id: "page4-machining-range-heading",
    page: "page4",
    x: 45,
    y: 432,
    width: 170,
    height: 55,
    background: "#eeeeee",
    textColor: "#c01f32",
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.15,
    text: "MACHINING RANGE\nDIAGRAM"
  },
  {
    id: "page4-interference-heading",
    page: "page4",
    x: 250,
    y: 432,
    width: 270,
    height: 30,
    background: "#ffffff",
    textColor: "#c01f32",
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "INTERFERENCE DIAGRAM"
  },
  {
    id: "page4-machine-layout-heading",
    page: "page4",
    x: 250,
    y: 605,
    width: 280,
    height: 32,
    background: "#ffffff",
    textColor: "#c01f32",
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.1,
    text: "MACHINE LAYOUT"
  },
  {
    id: "page4-test-data-note",
    page: "page4",
    x: 125,
    y: 392,
    width: 430,
    height: 23,
    background: "#ffffff",
    textColor: "#333333",
    fontSize: 7.2,
    fontWeight: 500,
    lineHeight: 1.1,
    text: "Data obtained from tests conducted by Ace Designers Ltd under certain boundary conditions. | Material - EN8"
  },
  {
    id: "page4-dimensions-note",
    page: "page4",
    x: 435,
    y: 816,
    width: 180,
    height: 18,
    background: "#ffffff",
    textColor: "#555555",
    fontSize: 8,
    fontWeight: 400,
    lineHeight: 1.1,
    text: "all dimensions are in mm"
  }
];

const kannadaPageTextById = {
  "page1-optional-features-heading": "ಐಚ್ಛಿಕ ವೈಶಿಷ್ಟ್ಯಗಳು",
  "page1-optional-features-body": "ವಿದ್ಯುತ್ ಕ್ಯಾಬಿನೆಟ್‌ಗಾಗಿ AC ಘಟಕ\nMitsubishi / Syntec / Siemens CNC ನಿಯಂತ್ರಕ",
  "page1-weight-note": "(ಪ್ಯಾಕಿಂಗ್ ಮತ್ತು ವಿಶೇಷ ಪರಿಕರಗಳಿಲ್ಲದೆ)",
  "page2-engineered-continuity": "ಎಂಜಿನಿಯರ್ಡ್\nಕಂಟಿನ್ಯೂಟಿ",
  "page2-company-intro": "ವಿಶ್ವಾಸಾರ್ಹ ಯಂತ್ರಗಳನ್ನು ತಯಾರಿಸುವ ಅನೇಕ ಎಂಜಿನಿಯರಿಂಗ್ ಕಂಪನಿಗಳಿವೆ.\n\nಆದರೆ ಏಸ್ ಮೈಕ್ರೋಮ್ಯಾಟಿಕ್ ಯಂತ್ರಕ್ಕಿಂತ ಹೆಚ್ಚಿನದನ್ನು ಒದಗಿಸುತ್ತದೆ: ನಿರಂತರ ಉತ್ಪಾದನೆ.\n\nನಿಖರತೆ, ಪುನರಾವರ್ತನೆ ಮತ್ತು ವಿಶ್ವಾಸಾರ್ಹ ಕಾರ್ಯಕ್ಷಮತೆಗೆ ವಿನ್ಯಾಸಗೊಳಿಸಿದ ಆಧುನಿಕ ಉತ್ಪಾದನಾ ಮೂಲಸೌಕರ್ಯದಿಂದ, ಗ್ರಾಹಕರ ಕಾರ್ಯಾಚರಣೆ ಕನಿಷ್ಠ ವ್ಯತ್ಯಯದೊಂದಿಗೆ ನಿರಂತರವಾಗಿ ಸಾಗುವಂತೆ ನಾವು ಖಚಿತಪಡಿಸುತ್ತೇವೆ.\n\nಉತ್ಪಾದನೆ ಸಾಗಿದರೆ, ವ್ಯವಹಾರವೂ ಸಾಗುತ್ತದೆ.",
  "page2-advanced-heading": "ಅತ್ಯಾಧುನಿಕ\nಉತ್ಪಾದನಾ\nಸಾಮರ್ಥ್ಯ",
  "page2-capability-list": "3,00,000+ ಚದರ ಅಡಿ ಅತ್ಯಾಧುನಿಕ ಅಸೆಂಬ್ಲಿ ಸೌಲಭ್ಯ - ಹೆಚ್ಚಿನ ನಿಖರತೆ ಮತ್ತು ವಿಸ್ತರಿಸಬಹುದಾದ ಉತ್ಪಾದನೆಗಾಗಿ\n\nಮಾಲಿನ್ಯ ನಿಯಂತ್ರಿತ ಸ್ಪಿಂಡಲ್ ಅಸೆಂಬ್ಲಿಗಾಗಿ ಕ್ಲಾಸ್ 10,000 ಕ್ಲೀನ್ ರೂಮ್\n\nಸ್ಥಿರ ಉತ್ಪಾದನೆಗಾಗಿ ಲೀನ್, ಫ್ಲೋ-ಲೈನ್ ಟರ್ನಿಂಗ್ ಸೆಂಟರ್ ಅಸೆಂಬ್ಲಿ\n\nಸ್ಥಿರ ಗುಣಮಟ್ಟ ಮತ್ತು ವಿಶ್ವಾಸಾರ್ಹ ವಿತರಣೆಗೆ 4-ಗಂಟೆಯ ಟ್ಯಾಕ್ಟ್ ಸಮಯ\n\nCNC ಟರ್ನಿಂಗ್ ಸೆಂಟರ್‌ಗಳು, ಮಷಿನಿಂಗ್ ಸೆಂಟರ್‌ಗಳು ಮತ್ತು CNC ಮಲ್ಟಿ ಆಕ್ಸಿಸ್ ಯಂತ್ರಗಳ ಸಮಗ್ರ ಶ್ರೇಣಿ",
  "page2-product-intro": "ADL ನ ಪ್ರಮುಖ ಮಾದರಿಯಾದ J300 LM CNC ಟರ್ನಿಂಗ್ ಸೆಂಟರ್ ಜಾಗತಿಕವಾಗಿ 10,000ಕ್ಕೂ ಹೆಚ್ಚು ಯಂತ್ರಗಳೊಂದಿಗೆ ತಯಾರಕರಿಗೆ ಶಕ್ತಿ ನೀಡಿದೆ. ಕಾರ್ಯಕ್ಷಮತೆ ಮತ್ತು ವಿಶ್ವಾಸಾರ್ಹತೆಗೆ ಹೆಸರಾದ J300 LM ಅನ್ನು ಆಧುನಿಕ ಉತ್ಪಾದನಾ ಪರಿಸರಗಳ ಬೇಡಿಕೆಗಳನ್ನು ಪೂರೈಸಲು ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ.",
  "page3-machine-structure-heading": "ಯಂತ್ರದ\nರಚನೆ",
  "page3-machine-structure-body": "ಅತ್ಯುತ್ತಮ ದೃಢತೆ ಮತ್ತು ದೀರ್ಘಕಾಲೀನ ನಿಖರತೆಗೆ ಕ್ಲಾಸ್ CI Gr25 ನಿರ್ಮಾಣ\n\nಭಾರವಾದ ರಿಬ್ ವಿನ್ಯಾಸವು ಗಟ್ಟಿತನ ಮತ್ತು ಚಲನಾತ್ಮಕ ದೃಢತೆಯನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ\n\nಸ್ಥಿರ ಮತ್ತು ಹೆಚ್ಚಿನ ನಿಖರ ಮಷಿನಿಂಗ್‌ಗೆ ಉತ್ತಮ ಕಂಪನ ಶಮನ\n\nX ಅಕ್ಷ: 165 mm | Z ಅಕ್ಷ: 300 mm\nX ಮತ್ತು Z ಅಕ್ಷ ರ್ಯಾಪಿಡ್: 30 m/min",
  "page3-headstock-heading": "1  ಹೆಡ್‌ಸ್ಟಾಕ್ ಮತ್ತು ಸ್ಪಿಂಡಲ್",
  "page3-headstock-body": "• ಭಾರವಾದ ಕತ್ತರಿಸುವ ಹೊರೆಗಳನ್ನು ತಡೆಯುವ ದೃಢ ಹೆಡ್‌ಸ್ಟಾಕ್ ನಿರ್ಮಾಣ ಮತ್ತು ಪರಿಣಾಮಕಾರಿ ಉಷ್ಣ ವಿಸರ್ಜನೆ.\n• ನಿಯಂತ್ರಿತ ಕ್ಲಾಸ್ 10,000 ಕ್ಲೀನ್ ರೂಮ್‌ನಲ್ಲಿ ಉನ್ನತ ನಿಖರ ಸ್ಪಿಂಡಲ್‌ಗಳ ಅಸೆಂಬ್ಲಿ ಮತ್ತು ಪರೀಕ್ಷೆ.\n• ಹೆಚ್ಚಿನ ವೇಗದಲ್ಲಿ ಉತ್ತಮ ಕಾರ್ಯಕ್ಷಮತೆಗೆ ಆಂಗ್ಯುಲರ್ ಕಾಂಟಾಕ್ಟ್ ಬಾಲ್ ಬೇರಿಂಗ್‌ಗಳು.\n• ಕಂಪ್ಯೂಟರೀಕೃತ ಸ್ವಯಂಚಾಲಿತ ಪರೀಕ್ಷಾ ರಿಗ್‌ಗಳಲ್ಲಿ ಬ್ಯಾಲೆನ್ಸಿಂಗ್, ಸ್ಥಿರೀಕರಣ ಮತ್ತು ಪರೀಕ್ಷೆ.\n• ಸುಲಭ ನಿರ್ವಹಣೆಗೆ ಕಾರ್ಟ್ರಿಡ್ಜ್ ಮಾದರಿಯ ಸ್ಪಿಂಡಲ್ ನಿರ್ಮಾಣ.",
  "page3-chuck-heading": "2  ಚಕ್",
  "page3-chuck-body": "• ಚಕ್ ಗಾತ್ರ: 165 mm / (200 mm ಐಚ್ಛಿಕ)\n• 3-ಜಾ ಸ್ವಯಂ-ಕೇಂದ್ರೀಕೃತ ಹಾಲೋ ಚಕ್\n• ಮೆಟ್ರಿಕ್ ಸೆರೇಶನ್ (ಇಂಚು - ಐಚ್ಛಿಕ)\n• 42 mm ಬಾರ್ ಸಾಮರ್ಥ್ಯ",
  "page3-turret-heading": "3  ಟರೆಟ್",
  "page3-turret-body": "• ದ್ವಿದಿಶ ಎಲೆಕ್ಟ್ರೋ-ಮೆಕ್ಯಾನಿಕಲ್ ಟರೆಟ್\n• ಎರಡೂ ದಿಕ್ಕಿನ ಇಂಡೆಕ್ಸಿಂಗ್ ಕಡಿಮೆ ಇಂಡೆಕ್ಸಿಂಗ್ ಸಮಯಕ್ಕೆ ಸಹಕಾರಿ\n• ದೃಢ ಯಾಂತ್ರಿಕ ವ್ಯವಸ್ಥೆ ಮತ್ತು ನಿರ್ಮಾಣ\n• ಆಯಿಲ್ ಬಾತ್ ಸ್ನೇಹನದೊಂದಿಗೆ ಸಂಪೂರ್ಣ ಮುಚ್ಚಿದ ವಿನ್ಯಾಸ\n• ಮೂರು ತುಂಡಿನ ಕಪ್ಲಿಂಗ್ ನಿರ್ಮಾಣ\n• ಹೆಚ್ಚಿನ ಪುನರಾವರ್ತನೆ ಮತ್ತು ಸ್ಥಾನ ನಿಖರತೆ",
  "page3-turret-standard-heading": "ಪ್ರಮಾಣಿತ",
  "page3-turret-optional-heading": "ಐಚ್ಛಿಕ",
  "page3-turret-standard-body": "BTP-80 - 8 ಸ್ಟೇಷನ್\nಬೋರಿಂಗ್ ಬಾರ್ - Ø40 mm\nಟೂಲ್ ಶ್ಯಾಂಕ್ - 25 × 25 mm",
  "page3-turret-optional-body": "BTP - 12 ಸ್ಟೇಷನ್\nಬೋರಿಂಗ್ ಬಾರ್ - Ø32 mm\nಟೂಲ್ ಶ್ಯಾಂಕ್ - 20 × 20 mm",
  "page3-tailstock-heading": "4  ಟೇಲ್‌ಸ್ಟಾಕ್",
  "page3-tailstock-body": "• ಹೈಡ್ರಾಲಿಕ್ ಚಾಲಿತ ಕ್ವಿಲ್\n• ಕ್ವಿಲ್ ಮತ್ತು ಬಾಡಿ ಸ್ವತಂತ್ರವಾಗಿ ಚಲಿಸಬಲ್ಲವು\n• ಅಗಲವಾದ ಗೈಡ್‌ವೇಗಳು ಮತ್ತು ಹೆವಿ-ಡ್ಯೂಟಿ ವಿನ್ಯಾಸವು ಹೆಚ್ಚಿನ ದೃಢತೆಯನ್ನು ಒದಗಿಸುತ್ತದೆ\n• ಕ್ವಿಲ್ ಕಾರ್ಯಾಚರಣೆಗೆ ಫುಟ್ ಪೆಡಲ್ ಅಥವಾ ಪ್ರೋಗ್ರಾಮ್ ನಿಯಂತ್ರಣ",
  "page3-tailstock-data": "ಬೇಸ್ ಟ್ರಾವೆಲ್: 135 mm | ಕ್ವಿಲ್ ವ್ಯಾಸ: 60 mm\nಕ್ವಿಲ್ ಟ್ರಾವೆಲ್: 75 mm | ಟೇಪರ್: MT-4",
  "page3-chip-heading": "5  ಚಿಪ್ ವಿಲೇವಾರಿ",
  "page3-chip-body": "• ಚಿಪ್ ವಿಲೇವಾರಿ - ಬಲ / ಹಿಂಭಾಗ (ಚಿಪ್ ಟ್ರೇ - ಪ್ರಮಾಣಿತ)\n• ಉತ್ತಮ ಚಿಪ್ ತೆರವುಗಾಗಿ ವಿಶಾಲ ವಿಲೇವಾರಿ ಪ್ರದೇಶ\n• ಉತ್ತಮ ಸ್ಥಳ ಯೋಜನೆಗೆ ಬಲ ಮತ್ತು ಹಿಂಭಾಗ ವಿಲೇವಾರಿ ಆಯ್ಕೆ\n• ಚಿಪ್ ಕನ್ವೇಯರ್ ಸಹಿತ ಬಲಭಾಗ ವಿಲೇವಾರಿ (ಐಚ್ಛಿಕ)",
  "page3-guideways-heading": "6  ನಿಖರ ಬಾಲ್ ಗೈಡ್‌ವೇಗಳು",
  "page3-guideways-body": "• ಹೈಡ್ರಾಲಿಕ್ ಚಾಲಿತ ಕ್ವಿಲ್\n• ಕ್ವಿಲ್ ಮತ್ತು ಬಾಡಿ ಸ್ವತಂತ್ರವಾಗಿ ಚಲಿಸಬಲ್ಲವು\n• ಅಗಲವಾದ ಗೈಡ್‌ವೇಗಳು ಮತ್ತು ಹೆವಿ-ಡ್ಯೂಟಿ ವಿನ್ಯಾಸವು ಹೆಚ್ಚಿನ ದೃಢತೆಯನ್ನು ಒದಗಿಸುತ್ತದೆ\n• ಕ್ವಿಲ್ ಕಾರ್ಯಾಚರಣೆಗೆ ಫುಟ್ ಪೆಡಲ್ ಅಥವಾ ಪ್ರೋಗ್ರಾಮ್ ನಿಯಂತ್ರಣ",
  "page4-front-loading-heading": "ಫ್ರಂಟ್ ಲೋಡಿಂಗ್ ವೈಶಿಷ್ಟ್ಯಗಳು",
  "page4-front-loading-body": "• ಸ್ವಯಂಚಾಲಿತ ಕನಿಷ್ಠ ಬಫರ್ / ಲೋಡಿಂಗ್ ಸೂಚನೆ\n• CNC ಯಂತ್ರದೊಂದಿಗೆ ಪ್ಲಗ್ ಅಂಡ್ ಪ್ಲೇ ಏಕೀಕರಣ\n• ಪಿಂಚ್ ಪಾಯಿಂಟ್‌ಗಳಿಲ್ಲ\n• ಸುಲಭ ಬಳಕೆದಾರ ಇಂಟರ್‌ಫೇಸ್ (ಉತ್ಪಾದನೆ, ಎಣಿಕೆ, HMI, ದೋಷ ಇತ್ಯಾದಿ)\n• ಸ್ವಯಂ ಸ್ನೇಹನ - ನಿರ್ವಹಣೆ ಸ್ನೇಹಿ",
  "page4-industry-heading": "ಇಂಡಸ್ಟ್ರಿ 4.0 - ಐಚ್ಛಿಕ",
  "page4-industry-body": "• ಯಂತ್ರದ ಲೋಡ್, ತಾಪಮಾನ ಮತ್ತು OEE ಕಾರ್ಯಕ್ಷಮತೆಯ ನೈಜ-ಸಮಯದ ದೃಶ್ಯತೆ\n• ಸ್ವಯಂಚಾಲಿತ ಮತ್ತು ಅವಧಿಕ ನಿರ್ವಹಣೆಯಿಂದ ಸಮಯೋಚಿತ ಸೇವೆ\n• ಕಾರ್ಯಕ್ಷಮತೆ ಮತ್ತು ಡೌನ್‌ಟೈಮ್ ಟ್ರೆಂಡ್‌ಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲು ಮೇಲ್ವಿಚಾರಕರಿಗೆ ಸಹಾಯ\n• ಅನಧಿಕೃತ ಬದಲಾವಣೆಗಳನ್ನು ತಡೆಯುತ್ತದೆ"
  ,"page4-cutting-heading": "ಕತ್ತರಿಸುವಿಕೆ (ಬಾಹ್ಯ)",
  "page4-udrilling-heading": "U-ಡ್ರಿಲ್ಲಿಂಗ್",
  "page4-external-threading-heading": "ಬಾಹ್ಯ ಥ್ರೆಡಿಂಗ್",
  "page4-internal-threading-heading": "ಆಂತರಿಕ ಥ್ರೆಡಿಂಗ್",
  "page4-tapping-heading": "ಟ್ಯಾಪಿಂಗ್",
  "page4-grooving-heading": "ಬಾಹ್ಯ ಗ್ರೂವಿಂಗ್",
  "page4-loader-spec-heading": "ವಿಶೇಷಣ",
  "page4-loader-x-heading": "X-ಅಕ್ಷ (ಸ್ಲೈಡ್)",
  "page4-loader-y-heading": "Y-ಅಕ್ಷ (ಲೋಡರ್)",
  "page4-loader-swivel-heading": "ಸ್ವಿವೆಲ್ (ಡಿಗ್ರಿ)",
  "page4-power-torque-heading-top": "ಶಕ್ತಿ-ಟಾರ್ಕ್ ರೇಖಾಚಿತ್ರ - FANUC / SIEMENS / MITSUBISHI / SYNTEC",
  "page4-power-torque-heading-bottom": "ಶಕ್ತಿ-ಟಾರ್ಕ್ ರೇಖಾಚಿತ್ರ - FANUC / SIEMENS / MITSUBISHI / SYNTEC",
  "page4-machining-range-heading": "ಮಷಿನಿಂಗ್ ವ್ಯಾಪ್ತಿ\nರೇಖಾಚಿತ್ರ",
  "page4-interference-heading": "ಹಸ್ತಕ್ಷೇಪ ರೇಖಾಚಿತ್ರ",
  "page4-machine-layout-heading": "ಯಂತ್ರ ವಿನ್ಯಾಸ",
  "page4-test-data-note": "ನಿರ್ದಿಷ್ಟ ಗಡಿ ಪರಿಸ್ಥಿತಿಗಳಲ್ಲಿ Ace Designers Ltd ನಡೆಸಿದ ಪರೀಕ್ಷೆಗಳಿಂದ ಪಡೆದ ದತ್ತಾಂಶ. | ವಸ್ತು - EN8",
  "page4-dimensions-note": "ಎಲ್ಲಾ ಆಯಾಮಗಳು mm ನಲ್ಲಿ"
};

const hindiPageTextById = {
  "page1-optional-features-heading": "वैकल्पिक विशेषताएँ",
  "page1-optional-features-body": "विद्युत कैबिनेट के लिए AC इकाई\nMitsubishi / Syntec / Siemens CNC नियंत्रक",
  "page1-weight-note": "(पैकिंग और विशेष सहायक उपकरण के बिना)",
  "page2-engineered-continuity": "अभियांत्रिक\nनिरंतरता",
  "page2-company-intro": "कई इंजीनियरिंग कंपनियाँ विश्वसनीय मशीनें प्रदान करती हैं।\n\nAce Micromatic मशीन से आगे बढ़कर निर्बाध विनिर्माण प्रदान करती है।\n\nपरिशुद्धता, पुनरावृत्ति और विश्वसनीय प्रदर्शन के लिए तैयार उन्नत विनिर्माण आधारभूत संरचना से हम ग्राहकों के संचालन को न्यूनतम व्यवधान के साथ निरंतर चलाते हैं।\n\nक्योंकि विनिर्माण चलता है तो व्यवसाय भी चलता है।",
  "page2-advanced-heading": "उन्नत\nविनिर्माण\nक्षमता",
  "page2-capability-list": "उच्च-परिशुद्धता और विस्तार योग्य उत्पादन के लिए 3,00,000+ वर्ग फुट की अत्याधुनिक असेंबली सुविधा\n\nदूषण-नियंत्रित स्पिंडल असेंबली के लिए क्लास 10,000 क्लीन रूम\n\nसमान उत्पादन के लिए टर्निंग सेंटर की लीन फ्लो-लाइन असेंबली\n\nसमान गुणवत्ता और विश्वसनीय आपूर्ति के लिए 4 घंटे का टैक्ट समय\n\nCNC टर्निंग सेंटर, CNC मशीनिंग सेंटर और CNC बहु-अक्ष मशीनों की व्यापक श्रेणी",
  "page2-product-intro": "ADL का प्रमुख मॉडल J300 LM CNC टर्निंग सेंटर विश्वभर में 10,000+ स्थापित मशीनों के साथ निर्माताओं को सशक्त बनाता है। प्रदर्शन और विश्वसनीयता के लिए प्रसिद्ध J300 LM आधुनिक उत्पादन वातावरण की आवश्यकताओं के अनुरूप बनाया गया है।",
  "page3-machine-structure-heading": "मशीन\nसंरचना",
  "page3-machine-structure-body": "असाधारण दृढ़ता और दीर्घकालीन परिशुद्धता के लिए CI Gr25 श्रेणी का निर्माण\n\nभारी रिब डिजाइन स्थिर और गतिशील दृढ़ता बढ़ाता है\n\nस्थिर, उच्च-परिशुद्धता मशीनिंग के लिए उत्कृष्ट कंपन अवमंदन\n\nX अक्ष: 165 mm | Z अक्ष: 300 mm\nX और Z अक्ष रैपिड: 30 m/min",
  "page3-headstock-heading": "1  हेडस्टॉक और स्पिंडल",
  "page3-headstock-body": "• भारी कटिंग भार सहने और प्रभावी ऊष्मा विसर्जन के लिए मजबूत हेडस्टॉक निर्माण।\n• नियंत्रित क्लास 10,000 क्लीन रूम में उच्च-परिशुद्धता स्पिंडल की असेंबली और जाँच।\n• उच्च गति पर सर्वोत्तम प्रदर्शन के लिए एंगुलर कॉन्टैक्ट बॉल बेयरिंग।\n• कंप्यूटरीकृत स्वचालित परीक्षण रिग पर संतुलन, गतिशील स्थिरीकरण और परीक्षण।\n• आसान रखरखाव के लिए कार्ट्रिज प्रकार स्पिंडल निर्माण।",
  "page3-chuck-heading": "2  चक",
  "page3-chuck-body": "• चक आकार: 165 mm / (200 mm वैकल्पिक)\n• 3-जॉ स्व-केंद्रित खोखला चक\n• मीट्रिक सेरेशन (इंच - वैकल्पिक)\n• 42 mm बार क्षमता",
  "page3-turret-heading": "3  टरेट",
  "page3-turret-body": "• द्विदिश इलेक्ट्रो-मैकेनिकल टरेट\n• दोनों दिशाओं में इंडेक्सिंग से कम इंडेक्सिंग समय\n• मजबूत तंत्र और निर्माण\n• ऑयल बाथ स्नेहन सहित पूर्णतः बंद डिजाइन\n• तीन-खंड कपलिंग निर्माण\n• उच्च पुनरावृत्ति और पोजिशनिंग परिशुद्धता",
  "page3-turret-standard-heading": "मानक",
  "page3-turret-optional-heading": "वैकल्पिक",
  "page3-turret-standard-body": "BTP-80 - 8 स्टेशन\nबोरिंग बार - Ø40 mm\nटूल शैंक - 25 × 25 mm",
  "page3-turret-optional-body": "BTP - 12 स्टेशन\nबोरिंग बार - Ø32 mm\nटूल शैंक - 20 × 20 mm",
  "page3-tailstock-heading": "4  टेलस्टॉक",
  "page3-tailstock-body": "• हाइड्रोलिक संचालित क्विल\n• क्विल और बॉडी स्वतंत्र रूप से चल सकते हैं\n• चौड़े गाइडवे और भारी-कार्य डिजाइन उच्च दृढ़ता देते हैं\n• क्विल संचालन के लिए फुट पेडल या प्रोग्राम नियंत्रण",
  "page3-tailstock-data": "बेस यात्रा: 135 mm | क्विल व्यास: 60 mm\nक्विल यात्रा: 75 mm | टेपर: MT-4",
  "page3-chip-heading": "5  चिप निकासी",
  "page3-chip-body": "• चिप निकासी - दायाँ / पीछे (चिप ट्रे - मानक)\n• बेहतर चिप निकासी के लिए चौड़ा क्षेत्र\n• बेहतर स्थान उपयोग के लिए दाएँ और पीछे निकासी विकल्प\n• चिप कन्वेयर सहित दाईं ओर निकासी (वैकल्पिक)",
  "page3-guideways-heading": "6  परिशुद्ध बॉल गाइडवे",
  "page3-guideways-body": "• हाइड्रोलिक संचालित क्विल\n• क्विल और बॉडी स्वतंत्र रूप से चल सकते हैं\n• चौड़े गाइडवे और भारी-कार्य डिजाइन उच्च दृढ़ता देते हैं\n• क्विल संचालन के लिए फुट पेडल या प्रोग्राम नियंत्रण",
  "page4-front-loading-heading": "फ्रंट लोडिंग विशेषताएँ",
  "page4-front-loading-body": "• स्वचालित न्यूनतम बफर / लोडिंग सूचना\n• CNC मशीन के साथ प्लग-एंड-प्ले एकीकरण\n• कोई पिंच बिंदु नहीं\n• सरल उपयोगकर्ता इंटरफेस (उत्पादन, गणना, HMI, दोष आदि)\n• स्वचालित स्नेहन - रखरखाव अनुकूल",
  "page4-industry-heading": "उद्योग 4.0 - वैकल्पिक",
  "page4-industry-body": "• मशीन भार, तापमान और OEE प्रदर्शन की वास्तविक समय दृश्यता\n• स्वायत्त और आवधिक रखरखाव से समय पर सेवा\n• प्रदर्शन और बंद समय के रुझान का विश्लेषण\n• अनधिकृत परिवर्तन रोकता है",
  "page4-cutting-heading": "कटिंग (बाहरी)",
  "page4-udrilling-heading": "U-ड्रिलिंग",
  "page4-external-threading-heading": "बाहरी थ्रेडिंग",
  "page4-internal-threading-heading": "आंतरिक थ्रेडिंग",
  "page4-tapping-heading": "टैपिंग",
  "page4-grooving-heading": "बाहरी ग्रूविंग",
  "page4-loader-spec-heading": "विनिर्देश",
  "page4-loader-x-heading": "X-अक्ष (स्लाइड)",
  "page4-loader-y-heading": "Y-अक्ष (लोडर)",
  "page4-loader-swivel-heading": "स्विवेल (डिग्री)",
  "page4-power-torque-heading-top": "शक्ति-टॉर्क आरेख - FANUC / SIEMENS / MITSUBISHI / SYNTEC",
  "page4-power-torque-heading-bottom": "शक्ति-टॉर्क आरेख - FANUC / SIEMENS / MITSUBISHI / SYNTEC",
  "page4-machining-range-heading": "मशीनिंग सीमा\nआरेख",
  "page4-interference-heading": "हस्तक्षेप आरेख",
  "page4-machine-layout-heading": "मशीन विन्यास",
  "page4-test-data-note": "निर्धारित सीमा स्थितियों में Ace Designers Ltd द्वारा किए गए परीक्षणों से प्राप्त आँकड़े। | सामग्री - EN8",
  "page4-dimensions-note": "सभी आयाम mm में हैं"
};

const kannadaRowsById = {
  "page4-cutting-labels": ["ವಸ್ತು ವ್ಯಾಸ (mm)", "ಕತ್ತರಿಸುವ ವೇಗ (m/min)", "ಫೀಡ್ (mm/rev)", "ಸ್ಪಿಂಡಲ್ ವೇಗ (rpm)", "ಕತ್ತರಿಸುವ ಆಳ (mm)", "MRR (cm³/min)"],
  "page4-udrilling-labels": ["ಟೂಲ್ ವ್ಯಾಸ (mm)", "ಕತ್ತರಿಸುವ ವೇಗ (m/min)", "ಫೀಡ್ (mm/rev)", "ಸ್ಪಿಂಡಲ್ ವೇಗ (rpm)", "ಕತ್ತರಿಸುವ ಆಳ (mm)", "MRR (cm³/min)"],
  "page4-external-threading-labels": ["ವಸ್ತು ವ್ಯಾಸ (mm)", "ಕತ್ತರಿಸುವ ವೇಗ (m/min)", "ಫೀಡ್ / ಪಿಚ್ (mm/rev)", "ಸ್ಪಿಂಡಲ್ ವೇಗ (rpm)", "ಕತ್ತರಿಸುವ ಆಳ (mm)", "ಪಾಸ್ ಸಂಖ್ಯೆ"],
  "page4-internal-threading-labels": ["ವಸ್ತು ವ್ಯಾಸ (mm) (ID)", "ಕತ್ತರಿಸುವ ವೇಗ (m/min)", "ಫೀಡ್ / ಪಿಚ್ (mm/rev)", "ಸ್ಪಿಂಡಲ್ ವೇಗ (rpm)", "ಕತ್ತರಿಸುವ ಆಳ (mm)", "ಪಾಸ್ ಸಂಖ್ಯೆ"],
  "page4-tapping-labels": ["ಟ್ಯಾಪ್ ಗಾತ್ರ (mm)", "ಕತ್ತರಿಸುವ ವೇಗ (m/min)", "ಫೀಡ್ / ಪಿಚ್ (mm/rev)", "ಸ್ಪಿಂಡಲ್ ವೇಗ (rpm)", "ಟ್ಯಾಪಿಂಗ್ ಆಳ (mm)", "ವಸ್ತು"],
  "page4-grooving-labels": ["ವಸ್ತು ವ್ಯಾಸ (mm)", "ಕತ್ತರಿಸುವ ವೇಗ (m/min)", "ಫೀಡ್ (mm/rev)", "ಸ್ಪಿಂಡಲ್ ವೇಗ (rpm)", "ಕತ್ತರಿಸುವ ಆಳ (mm)", "MRR (cm³/min)"],
  "page4-loader-row-labels": ["ಸ್ಟ್ರೋಕ್ - ಅಕ್ಷ", "ವೇಗ", "ಅಕ್ಷ ನಿಯಂತ್ರಣಗಳು"]
};

const hindiRowsById = {
  "page4-cutting-labels": ["सामग्री व्यास (mm)", "कटिंग गति (m/min)", "फीड (mm/rev)", "स्पिंडल गति (rpm)", "कटिंग गहराई (mm)", "MRR (cm³/min)"],
  "page4-udrilling-labels": ["टूल व्यास (mm)", "कटिंग गति (m/min)", "फीड (mm/rev)", "स्पिंडल गति (rpm)", "कटिंग गहराई (mm)", "MRR (cm³/min)"],
  "page4-external-threading-labels": ["सामग्री व्यास (mm)", "कटिंग गति (m/min)", "फीड / पिच (mm/rev)", "स्पिंडल गति (rpm)", "कटिंग गहराई (mm)", "पास संख्या"],
  "page4-internal-threading-labels": ["सामग्री व्यास (mm) (ID)", "कटिंग गति (m/min)", "फीड / पिच (mm/rev)", "स्पिंडल गति (rpm)", "कटिंग गहराई (mm)", "पास संख्या"],
  "page4-tapping-labels": ["टैप आकार (mm)", "कटिंग गति (m/min)", "फीड / पिच (mm/rev)", "स्पिंडल गति (rpm)", "टैपिंग गहराई (mm)", "सामग्री"],
  "page4-grooving-labels": ["सामग्री व्यास (mm)", "कटिंग गति (m/min)", "फीड (mm/rev)", "स्पिंडल गति (rpm)", "कटिंग गहराई (mm)", "MRR (cm³/min)"],
  "page4-loader-row-labels": ["स्ट्रोक - अक्ष", "गति", "अक्ष नियंत्रण"]
};

export const j300KannadaPageTextBlocks = j300EnglishPageTextBlocks.map((block) => ({
  ...block,
  text: kannadaPageTextById[block.id] || block.text,
  rows: kannadaRowsById[block.id] || block.rows
}));

export const j300HindiPageTextBlocks = j300EnglishPageTextBlocks.map((block) => ({
  ...block,
  text: hindiPageTextById[block.id] || block.text,
  rows: hindiRowsById[block.id] || block.rows
}));

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function translateKnownList(items, english, translated, alternateLists = [], customTranslations = []) {
  return (items || []).map((item) => {
    const wanted = normalize(item);
    const sourceLists = [english, ...alternateLists];
    for (const sourceList of sourceLists) {
      const sourceIndex = sourceList.findIndex((value) => normalize(value) === wanted);
      if (sourceIndex >= 0) {
        return translated[sourceIndex] ?? item;
      }
    }
    const customMatch = customTranslations.find((entry) =>
      (entry.aliases || []).some((alias) => normalize(alias) === wanted)
    );
    if (customMatch) {
      return customMatch.value;
    }
    return item;
  });
}

function translateKnownValue(value, english, translated, alternateLists = []) {
  const wanted = normalize(value);
  const sourceLists = [english, ...alternateLists];
  for (const sourceList of sourceLists) {
    const sourceIndex = sourceList.findIndex((candidate) => normalize(candidate) === wanted);
    if (sourceIndex >= 0) {
      return translated[sourceIndex] ?? value;
    }
  }
  return value;
}

export function translateJ300CatalogWithBuiltInDictionary(catalog, targetLanguage) {
  const normalizedTarget = String(targetLanguage || "").trim().toLowerCase();
  const languagePack = normalizedTarget === "english"
    ? {
        language: "English",
        features: englishFeatures,
        standardAccessories: englishStandardAccessories,
        optionalAccessories: englishOptionalAccessories,
        sectionTitles: englishSectionTitles,
        specLabels: englishSpecLabels,
        legalNote: englishLegalNote,
        machineCategory: "CNC Turning Center",
        specificationsTitle: "Specifications",
        sectionLabels: {
          features: "Features",
          standardAccessories: "Standard Accessories",
          optionalAccessories: "Optional Accessories",
          note: "Note"
        },
        pageTextBlocks: j300EnglishPageTextBlocks,
        customTranslations: customItemTranslations.English
      }
    : normalizedTarget === "kannada"
    ? {
        language: "Kannada",
        features: kannadaFeatures,
        standardAccessories: kannadaStandardAccessories,
        optionalAccessories: kannadaOptionalAccessories,
        sectionTitles: kannadaSectionTitles,
        specLabels: kannadaSpecLabels,
        legalNote: kannadaLegalNote,
        machineCategory: "ಸಿಎನ್‌ಸಿ ಟರ್ನಿಂಗ್ ಸೆಂಟರ್",
        specificationsTitle: "ವಿಶೇಷಣಗಳು",
        sectionLabels: {
          features: "ವೈಶಿಷ್ಟ್ಯಗಳು",
          standardAccessories: "ಪ್ರಮಾಣಿತ ಪರಿಕರಗಳು",
          optionalAccessories: "ಐಚ್ಛಿಕ ಪರಿಕರಗಳು",
          note: "ಸೂಚನೆ"
        },
        pageTextBlocks: j300KannadaPageTextBlocks,
        customTranslations: customItemTranslations.Kannada
      }
    : normalizedTarget === "hindi"
      ? {
          language: "Hindi",
          features: hindiFeatures,
          standardAccessories: hindiStandardAccessories,
          optionalAccessories: hindiOptionalAccessories,
          sectionTitles: hindiSectionTitles,
          specLabels: hindiSpecLabels,
          legalNote: hindiLegalNote,
          machineCategory: "CNC टर्निंग सेंटर",
          specificationsTitle: "विनिर्देश",
          sectionLabels: {
            features: "विशेषताएँ",
            standardAccessories: "मानक सहायक उपकरण",
            optionalAccessories: "वैकल्पिक सहायक उपकरण",
            note: "टिप्पणी"
          },
          pageTextBlocks: j300HindiPageTextBlocks,
          customTranslations: customItemTranslations.Hindi
        }
      : null;

  if (!languagePack) {
    return null;
  }

  const translatedSections = (catalog.specSections || []).map((section, sectionIndex) => ({
    ...section,
    title: translateKnownValue(
      section.title,
      [englishSectionTitles[sectionIndex]],
      [languagePack.sectionTitles[sectionIndex]],
      [[kannadaSectionTitles[sectionIndex]], [hindiSectionTitles[sectionIndex]]]
    ),
    items: (section.items || []).map((item, itemIndex) => ({
      ...item,
      label: translateKnownValue(
        item.label,
        [englishSpecLabels[sectionIndex]?.[itemIndex]],
        [languagePack.specLabels[sectionIndex]?.[itemIndex]],
        [[kannadaSpecLabels[sectionIndex]?.[itemIndex]], [hindiSpecLabels[sectionIndex]?.[itemIndex]]]
      )
    }))
  }));

  return {
    ...catalog,
    language: languagePack.language,
    machineCategory: ["CNC Turning Center", "ಸಿಎನ್‌ಸಿ ಟರ್ನಿಂಗ್ ಸೆಂಟರ್", "CNC टर्निंग सेंटर"].some((value) => normalize(value) === normalize(catalog.machineCategory))
      ? languagePack.machineCategory
      : catalog.machineCategory,
    specificationsTitle: ["Specifications", "ವಿಶೇಷಣಗಳು", "विनिर्देश"].some((value) => normalize(value) === normalize(catalog.specificationsTitle))
      ? languagePack.specificationsTitle
      : catalog.specificationsTitle,
    sectionLabels: {
      ...catalog.sectionLabels,
      ...languagePack.sectionLabels
    },
    features: translateKnownList(catalog.features, englishFeatures, languagePack.features, [kannadaFeatures, hindiFeatures], languagePack.customTranslations),
    standardAccessories: translateKnownList(catalog.standardAccessories, englishStandardAccessories, languagePack.standardAccessories, [kannadaStandardAccessories, hindiStandardAccessories], languagePack.customTranslations),
    optionalAccessories: translateKnownList(catalog.optionalAccessories, englishOptionalAccessories, languagePack.optionalAccessories, [kannadaOptionalAccessories, hindiOptionalAccessories], languagePack.customTranslations),
    specSections: translatedSections,
    legalNote: [englishLegalNote, kannadaLegalNote, hindiLegalNote].some((value) => normalize(value) === normalize(catalog.legalNote))
      ? languagePack.legalNote
      : catalog.legalNote,
    pageTextBlocks: languagePack.pageTextBlocks
  };
}
