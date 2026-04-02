import type { LanguageCode } from "./i18n";
import { MT_HERO_DISCLAIMER, MT_HERO_SUBLINE_REST, MT_HERO_SUBLINE_WE } from "./medTourismCopy";
import { frPack, esPack, swPack, ptPack } from "./medTourismTranslations.localePacks";

export type NonEn = Exclude<LanguageCode, "en">;

/** Full `/med-tourism` copy (MedicalTourismSection + WhyIndiaScreens). English = keys. */
export const MT_TRANSLATIONS: Partial<Record<NonEn, Record<string, string>>> = {
  hi: {
    "Trusted by patients across Africa": "अफ्रीका भर के मरीजों का भरोसा",
    "Travel to India for Affordable Treatment": "किफायती इलाज के लिए भारत आएं",
    "We Handle Everything": "हम सब संभालते हैं",
    [MT_HERO_SUBLINE_WE]: "हम",
    [MT_HERO_SUBLINE_REST]:
      " भरोसेमंद अस्पताल, आपकी यात्रा और ठहरने की व्यवस्था आपके पहले सवालों से लेकर घर वापसी तक करते हैं। आप ठीक होने पर ध्यान दें; बाकी व्यवस्था हम संभालते हैं।",
    "Get My Treatment Plan": "मेरा treatment plan लें",
    "Talk to a Care Guide": "केयर गाइड से बात करें",
    [MT_HERO_DISCLAIMER]:
      "हम अस्पताल नहीं हैं और इस वेबसाइट पर चिकित्सा इलाज नहीं देते। हमारी केयर टीम आपको मान्यता प्राप्त अस्पतालों से जोड़ने और ठहरने व यात्रा की योजना में मदद करती है, सौम्यता, स्पष्टता और हर कदम पर सहारे के साथ।",
    "WhatsApp care in your language": "WhatsApp पर आपकी भाषा में मदद",
    "Clear prices before you decide": "फैसले से पहले साफ़ कीमतें",
    "Representative modern hospital in India": "भारत में आधुनिक अस्पताल (प्रतिनिधि फोटो)",
    "Five clear steps from first call to your visa":
      "पहली बातचीत से लेकर वीज़ा तक: 5 सरल कदम",
    "Initial step: we speak with you online":
      "पहला कदम: हम ऑनलाइन आपसे बात करते हैं",
    "Tell us how you feel and what your doctor said. Our care team meets you on video or phone, calmly and in simple words.":
      "बताइए आप कैसा महसूस करते हैं और डॉक्टर ने क्या कहा। हमारी टीम वीडियो या फोन पर शांति से, आसान शब्दों में मिलती है।",
    "You share the documents we request":
      "आप वे दस्तावेज़ भेजते हैं जो हम माँगते हैं",
    "You upload reports on a clear checklist. We send them safely to experienced doctors in India.":
      "एक साफ़ सूची के हिसाब से रिपोर्ट अपलोड करें। हम उन्हें भारत के अनुभवी डॉक्टरों को सुरक्षित भेजते हैं।",
    "Clear opinion and treatment cost from India":
      "भारत से साफ़ राय और इलाज की कुल लागत",
    "Doctors in India review your file. They explain your condition and the full cost of care in plain language.":
      "भारत के डॉक्टर आपकी फ़ाइल देखते हैं। वे आपकी स्थिति और पूरे इलाज की लागत सरल भाषा में समझाते हैं।",
    "No commission from our team on your hospital quote. You see the real price.":
      "अस्पताल की कोट पर हमारी टीम कोई कमीशन नहीं लेती। आपको असली कीमत दिखती है।",
    "Official letter on StayOnStay letterhead":
      "StayOnStay लेटरहेड पर आधिकारिक पत्र",
    "When you say yes, the hospital prepares your invitation letter. We coordinate it on official StayOnStay letterhead so the paperwork is easy to trust.":
      "जब आप हाँ कहते हैं, अस्पताल निमंत्रण पत्र तैयार करता है। हम इसे आधिकारिक StayOnStay लेटरहेड पर ताकि कागज़ पर भरोसा रहे।",
    "Visa and flights: we guide you":
      "वीज़ा और फ्लाइट: हम मार्गदर्शन करते हैं",
    "We walk you through visa steps and suggest flight dates and routes that fit your treatment plan.":
      "वीज़ा के चरण समझाते हैं और इलाज की योजना के अनुसार फ्लाइट की तारीखें और रास्ते सुझाते हैं।",
    "After the five steps above: your time in India":
      "ऊपर वाले 5 कदमों के बाद: भारत में आपका समय",
    "JCI-accredited partner hospitals": "JCI मान्यता वाले साझेदार अस्पताल",
    "Trusted Gurugram facilities, in the order many families choose.":
      "गुरुग्राम के भरोसेमंद अस्पताल — जिस क्रम में कई परिवार चुनते हैं।",
    "Accreditation note Paras NABH":
      "Paras Hospital NABH मान्यता वाला है; बाकी चार यहाँ सूचीबद्ध JCI मान्यता वाले अस्पताल हैं।",
    "Representative hospital photo": "अस्पताल का प्रतिनिधि फोटो",
    "Representative photo note": "फोटो केवल उदाहरण है; इमारत दिखने में अलग हो सकती है।",
    "Five hospitals we connect you with": "पाँच अस्पताल जिनसे हम आपको जोड़ते हैं",
    "Not sure which hospital fits your case?": "समझ नहीं आ रहा कौन सा अस्पताल आपके लिए ठीक है?",
    "Our care team helps you choose on WhatsApp, no pressure.":
      "हमारी केयर टीम WhatsApp पर बिना दबाव के चुनने में मदद करती है।",
    "See more details >": "और जानकारी देखें >",
    "You arrive in India": "आप भारत पहुँचते हैं",
    "Our helper meets you at the airport and takes you to your hotel.":
      "हमारा सहायक एयरपोर्ट पर मिलता है और आपको होटल ले जाता है।",
    "Treatment and hospital visits": "इलाज और अस्पताल के दौरे",
    "You see your doctors as planned. We stay on WhatsApp and phone when you need us.":
      "योजना के अनुसार डॉक्टरों से मिलते रहें। ज़रूरत पर हम WhatsApp और फोन पर रहते हैं।",
    "Light outings if your doctor agrees":
      "हल्की बाहर घूमना, अगर डॉक्टर मानें",
    "When you feel stronger, we can suggest short, safe visits nearby — only if your doctor says it is OK.":
      "जब ताकत लगे, पास के छोटे सुरक्षित घूमने की जगह सुझा सकते हैं — सिर्फ तभी जब डॉक्टर मंज़ूर करें।",
    "Planning your trip home": "घर वापसी की योजना",
    "We help with tickets and reminders for follow-up care after you get home.":
      "टिकट और घर लौटने के बाद फॉलो-अप देखभाल की याद दिलाने में मदद।",
    "Why Travel With Us": "हमारे साथ क्यों यात्रा करें",
    "We Handle Everything — So You Don't Have To": "हम सब संभालते हैं — ताकि आपको चिंता न करनी पड़े",
    "You focus on healing. We handle the rest.": "आप ठीक होने पर ध्यान दें। बाकी हम संभालेंगे।",
    "How It Works": "यह कैसे काम करता है",
    "Your Journey, Step by Step": "आपकी यात्रा, कदम दर कदम",
    "No confusion. No stress. We guide you through every stage.": "कोई भ्रम नहीं। कोई तनाव नहीं। हम हर चरण में आपका मार्गदर्शन करते हैं।",
    "Step": "चरण",
    "You are here": "आप यहां हैं",
    "Treatments": "उपचार",
    "Find the right care: easy and clear": "सही देखभाल पाएँ: आसान और साफ़",
    "Top hospitals in India. Good care. Much less money.":
      "भारत के बड़े अस्पताल। अच्छा इलाज। पैसा बहुत कम।",
    "India is a leading choice for African families: advanced specialties, shorter waits, and often 60–80% lower cost than many Western systems.":
      "भारत अफ्रीकी परिवारों के लिए अग्रणी विकल्प: उन्नत विशेषज्ञता, कम इंतज़ार, और कई पश्चिमी देशों की तुलना में अक्सर 60–80% कम लागत।",
    "24,000+ African patients reached India in Q1 2026 — a sharp rise in medical travel.":
      "Q1 2026 तक 24,000+ अफ्रीकी मरीज़ भारत पहुँचे — चिकित्सा यात्रा में तेज़ वृद्धि।",
    "42% growth vs 2024 — many projections point to 100,000+ visits this year.":
      "2024 की तुलना में 42% वृद्धि — कई अनुमान इस साल 100,000+ यात्राओं की ओर।",
    "East & West Africa lead: Nigeria, Kenya, Tanzania, Ghana, Uganda & Congo.":
      "पूर्व और पश्चिम अफ्रीका अग्रणी: नाइजीरिया, केन्या, तंज़ानिया, घाना, युगांडा और कांगो।",
    "What African travelers often plan in India": "अफ्रीकी यात्री भारत में अक्सर क्या प्लान करते हैं",
    "Representative demand mix from industry reports — not a promise of availability.":
      "उद्योग रिपोर्टों से प्रतिनिधि मिश्रण — उपलब्धता की गारंटी नहीं।",
    "Oncology (cancer care)": "ऑन्कोलॉजी (कैंसर देखभाल)",
    "Cardiology (heart surgery)": "कार्डियोलॉजी (दिल की सर्जरी)",
    "Orthopaedics (joints & spine)": "ऑर्थोपेडिक्स (जोड़ और रीढ़)",
    "Other procedures": "अन्य प्रक्रियाएँ",
    "Illustrative photo — your hospital and doctor are chosen with you.":
      "चित्र केवल उदाहरण — अस्पताल और डॉक्टर आपके साथ चुने जाते हैं।",
    "Your health, our priority — we connect you; hospitals provide treatment.":
      "आपका स्वास्थ्य, हमारी प्राथमिकता — हम जोड़ते हैं; इलाज अस्पताल देते हैं।",
    "Cardiac care in India can cost around a fraction of US rates — use the calculator below for your country.":
      "भारत में हृदय देखभाल अक्सर US दरों का एक अंश — अपने देश के लिए नीचे कैलकुलेटर देखें।",
    "Indicative comparison — final quotes come from your hospital.":
      "संकेतक तुलना — अंतिम कोट आपके अस्पताल से।",
    "Typical stay:": "सामान्य ठहराव:",
    "* Price ranges are indicative in USD; final cost depends on hospital, city, and your case. Asterisk (*) marks where agencies often cite bundled or variable packages.":
      "* USD में कीमतें संकेतक; अंतिम लागत अस्पताल, शहर और केस पर निर्भर। (*) वहाँ जहाँ अक्सर पैकेज बदलते हैं।",
    "Partner Hospitals": "सहयोगी अस्पताल",
    "Leading accredited hospitals in Gurugram": "गुरुग्राम के अग्रणी मान्यता प्राप्त अस्पताल",
    "Accredited": "मान्यता प्राप्त",
    "Pricing": "मूल्य निर्धारण",
    "See How Much You Can Save": "देखें आप कितना बचा सकते हैं",
    "See what you pay at home vs India. Same care, lower price.":
      "घर पर कितना खर्च बनाम India। वही देखभाल, कम कीमत।",
    "Selected:": "चयनित:",
    "Currency:": "मुद्रा:",
    "Language:": "भाषा:",
    "Display": "दिखाएँ",
    "Local Cost": "स्थानीय लागत",
    "India": "भारत",
    "savings": "बचत",
    "About how much you save vs paying at home": "घर पर खर्च की तुलना में कितनी बचत",
    "Safety & Care": "सुरक्षा और देखभाल",
    "From airport to getting well — we stay with you": "एयरपोर्ट से ठीक होने तक — हम साथ रहते हैं",
    "Testimonials": "अनुभव",
    "Stories from people in Africa": "अफ्रीका के लोगों की कहानियाँ",
    "For Africa": "अफ्रीका के लिए",
    "People across Africa trust us": "अफ्रीका भर के लोग हम पर भरोसा करते हैं",
    "We help people in many countries. WhatsApp in your language. Clear advice for your area.":
      "हम कई देशों में लोगों की मदद करते हैं। WhatsApp आपकी भाषा में। आपके इलाके के लिए साफ़ सलाह।",
    "Reach us on WhatsApp": "व्हाट्सएप पर संपर्क करें",
    "Get instant support from a care guide in your region.": "अपने क्षेत्र के केयर गाइड से तुरंत सहायता पाएं।",
    "Chat Now": "अभी चैट करें",
    "African countries, one caring team": "अफ्रीकी देश, एक देखभाल करने वाली टीम",
    "You focus on healing.": "आप ठीक होने पर ध्यान दें।",
    "handle the rest.": "बाकी हम संभालेंगे।",
    "Ready to Start Your Healing Journey?": "क्या आप अपनी उपचार यात्रा शुरू करने के लिए तैयार हैं?",
    "Talk to a Care Guide: we'll plan your entire trip for free.":
      "केयर गाइड से बात करें: हम आपकी पूरी यात्रा मुफ्त में योजना बनाएंगे।",
    "Chat on WhatsApp": "व्हाट्सएप पर चैट करें",
    "English (Pidgin supported)": "अंग्रेज़ी · Pidgin भी समझ सकते हैं",
    "English + Swahili (mix)": "अंग्रेज़ी + Swahili (mix)",
    "English (local dialect friendly)": "अंग्रेज़ी (local बोली — आसान)",
    "English + Zulu (mix)": "अंग्रेज़ी + Zulu (mix)",
    "English + Kinyarwanda": "अंग्रेज़ी + Kinyarwanda",
    "Lingala (with English support)": "Lingala + English support",
    "Somali + English": "Somali + English",
    "English + Luganda": "अंग्रेज़ी + Luganda",
    "Portuguese + English": "Portuguese + English",
    "Amharic + English": "Amharic + English",
    "Save up to 70%": "70% तक बचत",
    "We link you to good hospitals in India. We help you plan. We do not give treatment ourselves.":
      "हम आपको भारत के अच्छे अस्पतालों से जोड़ते हैं। Planning में मदद। खुद treatment नहीं देते।",
    "Help with flights": "Flight में मदद",
    "We help you pick flights and dates that fit your treatment.":
      "हम ऐसी flight और date चुनने में मदद करते हैं जो आपके treatment से मिले।",
    "Hotel booking": "होटल booking",
    "We book hotels near your hospital. Good price. We do all booking.":
      "अस्पताल के पास hotel book करते हैं। अच्छी कीमत। सारी booking हम करते हैं।",
    "Airport pickup & drop": "एयरपोर्ट pickup और drop",
    "Our helper meets you at the airport and drives you to your hotel.":
      "हमारा helper एयरपोर्ट पर मिलता है और आपको hotel तक ले जाता है।",
    "Hospital help": "अस्पताल में मदद",
    "We book doctor visits and help you talk to your hospital team.":
      "Doctor visit book करते हैं और hospital team से बात कराने में मदद।",
    "Safe trip home": "घर वापसी सुरक्षित",
    "We help you plan going home and care after treatment.":
      "घर जाने और treatment के बाद देखभाल की planning में मदद।",
    "Tell us your problem": "अपनी समस्या बताएं",
    "Tell us what you need. We listen.": "जो चाहिए बताएं। हम सुनते हैं।",
    "Get hospitals and prices": "अस्पताल और कीमतें पाएं",
    "We send hospital names and clear prices.": "अस्पताल के नाम और साफ़ कीमतें भेजते हैं।",
    "We plan travel and stay": "Travel और रहना हम plan करते हैं",
    "Flights, hotel, visa help: we fix it for you.": "Flight, hotel, visa: हम आपके लिए ठीक करते हैं।",
    "You fly to India": "आप India आएं",
    "You land in India. Our helper meets you at the airport.":
      "India में उतरें। हमारा helper एयरपोर्ट पर मिलता है।",
    "Treatment and rest": "इलाज और आराम",
    "Good treatment. Help by phone 24 hours a day.":
      "अच्छा इलाज। 24 घंटे phone पर मदद।",
    "Visit India (optional)": "India घूमें (optional)",
    "You can see places in India while you rest, if you want.":
      "आराम के साथ India देख सकते हैं, अगर चाहें।",
    "Your trip home": "आपकी घर वापसी",
    "We help you go home and get follow-up care.":
      "घर जाने और बाद की देखभाल में मदद।",
    "Heart surgery": "दिल की surgery",
    "Dental implants": "दाँत के implant",
    "LASIK eye surgery": "LASIK आँख की surgery",
    "Bone and joint surgery": "हड्डी और जोड़ की surgery",
    "Fertility / IVF": "फर्टिलिटी / IVF",
    "Brain and nerve surgery": "दिमाग और नसों की surgery",
    "From $6,000": "$6,000 से",
    "From $800": "$800 से",
    "From $1,200": "$1,200 से",
    "From $5,500": "$5,500 से",
    "From $3,500": "$3,500 से",
    "From $8,000": "$8,000 से",
    "Popular in Africa": "अफ्रीका में लोकप्रिय",
    "High Success Rate": "उच्च सफलता दर",
    "Save Up to 70% on Medical Treatments": "मेडिकल इलाज पर 70% तक बचत",
    "Get the same quality care at a fraction of the cost, including travel and stay.":
      "वही गुणवत्ता, बहुत कम कीमत — travel और stay सहित।",
    "Cost Savings": "लागत बचत",
    "Hospitals": "अस्पताल",
    "Faster Treatment": "तेज उपचार",
    "Concierge Support": "कंसियर्ज सहायता",
    "Speak to a care guide": "केयर गाइड से बात करें",
    "Get your treatment plan": "अपनी उपचार योजना प्राप्त करें",
    "Talk to a Care Expert - Get Clear Answers in Minutes":
      "केयर एक्सपर्ट से बात करें — मिनटों में स्पष्ट जवाब",
    "No confusion. No pressure. Just simple guidance for your treatment journey.":
      "कोई confusion नहीं। कोई दबाव नहीं। सरल guidance।",
    "Continue to WhatsApp": "व्हाट्सएप पर जारी रखें",
    "Get Guidance for Your Treatment": "अपने इलाज के लिए मार्गदर्शन",
    "Get Your Personalized Treatment Plan": "अपनी व्यक्तिगत योजना प्राप्त करें",
    "Average response time: 2-5 minutes • Trusted by 10,000+ patients":
      "औसत जवाब: 2-5 मिनट • 10,000+ मरीजों का भरोसा",
    "Plan Your Stay & Travel": "Plan Your Stay & Travel",
    "people helped": "लोगों की मदद की",
    "hospitals with us": "हमारे साथ अस्पताल",
    "Save about 70%": "लगभग 70% बचत",
    "on average": "औसत पर",
    "Hospital in India": "भारत में अस्पताल",
    "JCI approved hospital": "JCI approved अस्पताल",
    "USD ($)": "USD ($)",
    "INR (₹)": "INR (₹)",
    "Heart Bypass": "हार्ट बाइपास",
    "Hip Replacement": "हिप रिप्लेसमेंट",
    "Nigeria": "नाइजीरिया",
    "Kenya": "केन्या",
    "Ghana": "घाना",
    "South Africa": "दक्षिण अफ्रीका",
    "Rwanda": "रवांडा",
    "Congo": "कांगो",
    "Somalia": "सोमालिया",
    "Uganda": "युगांडा",
    "Angola": "अंगोला",
    "Ethiopia": "इथियोपिया",
    "Tanzania": "तंजानिया",
    "Lagos, Nigeria": "लागोस, नाइजीरिया",
    "Nairobi, Kenya": "नैरोबी, केन्या",
    "Accra, Ghana": "अक्रा, घाना",
    "I was scared to travel alone for heart surgery. StayOnStay fixed everything — pickup, hotel, translator. I felt safe.":
      "दिल की surgery के लिए अकेले travel से डर था। StayOnStay ने सब ठीक किया — pickup, hotel, translator। safe लगा।",
    "My hip work in India cost one-third of Nairobi price. The hospital was good. StayOnStay helped me every step.":
      "India में hip का काम नैरोबी की कीमत का एक तिहाई। अस्पताल अच्छा था। StayOnStay हर कदम पर।",
    "Everything was easy. WhatsApp chat to airport ride — someone was always there.":
      "सब आसान था। WhatsApp से एयरपोर्ट ride तक — हमेशा कोई साथ था।",
    "Artemis Hospital": "Artemis Hospital",
    "Fortis Memorial Research Institute": "Fortis Memorial Research Institute",
    "Medanta – The Medicity": "Medanta – The Medicity",
    "Paras Hospital": "Paras Hospital",
    "Sector 51, Gurgaon, India": "सेक्टर 51, गुरुग्राम, भारत",
    "Sector 44, Gurgaon, India": "सेक्टर 44, गुरुग्राम, भारत",
    "Sector 38, Gurgaon, India": "सेक्टर 38, गुरुग्राम, भारत",
    "Sector 43, Gurgaon, India": "सेक्टर 43, गुरुग्राम, भारत",
    "Multi-Specialty": "मल्टी-स्पेशलिटी",
    "Oncology & Transplants": "ऑन्कोलॉजी और ट्रांसप्लांट",
    "Cardiac & Neurology": "कार्डियक और न्यूरोलॉजी",
    "Airport pickup by helper": "Helper से एयरपोर्ट pickup",
    "A helper meets you when you land. No stress.": "उतरते ही helper मिलता है। tension नहीं।",
    "24/7 help on phone": "24/7 phone पर मदद",
    "Call or message us any time, day or night.": "दिन या रात कभी call या message।",
    "Hospital to hotel car": "अस्पताल से hotel तक गाड़ी",
    "Safe rides between your hotel and hospital.": "hotel और अस्पताल के बीच safe ride।",
    "Plan your trip home": "घर की यात्रा plan करें",
    "We help you fly home and get care after treatment.":
      "घर वापसी की यात्रा और इलाज के बाद देखभाल में मदद।",
    "Full patient support": "पूरा patient support",
    "We handle travel and updates. You focus on getting better.":
      "Travel और updates हम संभालते हैं। आप ठीक होने पर ध्यान दें।",
    "Service breakdown": "सेवा सूची",
    "Support coverage": "सहायता कवरेज",
    "Process timeline": "प्रोसेस टाइमलाइन",
    "of": "में से",
    "You are guided at every step": "हर step पर हम guide करते हैं",
    "What you do": "आप क्या करें",
    "What we do": "हम क्या करते हैं",
    "Over 10,000 patients used this guided path with our support team.":
      "10,000+ मरीजों ने हमारी टीम के साथ यह guided path पूरा किया।",
    "We connect you with the right care team in seconds.":
      "कुछ सेकंड में सही care team से जोड़ते हैं।",
    "We detected you are from": "हमने देखा आप यहाँ से हैं",
    "Detected location helps us connect you faster.":
      "Detect location से हम जल्दी connect करते हैं।",
    "Where are you now?": "आप अभी कहाँ हैं?",
    "Outside India": "भारत के बाहर",
    "Your name": "आपका नाम",
    "Enter your name": "अपना नाम लिखें",
    "Phone (optional)": "फोन (optional)",
    "Enter phone number": "फोन नंबर लिखें",
    "Connecting...": "कनेक्ट कर रहे हैं...",
    "Plan your stay and travel": "अपना stay और travel plan करें",
    "Plan your stay and travel for treatment in India":
      "भारत इलाज के लिए अपना stay और travel plan करें",
    "Customize your stay, travel, and support. Get your quote fast.":
      "अपना stay, travel और support चुनें। जल्दी quote पाएं।",
    "Section": "भाग",
    "Back": "वापस",
    "Next": "अगला",
    "Submitting...": "भेज रहे हैं...",
    "Get personalized quote": "पर्सनल quote पाएं",
    "Plan": "प्लान",
    "Avg response 2-5 min": "औसत जवाब 2-5 मिनट",
    "Back to medical tourism": "वापस medical tourism पर",
    "WHY INDIA": "क्यों भारत",
    "Why Patients Choose India": "मरीज भारत क्यों चुनते हैं",
    "Explore details": "विवरण देखें",
    "Choose a topic below to see charts and full details.":
      "नीचे कोई topic चुनें — charts और पूरी detail देखें।",
    "See details": "विवरण देखें",
    "Tap to open": "खोलने के लिए tap करें",
    "On your phone, tap any card below.":
      "फोन पर, नीचे कोई भी card tap करें।",
    "Save Up to 70%": "70% तक बचत",
    "Get the same quality treatment at a fraction of the cost — including travel and stay.":
      "वही अच्छा इलाज, कम खर्च — travel और stay सहित।",
    "World-Class JCI Hospitals": "वर्ल्ड-क्लास JCI अस्पताल",
    "India has 40+ JCI-accredited hospitals with globally trained specialists.":
      "India में 40+ JCI hospitals। अच्छे specialists।",
    "Faster Treatment Timelines": "तेज़ treatment",
    "No long waiting lists. Get treated within days, not months.":
      "लंबा wait नहीं। दिनों में treatment, महीनों में नहीं।",
    "Full Concierge Support": "पूरा concierge support",
    "From visa to recovery — our team handles every detail of your journey.":
      "visa से recovery तक — हम पूरी journey में मदद।",
  },
  ar: {
    "Trusted by patients across Africa": "موثوق من المرضى في إفريقيا",
    "Travel to India for Affordable Treatment": "سافر إلى الهند لعلاج ميسور",
    "We Handle Everything": "نحن نهتم بكل شيء",
    [MT_HERO_SUBLINE_WE]: "نحن",
    [MT_HERO_SUBLINE_REST]:
      " ننسق مستشفيات موثوقة، سفرك وإقامتك من أول أسئلتك حتى أنت مستعد للعودة إلى المنزل. ركّز على الشفاء؛ نحن نهتم بالتنسيق.",
    "Get My Treatment Plan": "احصل على خطة علاجي",
    "Talk to a Care Guide": "تحدث مع مرشد الرعاية",
    [MT_HERO_DISCLAIMER]:
      "لسنا مستشفى ولا نقدم علاجاً طبياً على هذا الموقع. فريق العناية لدينا يساعدك على التواصل مع مستشفيات معتمدة وتخطيط إقامتك ورحلتك، بدفء ووضوح ودعم في كل خطوة.",
    "WhatsApp care in your language": "رعاية واتساب بلغتك",
    "Clear prices before you decide": "أسعار واضحة قبل قرارك",
    "Representative modern hospital in India": "مستشفى حديث في الهند (صورة توضيحية)",
    "Five clear steps from first call to your visa":
      "خمس خطوات واضحة من أول اتصال إلى التأشيرة",
    "Initial step: we speak with you online":
      "الخطوة الأولى: نتحدث معك عبر الإنترنت",
    "Tell us how you feel and what your doctor said. Our care team meets you on video or phone, calmly and in simple words.":
      "أخبرنا كيف تشعر وماذا قال طبيبك. فريقنا يلتقيك بالفيديو أو الهاتف بهدوء وبلغة بسيطة.",
    "You share the documents we request":
      "تشاركنا المستندات التي نطلبها",
    "You upload reports on a clear checklist. We send them safely to experienced doctors in India.":
      "ترفع التقارير حسب قائمة واضحة. نرسلها بأمان لأطباء ذوي خبرة في الهند.",
    "Clear opinion and treatment cost from India":
      "رأي واضح وتكلفة العلاج من الهند",
    "Doctors in India review your file. They explain your condition and the full cost of care in plain language.":
      "أطباء في الهند يراجعون ملفك ويشرحون حالتك وتكلفة الرعاية كاملة بلغة مفهومة.",
    "No commission from our team on your hospital quote. You see the real price.":
      "لا عمولة من فريقنا على عرض المستشفى. ترى السعر الحقيقي.",
    "Official letter on StayOnStay letterhead":
      "خطاب رسمي على ورقة رسمية StayOnStay",
    "When you say yes, the hospital prepares your invitation letter. We coordinate it on official StayOnStay letterhead so the paperwork is easy to trust.":
      "عند موافقتك يعد المستشفى خطاب الدعوة. ننسقه على ورقة StayOnStay الرسمية لتسهيل الثقة بالأوراق.",
    "Visa and flights: we guide you":
      "التأشيرة والرحلات: نرشدك",
    "We walk you through visa steps and suggest flight dates and routes that fit your treatment plan.":
      "نوضح خطوات التأشيرة ونقترح مواعيد ومسارات رحلات تناسب خطة علاجك.",
    "After the five steps above: your time in India":
      "بعد الخطوات الخمس أعلاه: وقتك في الهند",
    "JCI-accredited partner hospitals": "مستشفيات شركاء معتمدة JCI",
    "Trusted Gurugram facilities, in the order many families choose.":
      "مرافق موثوقة في غورغاون بالترتيب الذي تفضله كثير من العائلات.",
    "Accreditation note Paras NABH":
      "مستشفى باراس معتمد NABH؛ الأربعة الآخرون في القائمة مستشفيات JCI نتعاون معها.",
    "Representative hospital photo": "صورة توضيحية للمستشفى",
    "Representative photo note": "الصورة للتوضيح؛ قد يختلف مظهر المبنى.",
    "Five hospitals we connect you with": "خمس مستشفيات نربطك بها",
    "Not sure which hospital fits your case?": "لست متأكداً أي مستشفى يناسب حالتك؟",
    "Our care team helps you choose on WhatsApp, no pressure.":
      "فريق العناية يساعدك على الاختيار عبر واتساب بدون ضغط.",
    "See more details >": "شاهد المزيد من التفاصيل >",
    "You arrive in India": "تصل إلى الهند",
    "Our helper meets you at the airport and takes you to your hotel.":
      "مساعد يلتقيك في المطار ويأخذك إلى فندقك.",
    "Treatment and hospital visits": "العلاج وزيارات المستشفى",
    "You see your doctors as planned. We stay on WhatsApp and phone when you need us.":
      "تزور أطباءك كما خططتم. نبقى على واتساب والهاتف عند الحاجة.",
    "Light outings if your doctor agrees":
      "نزهات خفيفة إذا وافق الطبيب",
    "When you feel stronger, we can suggest short, safe visits nearby — only if your doctor says it is OK.":
      "عندما تشعر بتحسن نقترح زيارات قصيرة وآمنة قريبة — فقط إذا وافق الطبيب.",
    "Planning your trip home": "تخطيط عودتك للبيت",
    "We help with tickets and reminders for follow-up care after you get home.":
      "نساعد في التذاكر وتذكيرك بالمتابعة بعد عودتك.",
    "Why Travel With Us": "لماذا تسافر معنا",
    "We Handle Everything — So You Don't Have To": "نحن نهتم بكل شيء — حتى لا تقلق",
    "You focus on healing. We handle the rest.": "ركز على الشفاء، ونحن نهتم بالباقي.",
    "How It Works": "كيف يعمل",
    "Your Journey, Step by Step": "رحلتك خطوة بخطوة",
    "No confusion. No stress. We guide you through every stage.": "لا ارتباك ولا توتر. نرشدك في كل مرحلة.",
    "Step": "الخطوة",
    "You are here": "أنت هنا",
    "Treatments": "العلاجات",
    "Find the right care: easy and clear": "اعثر على الرعاية المناسبة: بسهولة ووضوح",
    "Top hospitals in India. Good care. Much less money.":
      "أفضل مستشفيات الهند. رعاية جيدة. تكلفة أقل بكثير.",
    "India is a leading choice for African families: advanced specialties, shorter waits, and often 60–80% lower cost than many Western systems.":
      "الهند خيار رائد للعائلات الأفريقية: تخصصات متقدمة، انتظار أقصر، وغالباً تكلفة أقل 60–80% من أنظمة غربية كثيرة.",
    "24,000+ African patients reached India in Q1 2026 — a sharp rise in medical travel.":
      "أكثر من 24 ألف مريض أفريقي وصلوا الهند في الربع الأول 2026 — نمو قوي في السفر الطبي.",
    "42% growth vs 2024 — many projections point to 100,000+ visits this year.":
      "نمو 42% مقارنة بـ 2024 — تقديرات تشير إلى أكثر من 100 ألف زيارة هذا العام.",
    "East & West Africa lead: Nigeria, Kenya, Tanzania, Ghana, Uganda & Congo.":
      "شرق وغرب أفريقيا يتصدران: نيجيريا، كينيا، تنزانيا، غانا، أوغندا والكونغو.",
    "What African travelers often plan in India": "ما يخطط له المسافرون الأفارقة غالباً في الهند",
    "Representative demand mix from industry reports — not a promise of availability.":
      "مزج طلب تمثيلي من تقارير الصناعة — ليس وعداً بالتوفر.",
    "Oncology (cancer care)": "الأورام (رعاية السرطان)",
    "Cardiology (heart surgery)": "أمراض القلب (جراحة القلب)",
    "Orthopaedics (joints & spine)": "العظام (المفاصل والعمود الفقري)",
    "Other procedures": "إجراءات أخرى",
    "Illustrative photo — your hospital and doctor are chosen with you.":
      "صورة توضيحية — يُختار المستشفى والطبيب معك.",
    "Your health, our priority — we connect you; hospitals provide treatment.":
      "صحتك أولويتنا — نربطك؛ المستشفيات تقدم العلاج.",
    "Cardiac care in India can cost around a fraction of US rates — use the calculator below for your country.":
      "رعاية القلب في الهند قد تكلف جزءاً من أسعار الولايات المتحدة — استخدم الحاسبة أدناه لبلدك.",
    "Indicative comparison — final quotes come from your hospital.":
      "مقارنة إرشادية — العروض النهائية من مستشفاك.",
    "Typical stay:": "مدة الإقامة المعتادة:",
    "* Price ranges are indicative in USD; final cost depends on hospital, city, and your case. Asterisk (*) marks where agencies often cite bundled or variable packages.":
      "* نطاقات الأسعار بالدولار إرشادية؛ التكلفة النهائية تعتمد على المستشفى والمدينة وحالتك. (*) حيث غالباً ما تُذكر باقات مجمّعة أو متغيرة.",
    "Partner Hospitals": "المستشفيات الشريكة",
    "Leading accredited hospitals in Gurugram": "أبرز المستشفيات المعتمدة في جورجاون",
    "Accredited": "معتمد",
    "Pricing": "الأسعار",
    "See How Much You Can Save": "شاهد مقدار التوفير",
    "See what you pay at home vs India. Same care, lower price.":
      "شاهد ما تدفعه في بلدك مقابل الهند. نفس الرعاية، سعر أقل.",
    "Selected:": "المحدد:",
    "Currency:": "العملة:",
    "Language:": "اللغة:",
    "Display": "العرض",
    "Local Cost": "التكلفة المحلية",
    "India": "الهند",
    "savings": "توفير",
    "About how much you save vs paying at home": "تقريباً كم توفر مقارنة بالدفع في بلدك",
    "Safety & Care": "السلامة والرعاية",
    "From airport to getting well — we stay with you": "من المطار إلى الشفاء — نبقى معك",
    "Testimonials": "آراء المرضى",
    "Stories from people in Africa": "قصص من أناس في إفريقيا",
    "For Africa": "لإفريقيا",
    "People across Africa trust us": "الناس في إفريقيا يثقون بنا",
    "We help people in many countries. WhatsApp in your language. Clear advice for your area.":
      "نساعد الناس في بلدان كثيرة. واتساب بلغتك. نصائح واضحة لمنطقتك.",
    "Reach us on WhatsApp": "تواصل معنا على واتساب",
    "Get instant support from a care guide in your region.": "احصل على دعم فوري من مرشد رعاية في منطقتك.",
    "Chat Now": "دردش الآن",
    "African countries, one caring team": "دول أفريقية، فريق رعاية واحد",
    "You focus on healing.": "ركّز على الشفاء.",
    "handle the rest.": "نحن نهتم بالباقي.",
    "Ready to Start Your Healing Journey?": "هل أنت جاهز لبدء رحلة الشفاء؟",
    "Talk to a Care Guide: we'll plan your entire trip for free.":
      "تحدث مع مرشد الرعاية: نخطط لرحلتك بالكامل مجاناً.",
    "Chat on WhatsApp": "الدردشة على واتساب",
    "English (Pidgin supported)": "الإنجليزية (مع دعم البيجن)",
    "English + Swahili (mix)": "الإنجليزية والسواحيلية (مزيج)",
    "English (local dialect friendly)": "الإنجليزية (لهجات محلية مفهومة)",
    "English + Zulu (mix)": "الإنجليزية والزولو (مزيج)",
    "English + Kinyarwanda": "الإنجليزية والكينيارواندا",
    "Lingala (with English support)": "اللينغالا (مع دعم الإنجليزية)",
    "Somali + English": "الصومالية والإنجليزية",
    "English + Luganda": "الإنجليزية واللوغندا",
    "Portuguese + English": "البرتغالية والإنجليزية",
    "Amharic + English": "الأمهرية والإنجليزية",
    "Save up to 70%": "وفّر حتى 70٪",
    "We link you to good hospitals in India. We help you plan. We do not give treatment ourselves.":
      "نربطك بمستشفيات جيدة في الهند. نساعدك في الخطة. لا نقدم العلاج بأنفسنا.",
    "Help with flights": "مساعدة في الرحلات",
    "We help you pick flights and dates that fit your treatment.":
      "نساعدك تختار رحلات ومواعيد تناسب علاجك.",
    "Hotel booking": "حجز الفندق",
    "We book hotels near your hospital. Good price. We do all booking.":
      "نحجز فنادق قرب المستشفى. سعر جيد. نحن ندير كل الحجوزات.",
    "Airport pickup & drop": "استقبال وتوصيل من المطار",
    "Our helper meets you at the airport and drives you to your hotel.":
      "مساعد يلتقي بك في المطار ويوصلك إلى فندقك.",
    "Hospital help": "مساعدة في المستشفى",
    "We book doctor visits and help you talk to your hospital team.":
      "نحجز زيارات الطبيب ونساعدك تتحدث مع فريق المستشفى.",
    "Safe trip home": "عودة آمنة للبيت",
    "We help you plan going home and care after treatment.":
      "نساعدك تخطط للعودة والرعاية بعد العلاج.",
    "Tell us your problem": "قل لنا مشكلتك",
    "Tell us what you need. We listen.": "قل ما تحتاج. نحن نسمع.",
    "Get hospitals and prices": "احصل على مستشفيات وأسعار",
    "We send hospital names and clear prices.": "نرسل أسماء مستشفيات وأسعار واضحة.",
    "We plan travel and stay": "نخطط للسفر والإقامة",
    "Flights, hotel, visa help: we fix it for you.":
      "رحلات وفندق وتأشيرة: نرتبها لك.",
    "You fly to India": "تسافر إلى الهند",
    "You land in India. Our helper meets you at the airport.":
      "تهبط في الهند. مساعد يلتقي بك في المطار.",
    "Treatment and rest": "علاج وراحة",
    "Good treatment. Help by phone 24 hours a day.":
      "علاج جيد. مساعدة بالهاتف 24 ساعة.",
    "Visit India (optional)": "زيارة الهند (اختياري)",
    "You can see places in India while you rest, if you want.":
      "يمكنك زيارة أماكن في الهند أثناء الراحة إذا أردت.",
    "Your trip home": "رحلتك للبيت",
    "We help you go home and get follow-up care.":
      "نساعدك في العودة والمتابعة بعد العلاج.",
    "Heart surgery": "جراحة القلب",
    "Dental implants": "زراعة الأسنان",
    "LASIK eye surgery": "جراحة ليزك للعين",
    "Bone and joint surgery": "جراحة العظام والمفاصل",
    "Fertility / IVF": "الخصوبة / أطفال الأنابيب",
    "Brain and nerve surgery": "جراحة الدماغ والأعصاب",
    "From $6,000": "من 6000 دولار",
    "From $800": "من 800 دولار",
    "From $1,200": "من 1200 دولار",
    "From $5,500": "من 5500 دولار",
    "From $3,500": "من 3500 دولار",
    "From $8,000": "من 8000 دولار",
    "Popular in Africa": "شائع في إفريقيا",
    "High Success Rate": "معدل نجاح عالٍ",
    "Save Up to 70% on Medical Treatments": "وفّر حتى 70٪ على العلاج الطبي",
    "Get the same quality care at a fraction of the cost, including travel and stay.":
      "نفس الجودة بجزء من التكلفة، بما في ذلك السفر والإقامة.",
    "Cost Savings": "توفير التكاليف",
    "Hospitals": "المستشفيات",
    "Faster Treatment": "علاج أسرع",
    "Concierge Support": "دعم الكونسييرج",
    "Speak to a care guide": "تحدث مع مرشد الرعاية",
    "Get your treatment plan": "احصل على خطة علاجك",
    "Talk to a Care Expert - Get Clear Answers in Minutes":
      "تحدث مع خبير رعاية — إجابات واضحة في دقائق",
    "No confusion. No pressure. Just simple guidance for your treatment journey.":
      "لا ارتباك ولا ضغط. إرشاد بسيط لرحلة علاجك.",
    "Continue to WhatsApp": "المتابعة إلى واتساب",
    "Get Guidance for Your Treatment": "احصل على إرشاد لعلاجك",
    "Get Your Personalized Treatment Plan": "احصل على خطة علاج مخصصة",
    "Average response time: 2-5 minutes • Trusted by 10,000+ patients":
      "متوسط الرد: 2-5 دقائق • موثوق من 10000+ مريض",
    "Plan Your Stay & Travel": "خطط لإقامتك وسفرك",
    "people helped": "أشخاص ساعدناهم",
    "hospitals with us": "مستشفيات معنا",
    "Save about 70%": "وفر حوالي 70٪",
    "on average": "في المتوسط",
    "Hospital in India": "مستشفى في الهند",
    "JCI approved hospital": "مستشفى معتمد JCI",
    "USD ($)": "USD ($)",
    "INR (₹)": "INR (₹)",
    "Heart Bypass": "تحويلة شرايين القلب",
    "Hip Replacement": "استبدال الورك",
    "Nigeria": "نيجيريا",
    "Kenya": "كينيا",
    "Ghana": "غانا",
    "South Africa": "جنوب إفريقيا",
    "Rwanda": "رواندا",
    "Congo": "الكونغو",
    "Somalia": "الصومال",
    "Uganda": "أوغندا",
    "Angola": "أنغولا",
    "Ethiopia": "إثيوبيا",
    "Tanzania": "تنزانيا",
    "Lagos, Nigeria": "لاغوس، نيجيريا",
    "Nairobi, Kenya": "نيروبي، كينيا",
    "Accra, Ghana": "أكرا، غانا",
    "I was scared to travel alone for heart surgery. StayOnStay fixed everything — pickup, hotel, translator. I felt safe.":
      "كنت خائفاً من السفر وحيداً لجراحة القلب. StayOnStay رتب كل شيء — استقبال وفندق ومترجم. شعرت بالأمان.",
    "My hip work in India cost one-third of Nairobi price. The hospital was good. StayOnStay helped me every step.":
      "عمل الورك في الهند كلف ثلث سعر نيروبي. المستشفى كان جيداً. StayOnStay ساعدني في كل خطوة.",
    "Everything was easy. WhatsApp chat to airport ride — someone was always there.":
      "كل شيء كان سهلاً. من واتساب إلى الرحلة من المطار — كان هناك من يساعدني دائماً.",
    "Artemis Hospital": "Artemis Hospital",
    "Fortis Memorial Research Institute": "Fortis Memorial Research Institute",
    "Medanta – The Medicity": "Medanta – The Medicity",
    "Paras Hospital": "Paras Hospital",
    "Sector 51, Gurgaon, India": "القطاع 51، جورجاون، الهند",
    "Sector 44, Gurgaon, India": "القطاع 44، جورجاون، الهند",
    "Sector 38, Gurgaon, India": "القطاع 38، جورجاون، الهند",
    "Sector 43, Gurgaon, India": "القطاع 43، جورجاون، الهند",
    "Multi-Specialty": "متعدد التخصصات",
    "Oncology & Transplants": "الأورام والزراعة",
    "Cardiac & Neurology": "القلب والأعصاب",
    "Airport pickup by helper": "استقبال من مساعد",
    "A helper meets you when you land. No stress.": "مساعد يلتقي بك عند الهبوط. بدون قلق.",
    "24/7 help on phone": "مساعدة على الهاتف 24/7",
    "Call or message us any time, day or night.": "اتصل أو راسلنا في أي وقت.",
    "Hospital to hotel car": "سيارة بين المستشفى والفندق",
    "Safe rides between your hotel and hospital.": "رحلات آمنة بين فندقك والمستشفى.",
    "Plan your trip home": "خطط لرحلتك للبيت",
    "We help you fly home and get care after treatment.":
      "نساعدك تطير للبيت وتحصل على رعاية بعد العلاج.",
    "Full patient support": "دعم كامل للمريض",
    "We handle travel and updates. You focus on getting better.":
      "نحن نهتم بالسفر والتحديثات. أنت ركز على الشفاء.",
    "Service breakdown": "تفاصيل الخدمة",
    "Support coverage": "نطاق الدعم",
    "Process timeline": "خطوات العملية",
    "of": "من",
    "You are guided at every step": "نرشدك في كل خطوة",
    "What you do": "ما الذي تفعله",
    "What we do": "ما الذي نفعله",
    "Over 10,000 patients used this guided path with our support team.":
      "أكثر من 10,000 مريض استخدموا هذا المسار مع فريق الدعم.",
    "We connect you with the right care team in seconds.":
      "نوصلك بفريق الرعاية المناسب خلال ثوانٍ.",
    "We detected you are from": "اكتشفنا أنك من",
    "Detected location helps us connect you faster.":
      "الموقع المكتشف يساعدنا على التواصل أسرع.",
    "Where are you now?": "أين أنت الآن؟",
    "Outside India": "خارج الهند",
    "Your name": "اسمك",
    "Enter your name": "اكتب اسمك",
    "Phone (optional)": "الهاتف (اختياري)",
    "Enter phone number": "اكتب رقم الهاتف",
    "Connecting...": "جارٍ الاتصال...",
    "Plan your stay and travel": "خطط لإقامتك وسفرك",
    "Plan your stay and travel for treatment in India":
      "خطط للإقامة والسفر للعلاج في الهند",
    "Customize your stay, travel, and support. Get your quote fast.":
      "خصص الإقامة والسفر والدعم. احصل على عرض السعر بسرعة.",
    "Section": "القسم",
    "Back": "رجوع",
    "Next": "التالي",
    "Submitting...": "جارٍ الإرسال...",
    "Get personalized quote": "احصل على عرض سعر مخصص",
    "Plan": "خطة",
    "Avg response 2-5 min": "متوسط الرد 2-5 دقائق",
    "Back to medical tourism": "العودة إلى السياحة العلاجية",
    "WHY INDIA": "لماذا الهند",
    "Why Patients Choose India": "لماذا يختار المرضى الهند",
    "Explore details": "عرض التفاصيل",
    "Choose a topic below to see charts and full details.":
      "اختر موضوعاً أدناه لرؤية الرسوم البيانية والتفاصيل الكاملة.",
    "See details": "عرض التفاصيل",
    "Tap to open": "اضغط للفتح",
    "On your phone, tap any card below.":
      "على هاتفك، اضغط على أي بطاقة أدناه.",
    "Save Up to 70%": "وفّر حتى 70٪",
    "Get the same quality treatment at a fraction of the cost — including travel and stay.":
      "نفس جودة العلاج بتكلفة أقل — بما في ذلك السفر والإقامة.",
    "World-Class JCI Hospitals": "مستشفيات JCI عالمية المستوى",
    "India has 40+ JCI-accredited hospitals with globally trained specialists.":
      "الهند لديها أكثر من 40 مستشفى معتمد JCI مع أخصائيين مدربين عالمياً.",
    "Faster Treatment Timelines": "جداول علاج أسرع",
    "No long waiting lists. Get treated within days, not months.":
      "لا قوائم انتظار طويلة. علاج خلال أيام وليس أشهراً.",
    "Full Concierge Support": "دعم كونسييرج كامل",
    "From visa to recovery — our team handles every detail of your journey.":
      "من التأشيرة إلى التعافي — فريقنا يهتم بكل تفاصيل رحلتك.",
  },
  fr: frPack,
  es: esPack,
  sw: swPack,
  pt: ptPack,
};
