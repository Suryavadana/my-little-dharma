import { useState, useRef, useEffect, createContext, useContext } from "react";

/* ---------- Design tokens ----------
   Cream #FFF8EC / Indigo #1F3B73 / Saffron #FF9933 / Lotus #E94F80 / Leaf #3D9970 / Gold #C9A227
   Display: 'Baloo 2' (rounded, friendly, matches the shipped Flutter app)
   Body: 'Nunito'
   Signature element: story reveal styled as an unfurling palm-leaf manuscript
   with a scalloped top edge and a hand-torn paper texture on the edges.
------------------------------------ */

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Nunito:wght@400;600;700&display=swap";

function useGoogleFonts() {
  useEffect(() => {
    if (document.getElementById("mld-fonts")) return;
    const link = document.createElement("link");
    link.id = "mld-fonts";
    link.rel = "stylesheet";
    link.href = FONT_LINK;
    document.head.appendChild(link);
  }, []);
}

async function callAI(prompt, maxTokens = 800) {
  // Calls our own serverless function (/api/ai), which forwards to Google
  // Gemini's free API tier. Keeping this behind our own backend means the
  // API key is never exposed to the browser, and swapping AI providers
  // later only means editing api/ai.js, not this file.
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, maxTokens }),
  });
  if (!response.ok) {
    throw new Error(`AI request failed (${response.status})`);
  }
  const data = await response.json();
  return (data.text || "").trim();
}

function parseStoryJson(text) {
  const cleaned = text.replace(/^```json/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      title: "A Story",
      sourceEpic: "",
      body: cleaned,
      moral: "",
      challenge: "",
    };
  }
}

const SAFETY_RULES = `You are writing for a children's app for ages 3-12, inspired by Hindu epics and folklore (Ramayana, Mahabharata, Panchatantra, Puranas, etc).
Hard rules, always:
- No graphic violence, gore, romance, or frightening imagery. Adapt difficult themes gently.
- Frame this as storytelling and values, not religious instruction, suitable for children of any or no religious background.
- Simple vocabulary appropriate to the child's age.
- Always end on a positive, empowering note.`;

const SEED_SHLOKAS = [
  {
    id: "ganesha_shloka", title: "Ganesha Shloka",
    sanskrit: "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥",
    transliteration: "Vakratunda Mahakaya Suryakoti Samaprabha, Nirvighnam Kuru Me Deva Sarva-Kaaryeshu Sarvada",
    meaning: "O curved-trunk, mighty-bodied one, radiant as a million suns — please remove all obstacles from my work, always.",
    words: [["Vakratunda", "curved trunk (Ganesha)"], ["Mahakaya", "mighty/large-bodied"], ["Suryakoti Samaprabha", "radiant as a million suns"], ["Nirvighnam", "without obstacles"], ["Kuru Me Deva", "please grant me, O Lord"], ["Sarva-Kaaryeshu Sarvada", "in all tasks, always"]],
  },
  {
    id: "saraswati_vandana", title: "Saraswati Vandana",
    sanskrit: "या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता।\nया वीणावरदण्डमण्डितकरा या श्वेतपद्मासना।\nया ब्रह्माच्युतशङ्करप्रभृतिभिर्देवैः सदा वन्दिता\nसा मां पातु सरस्वती भगवती निःशेषजाड्यापहा॥",
    transliteration: "Ya Kundendu Tushaara Haaradhavalaa Yaa Shubhra Vastraavritaa, Yaa Veenaavara Dandamanditakaraa Yaa Shwetapadmaasanaa, Yaa Brahmaachyuta Shankara Prabhritibhir Devaih Sadaa Vanditaa, Saa Maam Paatu Saraswati Bhagavatee Nihshesha Jaadyaapahaa",
    meaning: "May Goddess Saraswati — white as jasmine, the moon, and snow, dressed in pure white, holding a beautiful veena, seated on a white lotus, and always honored by Brahma, Vishnu, Shiva and the other gods — protect me and clear away all dullness from my mind.",
    words: [
      ["Ya Kundendu Tushaara Haaradhavalaa", "white as jasmine, moon, and snow"],
      ["Shubhra Vastraavritaa", "dressed in pure white clothes"],
      ["Veenaavara Dandamanditakaraa", "holding a beautiful veena (instrument)"],
      ["Shwetapadmaasanaa", "seated on a white lotus"],
      ["Brahmaachyuta Shankara Prabhritibhir Devaih Sadaa Vanditaa", "always honored by Brahma, Vishnu, Shiva, and other gods"],
      ["Saa Maam Paatu Saraswati Bhagavatee", "may that goddess Saraswati protect me"],
      ["Nihshesha Jaadyaapahaa", "remover of all dullness of mind"],
    ],
  },
  {
    id: "gayatri_mantra", title: "Gayatri Mantra",
    sanskrit: "ॐ भूर्भुवः स्वः। तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि। धियो यो नः प्रचोदयात्॥",
    transliteration: "Om Bhur Bhuvah Swaha, Tat Savitur Varenyam, Bhargo Devasya Dheemahi, Dhiyo Yo Nah Prachodayat",
    meaning: "We meditate on the glorious light of the divine sun; may it awaken and guide our minds.",
    words: [
      ["Om", "the sacred sound"],
      ["Bhur Bhuvah Swaha", "earth, sky, and heavens"],
      ["Tat Savitur Varenyam", "that adorable light of the sun"],
      ["Bhargo Devasya Dheemahi", "we meditate on that divine radiance"],
      ["Dhiyo Yo Nah Prachodayat", "may it guide and inspire our thoughts"],
    ],
  },
  {
    id: "shanti_mantra", title: "Shanti Mantra",
    sanskrit: "ॐ सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः।\nसर्वे भद्राणि पश्यन्तु मा कश्चिद्दुःखभाग्भवेत्।\nॐ शान्तिः शान्तिः शान्तिः॥",
    transliteration: "Om Sarve Bhavantu Sukhinah, Sarve Santu Niraamayaah, Sarve Bhadraani Pashyantu, Maa Kashcid Duhkha Bhaag Bhavet, Om Shanti Shanti Shanti",
    meaning: "May all beings be happy, may all be free from illness, may all see good things, and may no one suffer. Om, peace, peace, peace.",
    words: [
      ["Sarve Bhavantu Sukhinah", "may all beings be happy"],
      ["Sarve Santu Niraamayaah", "may all be free from illness"],
      ["Sarve Bhadraani Pashyantu", "may all see good and auspicious things"],
      ["Maa Kashcid Duhkha Bhaag Bhavet", "may no one experience sorrow"],
      ["Om Shanti Shanti Shanti", "peace, peace, peace"],
    ],
  },
  {
    id: "guru_shloka", title: "Guru Shloka",
    sanskrit: "गुरुर्ब्रह्मा गुरुर्विष्णुः गुरुर्देवो महेश्वरः।\nगुरुः साक्षात् परं ब्रह्म तस्मै श्री गुरवे नमः॥",
    transliteration: "Gurur Brahmaa Gurur Vishnuh Gurur Devo Maheshwarah, Guruh Saakshaat Param Brahma Tasmai Shree Gurave Namah",
    meaning: "The teacher is like Brahma, Vishnu, and Shiva — the teacher is truly the highest wisdom itself. I bow to that teacher.",
    words: [
      ["Gurur Brahmaa Gurur Vishnuh Gurur Devo Maheshwarah", "the teacher is like Brahma, Vishnu, and Shiva"],
      ["Guruh Saakshaat Param Brahma", "the teacher is truly the highest wisdom"],
      ["Tasmai Shree Gurave Namah", "I bow to that respected teacher"],
    ],
  },
  {
    id: "hanuman_strength", title: "Hanuman's Prayer for Strength",
    sanskrit: "बुद्धिहीन तनु जानिके, सुमिरौं पवन-कुमार।\nबल बुधि विद्या देहु मोहि, हरहु कलेश विकार॥",
    transliteration: "Buddhiheen Tanu Jaanike, Sumirau Pavan-Kumaar, Bal Budhi Vidyaa Dehu Mohi, Harahu Kalesh Vikaar",
    meaning: "Knowing myself to be weak in wisdom, I remember Hanuman, son of the wind. Please give me strength, intelligence, and knowledge, and take away my troubles.",
    words: [
      ["Buddhiheen Tanu Jaanike", "knowing myself to lack wisdom"],
      ["Sumirau Pavan-Kumaar", "I remember Hanuman, son of the wind"],
      ["Bal Budhi Vidyaa Dehu Mohi", "please give me strength, intelligence, and knowledge"],
      ["Harahu Kalesh Vikaar", "take away my troubles and faults"],
    ],
  },
  {
    id: "gita_247", title: "Bhagavad Gita 2.47",
    sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
    transliteration: "Karmanye Vaadhikaaraste Maa Phaleshu Kadaachana, Maa Karmaphalaheturbhoor Maa Te Sangostvakarmani",
    meaning: "You have a right to do your work, but not to worry about its results. Don't do your work just for the reward, and don't stop doing your work either.",
    words: [
      ["Karmanye Vaadhikaaraste", "you have a right to your actions/effort"],
      ["Maa Phaleshu Kadaachana", "never to the fruits (results) of that action"],
      ["Maa Karmaphalaheturbhoor", "don't let the result be your only reason to act"],
      ["Maa Te Sangostvakarmani", "and don't stop acting either"],
    ],
  },
  {
    id: "gita_220", title: "Bhagavad Gita 2.20",
    sanskrit: "न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः।\nअजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे॥",
    transliteration: "Na Jaayate Mriyate Vaa Kadaachit Naayam Bhootvaa Bhavitaa Vaa Na Bhooyah, Ajo Nityah Shaashwato'yam Puraano Na Hanyate Hanyamaane Shareere",
    meaning: "The true self is never born and never dies. It is unborn, eternal, and everlasting — it is not destroyed even when the body is.",
    words: [
      ["Na Jaayate Mriyate Vaa Kadaachit", "it is never born and never dies"],
      ["Naayam Bhootvaa Bhavitaa Vaa Na Bhooyah", "it does not come into being or stop being"],
      ["Ajo Nityah Shaashwato'yam Puraanah", "it is unborn, eternal, everlasting, ancient"],
      ["Na Hanyate Hanyamaane Shareere", "it is not destroyed when the body is destroyed"],
    ],
  },
  {
    id: "gita_214", title: "Bhagavad Gita 2.14",
    sanskrit: "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।\nआगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥",
    transliteration: "Maatraa-sparshaastu Kaunteya Sheetoshna-sukha-duhkha-daah, Aagamaapaayino'nityaas Taanstitikshasva Bhaarata",
    meaning: "Things like heat and cold, joy and sorrow, come from our senses meeting the world — they come and go, they never last. Learn to stay steady through them.",
    words: [
      ["Maatraa-sparshaastu", "the contact of the senses with the world"],
      ["Sheetoshna-sukha-duhkha-daah", "gives rise to heat/cold, joy/sorrow"],
      ["Aagamaapaayino'nityaah", "these come and go, they are not permanent"],
      ["Taanstitikshasva", "learn to endure them steadily"],
    ],
  },
  {
    id: "gita_47_8", title: "Bhagavad Gita 4.7–4.8",
    sanskrit: "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत।\nअभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥\nपरित्राणाय साधूनां विनाशाय च दुष्कृताम्।\nधर्मसंस्थापनार्थाय सम्भवामि युगे युगे॥",
    transliteration: "Yadaa Yadaa Hi Dharmasya Glaanir Bhavati Bhaarata, Abhyutthaanam Adharmasya Tadaatmaanam Srijaamyaham, Paritraanaaya Saadhoonaam Vinaashaaya Cha Dushkritaam, Dharma-samsthaapanaarthaaya Sambhavaami Yuge Yuge",
    meaning: "Whenever goodness declines and wrongdoing rises, I appear, age after age — to protect those who do right, to stop those who do wrong, and to restore balance and goodness in the world.",
    words: [
      ["Yadaa Yadaa Hi Dharmasya Glaanir Bhavati", "whenever goodness/righteousness declines"],
      ["Abhyutthaanam Adharmasya", "and wrongdoing rises up"],
      ["Tadaatmaanam Srijaamyaham", "then I take birth/appear"],
      ["Paritraanaaya Saadhoonaam", "to protect those who do good"],
      ["Vinaashaaya Cha Dushkritaam", "and to stop those who do wrong"],
      ["Dharma-samsthaapanaarthaaya Sambhavaami Yuge Yuge", "to restore goodness, age after age"],
    ],
  },
  {
    id: "gita_65", title: "Bhagavad Gita 6.5",
    sanskrit: "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥",
    transliteration: "Uddhared Aatmanaatmaanam Naatmaanam Avasaadayet, Aatmaiva Hyaatmano Bandhur Aatmaiva Ripur Aatmanah",
    meaning: "Lift yourself up through your own effort — don't let yourself down. You are your own best friend, and you can also be your own worst enemy.",
    words: [
      ["Uddhared Aatmanaatmaanam", "lift yourself up by your own effort"],
      ["Naatmaanam Avasaadayet", "do not let yourself down"],
      ["Aatmaiva Hyaatmano Bandhuh", "the self is indeed its own friend"],
      ["Aatmaiva Ripur Aatmanah", "and the self can be its own enemy"],
    ],
  },
  {
    id: "gita_321", title: "Bhagavad Gita 3.21",
    sanskrit: "यद्यदाचरति श्रेष्ठस्तत्तदेवेतरो जनः।\nस यत्प्रमाणं कुरुते लोकस्तदनुवर्तते॥",
    transliteration: "Yad Yad Aacharati Shreshthas Tat Tadeva Itaro Janah, Sa Yat Pramaanam Kurute Lokas Tad Anuvartate",
    meaning: "Whatever a respected person does, others tend to follow. Whatever example they set, the world follows it too.",
    words: [
      ["Yad Yad Aacharati Shreshthah", "whatever a great/respected person does"],
      ["Tat Tadeva Itaro Janah", "ordinary people do the same"],
      ["Sa Yat Pramaanam Kurute", "whatever standard they set"],
      ["Lokas Tad Anuvartate", "the world follows it"],
    ],
  },
  {
    id: "gita_635", title: "Bhagavad Gita 6.35",
    sanskrit: "असंशयं महाबाहो मनो दुर्निग्रहं चलम्।\nअभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते॥",
    transliteration: "Asamshayam Mahaabaaho Mano Durnigraham Chalam, Abhyaasena Tu Kaunteya Vairaagyena Cha Grihyate",
    meaning: "It's true — the mind is restless and hard to control. But with steady practice, over time, it can be mastered.",
    words: [
      ["Asamshayam", "without doubt, it's true"],
      ["Mano Durnigraham Chalam", "the mind is hard to control and restless"],
      ["Abhyaasena Tu", "but through steady practice"],
      ["Vairaagyena Cha Grihyate", "and with patience, it can be mastered"],
    ],
  },
  {
    id: "gita_1866", title: "Bhagavad Gita 18.66",
    sanskrit: "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।\nअहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥",
    transliteration: "Sarva-dharmaan Parityajya Maamekam Sharanam Vraja, Aham Twaam Sarva-paapebhyo Mokshayishyaami Maa Shuchah",
    meaning: "Let go of your worries and place your trust in me completely — I will take care of you. Don't be afraid.",
    words: [
      ["Sarva-dharmaan Parityajya", "letting go of all your worries/burdens"],
      ["Maamekam Sharanam Vraja", "come to me for shelter and trust"],
      ["Aham Twaam Sarva-paapebhyo Mokshayishyaami", "I will free you and take care of you"],
      ["Maa Shuchah", "do not be afraid or sad"],
    ],
  },
  {
    id: "udyamena_subhashita", title: "On Hard Work (Subhashita)",
    sanskrit: "उद्यमेन हि सिध्यन्ति कार्याणि न मनोरथैः।\nन हि सुप्तस्य सिंहस्य प्रविशन्ति मुखे मृगाः॥",
    transliteration: "Udyamena Hi Sidhyanti Kaaryaani Na Manorathaih, Na Hi Suptasya Simhasya Pravishanti Mukhe Mrigaah",
    meaning: "Tasks are accomplished through effort, not just by wishing. Deer do not walk into the mouth of a sleeping lion.",
    words: [
      ["Udyamena Hi Sidhyanti Kaaryaani", "tasks are accomplished through effort"],
      ["Na Manorathaih", "not merely by wishing for it"],
      ["Na Hi Suptasya Simhasya", "even a sleeping lion"],
      ["Pravishanti Mukhe Mrigaah", "does not have deer walk into its mouth (nothing comes without trying)"],
    ],
  },
  {
    id: "twameva_mata", title: "Twameva Mata (Universal Prayer)",
    sanskrit: "त्वमेव माता च पिता त्वमेव।\nत्वमेव बन्धुश्च सखा त्वमेव।\nत्वमेव विद्या द्रविणं त्वमेव।\nत्वमेव सर्वं मम देव देव॥",
    transliteration: "Twameva Mata Cha Pita Twameva, Twameva Bandhushcha Sakha Twameva, Twameva Vidya Dravinam Twameva, Twameva Sarvam Mama Deva Deva",
    meaning: "You alone are my mother and father, you alone are my relative and friend, you alone are my knowledge and wealth — you alone are everything to me.",
    words: [
      ["Twameva Mata Cha Pita", "you alone are my mother and father"],
      ["Twameva Bandhushcha Sakha", "you alone are my relative and friend"],
      ["Twameva Vidya Dravinam", "you alone are my knowledge and wealth"],
      ["Twameva Sarvam Mama Deva Deva", "you alone are everything to me"],
    ],
  },
  {
    id: "karagre_vasate", title: "Morning Hand Prayer",
    sanskrit: "कराग्रे वसते लक्ष्मीः करमध्ये सरस्वती।\nकरमूले तु गोविन्दः प्रभाते करदर्शनम्॥",
    transliteration: "Karagre Vasate Lakshmi, Karamadhye Saraswati, Karamoole Tu Govindah, Prabhaate Kara Darshanam",
    meaning: "At my fingertips lives wealth, at the center of my palm lives knowledge, and at the base of my hand lives Govinda — so I look at my hands each morning with gratitude for all I can do.",
    words: [
      ["Karagre Vasate Lakshmi", "at the fingertips lives the goddess of wealth"],
      ["Karamadhye Saraswati", "at the center of the palm lives the goddess of knowledge"],
      ["Karamoole Tu Govindah", "at the base of the hand lives Govinda (Krishna)"],
      ["Prabhaate Kara Darshanam", "so each morning I look at my hands with gratitude"],
    ],
  },
  {
    id: "saha_naavavatu", title: "Prayer for Learning Together",
    sanskrit: "ॐ सह नाववतु। सह नौ भुनक्तु। सह वीर्यं करवावहै।\nतेजस्विनावधीतमस्तु मा विद्विषावहै॥",
    transliteration: "Om Saha Naavavatu, Saha Nau Bhunaktu, Saha Veeryam Karavaavahai, Tejasvi Naavadheetamastu Maa Vidvishaavahai",
    meaning: "May we be protected together, may we be nourished together, may we work together with energy, may our learning shine, and may we never hate one another.",
    words: [
      ["Saha Naavavatu", "may we be protected together"],
      ["Saha Nau Bhunaktu", "may we be nourished together"],
      ["Saha Veeryam Karavaavahai", "may we work together with energy and courage"],
      ["Tejasvi Naavadheetamastu", "may our learning be brilliant"],
      ["Maa Vidvishaavahai", "may we never hate each other"],
    ],
  },
  {
    id: "ahimsa_paramo", title: "Ahimsa Paramo Dharmah",
    sanskrit: "अहिंसा परमो धर्मः।",
    transliteration: "Ahimsa Paramo Dharmah",
    meaning: "Non-violence — not hurting others, in action or in words — is the highest value of all.",
    words: [
      ["Ahimsa", "non-violence, not hurting others"],
      ["Paramo Dharmah", "the highest duty or value"],
    ],
  },
  {
    id: "vasudhaiva_kutumbakam", title: "Vasudhaiva Kutumbakam",
    sanskrit: "अयं निजः परोवेति गणना लघुचेतसाम्।\nउदारचरितानां तु वसुधैव कुटुम्बकम्॥",
    transliteration: "Ayam Nijah Paro Veti Ganana Laghuchetasaam, Udaracharitaanaam Tu Vasudhaiva Kutumbakam",
    meaning: "\"This is mine, this belongs to someone else\" — that kind of thinking is small-minded. To a generous heart, the whole world is one family.",
    words: [
      ["Ayam Nijah Paro Veti", "\"this is mine, this is someone else's\""],
      ["Ganana Laghuchetasaam", "such small-minded thinking"],
      ["Udaracharitaanaam Tu", "but to those with generous, broad hearts"],
      ["Vasudhaiva Kutumbakam", "the whole world is one family"],
    ],
  },
  {
    id: "satyameva_jayate", title: "Satyameva Jayate",
    sanskrit: "सत्यमेव जयते नानृतम्।",
    transliteration: "Satyameva Jayate Naanritam",
    meaning: "Truth alone triumphs, never falsehood. (This line is India's national motto, from the ancient Mundaka Upanishad.)",
    words: [
      ["Satyameva Jayate", "truth alone triumphs"],
      ["Na Anritam", "never falsehood"],
    ],
  },
];

const QUIZ_SETS = {
  "Mahabharata Quiz": [
    { q: "Who was Arjuna's charioteer in the Mahabharata?", options: ["Krishna", "Hanuman", "Ganesha", "Vishnu"], correct: 0 },
    { q: "How many Pandava brothers were there?", options: ["3", "4", "5", "7"], correct: 2 },
    { q: "What text has Krishna teaching Arjuna about duty?", options: ["Ramayana", "Bhagavad Gita", "Panchatantra", "Puranas"], correct: 1 },
  ],
  "Ramayana Quiz": [
    { q: "Who helped Rama build a bridge to Lanka?", options: ["An army of monkeys and bears", "A flock of birds", "Fishermen", "The wind god alone"], correct: 0 },
    { q: "What is the name of Rama's wife?", options: ["Radha", "Sita", "Parvati", "Draupadi"], correct: 1 },
    { q: "Who is known for devotion and strength in the Ramayana?", options: ["Hanuman", "Ravana", "Kumbhakarna", "Vibhishana"], correct: 0 },
  ],
  "Values & Panchatantra": [
    { q: "In the Panchatantra, what helped the thirsty crow get water?", options: ["Waiting for rain", "Dropping pebbles into the pot", "Asking another animal", "Flying away"], correct: 1 },
    { q: "What value does sharing your toys show?", options: ["Kindness", "Laziness", "Fear", "Anger"], correct: 0 },
    { q: "What should you do if you break something by accident?", options: ["Hide it", "Blame someone else", "Tell the truth", "Ignore it"], correct: 2 },
  ],
};

const MEMORY_CHARACTERS = ["🐒", "🦚", "🐘", "🏹", "🪷", "🐄"];

// Full pre-written bedtime stories — real content, not AI-generated on
// demand. A real content library needs stories that exist whether or not
// the AI backend is reachable; these are original retellings of well-known
// tales and traditional parables.
const SEED_BEDTIME_STORIES = [
  {
    id: "hanuman_leap", title: "Hanuman's Great Leap", category: "Hanuman", emoji: "🐒",
    body: "Rama needed to find Sita, who had been taken far across the ocean to the island of Lanka. The ocean was wide — so wide that no one believed anyone could cross it. One by one, the monkey warriors tried to guess how far they could leap. Some could jump ten miles. Some could jump a hundred. But the ocean was much wider than that.\n\nThen an old bear named Jambavan turned to Hanuman, who was sitting quietly at the back, not boasting like the others. \"Hanuman,\" he said, \"you have forgotten your own strength. As a child, you once leapt toward the sun itself, thinking it was a fruit! You can do this.\"\n\nHanuman stood up. He had doubted himself, but now he remembered who he was. He grew larger and larger, until he was as tall as a mountain. Then he crouched down, and with a mighty roar, he leapt into the sky and flew clear across the entire ocean, all the way to Lanka.",
    moral: "You are often stronger and more capable than you believe. Sometimes you just need someone to remind you.",
  },
  {
    id: "ganesha_moon", title: "Ganesha and the Moon", category: "Ganesha", emoji: "🐘",
    body: "One night, Ganesha was riding home on his little mouse, his belly full after a wonderful feast. As they went along a bumpy path, the mouse stumbled over a snake, and Ganesha tumbled right off and landed on the ground with a soft thud — his round belly bouncing as he fell.\n\nUp in the sky, the Moon saw this and could not stop laughing. He laughed and laughed, pointing at Ganesha rolling in the dirt.\n\nGanesha did not get angry easily, but being laughed at while he was down did not feel kind at all. \"Since you find it so funny to laugh at others when they've fallen,\" Ganesha said, \"from now on, you will sometimes disappear from the sky completely, so that no one can even see you.\"\n\nThat is why, even today, the moon changes each night — sometimes full and bright, and sometimes gone completely from the sky.",
    moral: "It's never kind to laugh at someone else's accident or mistake. Everyone stumbles sometimes.",
  },
  {
    id: "krishna_butter", title: "Krishna's Butter Mischief", category: "Krishna", emoji: "🧈",
    body: "Little Krishna loved butter more than anything. His mother, Yashoda, kept the butter pot high up on a shelf, but that never stopped him. He would climb on stools, stack pots into towers, and even ask his friends to make a human ladder — all to reach that butter pot.\n\nOne day, Yashoda caught him with butter all over his hands and face, and a little bit smeared on his friend's nose too. \"Krishna!\" she said, trying to look stern but almost smiling. \"Did you take the butter again?\"\n\nKrishna looked down at his buttery hands, then up at his mother, and simply said, \"Yes, Mother. I did.\" He didn't try to hide it or blame his friends.\n\nYashoda couldn't stay angry. She gave him a gentle tap on the hand and a big hug instead. \"Next time, just ask me,\" she said, \"and I'll give you a proper share.\"",
    moral: "Owning up to what you did, even when you might get in trouble, is always the better path — and it usually turns out gentler than you expect.",
  },
  {
    id: "thirsty_crow", title: "The Thirsty Crow", category: "Panchatantra", emoji: "🐦",
    body: "One hot summer day, a crow flew for miles searching for water. Finally, she spotted a tall clay pot sitting in a garden. She flew down eagerly, but when she looked inside, her heart sank — the water was only at the very bottom, far too low for her beak to reach.\n\nShe tried tipping the pot over, but it was too heavy. She thought about giving up and flying away thirsty. But then she had an idea.\n\nOne by one, she picked up small pebbles lying nearby and dropped them into the pot — plink, plink, plink. Slowly, the water level began to rise as the pebbles took up space at the bottom. She kept going, pebble after pebble, patiently, until finally the water rose high enough for her to take a long, cool drink.",
    moral: "When a problem seems impossible, patience and clever, steady effort can often solve what brute force cannot.",
  },
  {
    id: "sita_garden", title: "Sita's Garden of Patience", category: "Sita", emoji: "🌱",
    body: "While Sita lived in the forest with Rama and Lakshmana, she decided to plant a small garden outside their cottage. She planted tiny seeds — flowers, herbs, and a young mango sapling — and watered them every single day.\n\nAt first, nothing seemed to happen. Days passed with no sprouts at all. \"Maybe I planted them wrong,\" she wondered. But she kept watering them anyway, gently, every morning.\n\nSlowly, tiny green shoots began to peek through the soil. Weeks later, flowers bloomed in bright colors, and herbs grew fragrant and full. The mango sapling, though still small, stood a little taller each week.\n\n\"Nothing worth growing happens all at once,\" Sita told Lakshmana one evening, looking at her garden with a quiet smile. \"You just have to keep caring for it, even on the days it looks like nothing is happening.\"",
    moral: "Good things often take time to grow. Patience and steady care matter more than instant results.",
  },
  {
    id: "lion_mouse", title: "The Lion and the Mouse", category: "Panchatantra", emoji: "🦁",
    body: "A mighty lion was sleeping in the shade of a tree when a tiny mouse accidentally scurried across his paw and woke him up. Furious, the lion grabbed the mouse in his huge paw, ready to eat him in one bite.\n\n\"Please, great lion, let me go!\" squeaked the mouse. \"I promise, one day I will help you back.\"\n\nThe lion laughed at the idea that a creature so small could ever help someone so big and strong. But he was in a good mood, so he let the little mouse scurry away free.\n\nMany weeks later, the lion got tangled in a hunter's net, roaring and struggling but unable to break free. The little mouse heard his roars from far away and came running. Quietly and quickly, she gnawed through the ropes of the net, thread by thread, until the lion was finally free.\n\n\"I told you,\" said the mouse with a smile, \"that even someone small could help someone big.\"",
    moral: "Never think an act of kindness is too small to matter, and never assume someone is too small to help you one day.",
  },
  {
    id: "ganesha_race", title: "Ganesha's Race Around the World", category: "Ganesha", emoji: "🌍",
    body: "One day, Ganesha's brother Kartikeya challenged him to a race: whoever could circle the entire world three times first would win a special golden mango. Kartikeya jumped onto his fast peacock and zoomed off immediately, certain he would win easily.\n\nGanesha looked at his own ride — a small, slow mouse — and knew he could never out-fly a peacock. So instead of racing around the world, he did something different. He walked in a slow circle around his mother and father, Parvati and Shiva, three times, and then sat down calmly.\n\n\"What are you doing?\" everyone asked. \"You haven't even left!\"\n\nGanesha smiled. \"My parents mean more to me than the whole world. Circling them three times with love is the same as circling the world three times.\"\n\nEveryone agreed Ganesha's wisdom had won the race, even without moving very far at all — and he happily received the golden mango.",
    moral: "Cleverness and love can matter more than speed or strength — and there's nothing more valuable than honoring your parents.",
  },
  {
    id: "elephant_blind_men", title: "The Elephant and the Six Blind Men", category: "Wisdom Tales", emoji: "🐘",
    body: "Six blind men had never encountered an elephant before, so one day they went to feel one and find out what it was like. Each man touched a different part of the elephant.\n\nThe one who touched the ear said, \"An elephant is like a big fan!\" The one who touched the leg said, \"No, it's like a sturdy tree trunk!\" The one who touched the tail said, \"You're both wrong — it's like a thin rope!\" The one who touched the trunk said, \"It's like a thick snake!\" Each man was so sure he was completely right that they began to argue loudly.\n\nA wise traveler passing by heard the commotion and smiled. \"You are each right about the part you touched,\" he said, \"but none of you has felt the whole elephant. Maybe if you listened to each other instead of arguing, you'd understand the whole picture together.\"\n\nThe six men sat down, shared what each had felt, and for the first time, began to understand what an elephant truly was.",
    moral: "Everyone sees only part of the truth from where they stand. Listening to others' perspectives helps us understand the whole picture.",
  },
];

/* ---------- Shared UI bits ---------- */

function ScrollCard({ children }) {
  return (
    <div className="relative">
      <div
        className="absolute -top-3 left-0 right-0 h-6"
        style={{
          background:
            "radial-gradient(circle at 12px 0, transparent 12px, #FFFDF8 13px) repeat-x",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="rounded-b-3xl px-6 py-7 md:px-9 md:py-9 shadow-[0_10px_30px_-12px_rgba(31,59,115,0.35)]"
        style={{
          background:
            "linear-gradient(180deg, #FFFDF8 0%, #FFF8EC 100%)",
          border: "1px solid #EADFC8",
          borderTop: "none",
        }}
      >
        {children}
      </div>
      <div
        className="absolute -bottom-3 left-0 right-0 h-6 rounded-b-3xl"
        style={{
          background:
            "radial-gradient(circle at 12px 24px, transparent 12px, #FFF8EC 13px) repeat-x",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}

function Pill({ label, text, color }) {
  if (!text) return null;
  return (
    <div
      className="rounded-2xl px-4 py-3 mt-3"
      style={{ background: `${color}22`, border: `1px solid ${color}55` }}
    >
      <div className="text-xs font-bold uppercase tracking-wide" style={{ color, fontFamily: "'Baloo 2'" }}>
        {label}
      </div>
      <div className="mt-1 text-[#1F3B73]" style={{ fontFamily: "'Nunito'" }}>
        {text}
      </div>
    </div>
  );
}

function StoryDisplay({ story }) {
  return (
    <ScrollCard>
      <h3 className="text-2xl md:text-3xl font-extrabold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>
        {story.title}
      </h3>
      {story.sourceEpic && (
        <div className="text-sm italic text-[#B08D3E] mt-1" style={{ fontFamily: "'Nunito'" }}>
          from {story.sourceEpic}
        </div>
      )}
      <p className="mt-4 leading-relaxed text-[#1F3B73]" style={{ fontFamily: "'Nunito'", fontSize: "17px" }}>
        {story.body}
      </p>
      <Pill label="Moral" text={story.moral} color="#3D9970" />
      <Pill label="Today's Challenge" text={story.challenge} color="#E94F80" />
    </ScrollCard>
  );
}

function PrimaryButton({ children, onClick, disabled, color = "#FF9933" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-2xl px-6 py-3 font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
      style={{ background: color, fontFamily: "'Baloo 2'", boxShadow: `0 6px 0 ${shade(color)}` }}
    >
      {children}
    </button>
  );
}

function shade(hex) {
  // crude darken for a button "pressed edge" look
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - 40);
  const g = Math.max(0, ((n >> 8) & 0xff) - 40);
  const b = Math.max(0, (n & 0xff) - 40);
  return `rgb(${r},${g},${b})`;
}

function shuffleArray(arr) {
  return [...arr].map((v) => ({ v, k: Math.random() })).sort((a, b) => a.k - b.k).map((x) => x.v);
}

function LoadingLamp({ label }) {
  return (
    <div className="flex items-center gap-3 text-[#1F3B73] mt-4" style={{ fontFamily: "'Nunito'" }}>
      <span className="inline-block w-5 h-5 rounded-full border-4 border-[#FF9933] border-t-transparent animate-spin" />
      {label}
    </div>
  );
}

/* ---------- Shared stats (feeds Parent Dashboard) ----------
   Persisted to localStorage so progress survives refresh and closing the
   tab — appropriate here because this is a real deployed site (not a
   Claude artifact), and each friend/family member has their own device, so
   storing progress locally per-browser is exactly the right model: no
   accounts, no shared server-side data, nothing to sync across people. */

const STORAGE_KEY = "mld_progress_v1";

function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null; // corrupted or blocked storage — fall back to a fresh start
  }
}

function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Storage full or blocked (e.g. private browsing) — fail silently;
    // the app still works, it just won't persist this session.
  }
}

const defaultStats = {
  storiesCompleted: 0,
  questionsAsked: 0,
  shlokasLearned: 0,
  learnedShlokaIds: [],
  kindnessScore: 0,
  gratitudeStreak: 0,
  gratitudeDates: [],
  gratitudeEntries: [], // [{ date, good, helpedMe, iHelped, madeMeSmile }]
};

const StatsContext = createContext(null);
function useStats() {
  return useContext(StatsContext);
}

function StatsProvider({ children }) {
  const [stats, setStats] = useState(() => ({ ...defaultStats, ...(loadStats() || {}) }));

  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  const bump = (key, by = 1) => setStats((s) => ({ ...s, [key]: s[key] + by }));

  const recordGratitudeToday = (entry) => {
    const today = new Date().toDateString();
    setStats((s) => {
      if (s.gratitudeDates.includes(today)) return s;
      const dates = [...s.gratitudeDates, today];
      const entries = entry ? [{ date: today, ...entry }, ...s.gratitudeEntries] : s.gratitudeEntries;
      return {
        ...s,
        gratitudeDates: dates,
        gratitudeEntries: entries,
        gratitudeStreak: s.gratitudeStreak + 1,
        kindnessScore: s.kindnessScore + 3,
      };
    });
  };

  const markShlokaLearned = (id) => {
    setStats((s) => {
      if (s.learnedShlokaIds.includes(id)) return s;
      return {
        ...s,
        learnedShlokaIds: [...s.learnedShlokaIds, id],
        shlokasLearned: s.shlokasLearned + 1,
      };
    });
  };

  const resetProgress = () => {
    setStats({ ...defaultStats });
  };

  return (
    <StatsContext.Provider value={{ stats, bump, recordGratitudeToday, markShlokaLearned, resetProgress }}>
      {children}
    </StatsContext.Provider>
  );
}

/* ---------- Feature: Ask Why (Story Engine) ---------- */

function StoryEngineScreen() {
  const { bump } = useStats();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState(null);
  const [error, setError] = useState(null);
  const suggestions = ["Why should I tell the truth?", "Why should I share?", "Why should I help others?", "Why should I be patient?"];

  const ask = async (q) => {
    if (!q.trim()) return;
    setLoading(true); setError(null); setStory(null);
    try {
      const prompt = `${SAFETY_RULES}\n\nA 7-year-old child asked: "${q}"\n\nFind the value behind this question and tell a short story (3-5 minutes read aloud) from Hindu mythology or Panchatantra/Hitopadesha that teaches it.\n\nRespond ONLY with JSON, no markdown fences:\n{"title": "string", "sourceEpic": "string", "body": "string, 150-300 words", "moral": "string", "challenge": "string, one simple real-life action for today"}`;
      const text = await callAI(prompt, 900);
      setStory(parseStoryJson(text));
      bump("storiesCompleted");
    } catch (e) {
      setError("Couldn't fetch a story right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && ask(question)}
        placeholder="Why should I...?"
        className="w-full rounded-2xl border-2 border-[#EADFC8] px-5 py-3 text-lg outline-none focus:border-[#FF9933] bg-white"
        style={{ fontFamily: "'Nunito'" }}
      />
      <div className="flex flex-wrap gap-2 mt-3">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => { setQuestion(s); ask(s); }}
            className="text-sm px-3 py-1.5 rounded-full bg-[#FF9933]/15 text-[#1F3B73] font-semibold hover:bg-[#FF9933]/25"
            style={{ fontFamily: "'Nunito'" }}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <PrimaryButton onClick={() => ask(question)} disabled={loading}>
          {loading ? "Thinking..." : "Tell Me a Story"}
        </PrimaryButton>
      </div>
      {error && <div className="text-[#E94F80] mt-3">{error}</div>}
      {loading && <LoadingLamp label="Finding the perfect story..." />}
      {story && <div className="mt-6"><StoryDisplay story={story} /></div>}
    </div>
  );
}

/* ---------- Feature: Chatbot ---------- */

function ChatbotScreen() {
  const { bump } = useStats();
  const [messages, setMessages] = useState([
    { fromChild: false, text: "Hi! I'm your story friend. Ask me who Krishna is, why Ganesha has an elephant head, or anything else!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const q = input.trim();
    if (!q) return;
    setMessages((m) => [...m, { fromChild: true, text: q }]);
    setInput("");
    setLoading(true);
    try {
      const prompt = `${SAFETY_RULES}\n\nA 7-year-old child asked: "${q}"\n\nAnswer in 2-4 short, warm sentences a child that age can understand. You may include one fun fact. No markdown formatting.`;
      const answer = await callAI(prompt, 300);
      setMessages((m) => [...m, { fromChild: false, text: answer }]);
      bump("questionsAsked");
    } catch {
      setMessages((m) => [...m, { fromChild: false, text: "Hmm, let's try asking that again in a moment!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "60vh" }}>
      <div className="flex-1 overflow-y-auto rounded-2xl bg-white border border-[#EADFC8] p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.fromChild ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[75%] rounded-2xl px-4 py-2.5"
              style={{
                background: m.fromChild ? "#FF993333" : "#3D997026",
                fontFamily: "'Nunito'",
                color: "#1F3B73",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && <LoadingLamp label="Typing..." />}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 mt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type your question..."
          className="flex-1 rounded-2xl border-2 border-[#EADFC8] px-4 py-2.5 outline-none focus:border-[#FF9933] bg-white"
          style={{ fontFamily: "'Nunito'" }}
        />
        <PrimaryButton onClick={send} disabled={loading} color="#3D9970">Send</PrimaryButton>
      </div>
    </div>
  );
}

/* ---------- Feature: Personalized Story ---------- */

function PersonalizedStoryScreen() {
  const { bump } = useStats();
  const [name, setName] = useState("");
  const [animal, setAnimal] = useState("");
  const [hobby, setHobby] = useState("");
  const [age, setAge] = useState(7);
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState(null);
  const [error, setError] = useState(null);

  const generate = async () => {
    if (!name.trim()) { setError("Please enter the child's name."); return; }
    setLoading(true); setError(null); setStory(null);
    try {
      const prompt = `${SAFETY_RULES}\n\nWrite a short adventure (150-300 words) starring a ${age}-year-old child named ${name} who loves ${animal || "animals"} and ${hobby || "playing"}. Have them meet a Hindu mythology character (Hanuman, Krishna, or Ganesha) and learn a value together through the child's own interests.\n\nRespond ONLY with JSON, no markdown fences:\n{"title": "string", "sourceEpic": "string", "body": "string", "moral": "string", "challenge": "string, one simple real-life action for today"}`;
      const text = await callAI(prompt, 900);
      setStory(parseStoryJson(text));
      bump("storiesCompleted");
    } catch {
      setError("Couldn't create the story right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="grid gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Child's name"
          className="rounded-2xl border-2 border-[#EADFC8] px-5 py-3 outline-none focus:border-[#FF9933] bg-white" style={{ fontFamily: "'Nunito'" }} />
        <input value={animal} onChange={(e) => setAnimal(e.target.value)} placeholder="Favorite animal"
          className="rounded-2xl border-2 border-[#EADFC8] px-5 py-3 outline-none focus:border-[#FF9933] bg-white" style={{ fontFamily: "'Nunito'" }} />
        <input value={hobby} onChange={(e) => setHobby(e.target.value)} placeholder="Favorite hobby"
          className="rounded-2xl border-2 border-[#EADFC8] px-5 py-3 outline-none focus:border-[#FF9933] bg-white" style={{ fontFamily: "'Nunito'" }} />
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>Age: {age}</span>
          <input type="range" min="3" max="12" value={age} onChange={(e) => setAge(+e.target.value)} className="flex-1 accent-[#FF9933]" />
        </div>
      </div>
      <div className="mt-4">
        <PrimaryButton onClick={generate} disabled={loading} color="#E94F80">
          {loading ? "Creating..." : "Create My Story"}
        </PrimaryButton>
      </div>
      {error && <div className="text-[#E94F80] mt-3">{error}</div>}
      {loading && <LoadingLamp label="Weaving your adventure..." />}
      {story && <div className="mt-6"><StoryDisplay story={story} /></div>}
    </div>
  );
}

/* ---------- Feature: Bedtime Stories ---------- */

function BedtimeStoriesScreen() {
  const [open, setOpen] = useState(null);
  return (
    <div className="max-w-2xl mx-auto grid gap-3">
      {SEED_BEDTIME_STORIES.map((s) => (
        <div key={s.id} className="rounded-2xl bg-white border border-[#EADFC8] overflow-hidden">
          <button
            onClick={() => setOpen(open === s.id ? null : s.id)}
            className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-[#1F3B73]/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xl" style={{ background: "#1F3B7322" }}>
              {s.emoji}
            </div>
            <div className="flex-1">
              <div className="font-bold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>{s.title}</div>
              <div className="text-sm text-[#1F3B73]/70" style={{ fontFamily: "'Nunito'" }}>{s.category}</div>
            </div>
            <div className="text-[#1F3B73]/40">{open === s.id ? "▲" : "▼"}</div>
          </button>
          {open === s.id && (
            <div className="px-5 pb-5" style={{ fontFamily: "'Nunito'" }}>
              {s.body.split("\n\n").map((para, i) => (
                <p key={i} className="text-[#1F3B73] leading-relaxed mb-3" style={{ fontSize: "16px" }}>{para}</p>
              ))}
              <Pill label="Moral" text={s.moral} color="#3D9970" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- Feature: Shlokas ---------- */

// Finds a shloka from our curated library by matching the user's request
// against titles, meanings, and word glosses. Deliberately does NOT ask the
// AI to invent new Sanskrit text — hallucinated scripture is a real
// accuracy risk, so the AI is only ever asked to pick from this known list,
// never to generate new verses.
function localShlokaMatch(query) {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  // Exact or partial title match first.
  const titleMatch = SEED_SHLOKAS.find((s) => s.title.toLowerCase().includes(q) || q.includes(s.title.toLowerCase()));
  if (titleMatch) return titleMatch;

  // Otherwise score each shloka by how many of the query's words appear in
  // its title, meaning, or word-by-word glosses.
  const queryWords = q.split(/\s+/).filter((w) => w.length > 3); // skip tiny words like "the"
  if (queryWords.length === 0) return null;

  let best = null;
  let bestScore = 0;
  for (const s of SEED_SHLOKAS) {
    const haystack = [s.title, s.meaning, ...s.words.map(([, m]) => m)].join(" ").toLowerCase();
    const score = queryWords.filter((w) => haystack.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return bestScore > 0 ? best : null;
}

async function aiShlokaMatch(query) {
  const catalog = SEED_SHLOKAS.map((s) => `${s.id}: "${s.title}" — ${s.meaning}`).join("\n");
  const prompt = `A child is looking for a shloka (Sanskrit verse) in our library. They asked: "${query}"

Here is the full library, each line "id: title — meaning":
${catalog}

Pick the ONE entry that best matches what they're asking for. Respond with ONLY the id (the part before the colon), nothing else. If truly nothing in the list relates to their request at all, respond with exactly: none`;

  const text = await callAI(prompt, 50);
  const id = text.trim().toLowerCase();
  return SEED_SHLOKAS.find((s) => s.id === id) || null;
}

// Same shloka for everyone on a given calendar day, rotating through the
// whole library — deterministic (no storage needed) and changes daily.
function getDailyShloka() {
  const dayNumber = Math.floor(Date.now() / 86400000); // days since epoch
  const index = dayNumber % SEED_SHLOKAS.length;
  return SEED_SHLOKAS[index];
}

function ShlokaScreen() {
  const { stats, markShlokaLearned } = useStats();
  const [open, setOpen] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState("checking"); // "checking" | "hindi" | "none"
  const [speaking, setSpeaking] = useState(null);
  const voiceRef = useRef(null);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!window.speechSynthesis) { setVoiceStatus("none"); return; }
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const sanskrit = voices.find((v) => v.lang?.toLowerCase().startsWith("sa"));
      const hindiVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith("hi"));
      const bestHindi = hindiVoices.find((v) => /google|natural|premium/i.test(v.name)) || hindiVoices[0];
      const chosen = sanskrit || bestHindi;
      voiceRef.current = chosen || null;
      setVoiceStatus(chosen ? "hindi" : "none");
    };
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }, []);

  const speak = (shloka) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const useHindi = voiceStatus === "hindi";
    const source = useHindi ? shloka.sanskrit : shloka.transliteration;
    const phrases = source.split(/[।॥\n]+/).map((p) => p.trim()).filter(Boolean);

    setSpeaking(shloka.id);
    let i = 0;
    const speakNext = () => {
      if (i >= phrases.length) { setSpeaking(null); return; }
      const utter = new SpeechSynthesisUtterance(phrases[i]);
      utter.rate = 0.6;
      utter.pitch = 1;
      if (useHindi && voiceRef.current) {
        utter.voice = voiceRef.current;
        utter.lang = voiceRef.current.lang;
      } else {
        utter.lang = "en-IN";
      }
      utter.onend = () => { i++; setTimeout(speakNext, 350); };
      utter.onerror = () => { i++; speakNext(); };
      window.speechSynthesis.speak(utter);
    };
    speakNext();
  };

  const markLearned = (id) => {
    markShlokaLearned(id);
  };

  const askForShloka = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setNotFound(false);
    // Try a free, instant local match first; only call the AI if that fails.
    let match = localShlokaMatch(query);
    if (!match) {
      try {
        match = await aiShlokaMatch(query);
      } catch {
        match = null;
      }
    }
    setSearching(false);
    if (match) {
      setOpen(match.id);
      setQuery("");
      // Scroll the matched card into view.
      setTimeout(() => {
        document.getElementById(`shloka-${match.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    } else {
      setNotFound(true);
    }
  };

  const daily = getDailyShloka();

  return (
    <div className="max-w-2xl mx-auto grid gap-3">
      <button
        onClick={() => { setOpen(daily.id); setTimeout(() => document.getElementById(`shloka-${daily.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50); }}
        className="text-left rounded-2xl p-4 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #FF993322, #E94F8022)", border: "1px solid #FF993355" }}
      >
        <div className="text-3xl">📅</div>
        <div className="flex-1">
          <div className="text-xs font-bold uppercase tracking-wide text-[#B08D3E]">Today's Shloka</div>
          <div className="font-bold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>{daily.title}</div>
        </div>
        <div className="text-[#1F3B73]/50">→</div>
      </button>

      <div className="rounded-2xl bg-white border-2 border-[#EADFC8] p-4">
        <div className="text-sm font-bold text-[#1F3B73] mb-2" style={{ fontFamily: "'Baloo 2'" }}>
          Which shloka would you like to learn?
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setNotFound(false); }}
            onKeyDown={(e) => e.key === "Enter" && askForShloka()}
            placeholder='e.g. "Gayatri Mantra" or "a shloka about courage"'
            className="flex-1 rounded-xl border-2 border-[#EADFC8] px-4 py-2.5 outline-none focus:border-[#FF9933]"
            style={{ fontFamily: "'Nunito'" }}
          />
          <PrimaryButton onClick={askForShloka} disabled={searching} color="#3D9970">
            {searching ? "..." : "Find It"}
          </PrimaryButton>
        </div>
        {notFound && (
          <div className="text-sm text-[#E94F80] mt-2" style={{ fontFamily: "'Nunito'" }}>
            We don't have one that matches yet — try browsing the list below, or ask for
            one about truth, courage, kindness, hard work, gratitude, or unity.
          </div>
        )}
      </div>

      <div className="text-xs rounded-xl px-4 py-2.5" style={{ background: "#1F3B7314", color: "#1F3B73", fontFamily: "'Nunito'" }}>
        {voiceStatus === "none"
          ? "This browser has no Hindi voice installed, so playback uses an English voice — pronunciation will be rough. Chrome on Android/Windows usually has a built-in Hindi voice; Safari often doesn't."
          : "Playing with the closest available voice (Hindi, not Sanskrit — no browser ships a true Sanskrit voice). For real accuracy, the shipped app should use recordings of a native speaker rather than text-to-speech."}
      </div>

      {SEED_SHLOKAS.map((s) => (
        <div key={s.id} id={`shloka-${s.id}`} className="rounded-2xl bg-white border border-[#EADFC8] overflow-hidden scroll-mt-4">
          <button onClick={() => setOpen(open === s.id ? null : s.id)} className="w-full text-left px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#FF993322" }}>🕉️</div>
            <div className="flex-1">
              <div className="font-bold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>{s.title}</div>
              <div className="text-sm text-[#1F3B73]/70 truncate" style={{ fontFamily: "'Nunito'" }}>{s.transliteration}</div>
            </div>
            {stats.learnedShlokaIds.includes(s.id) && <span className="text-lg">✅</span>}
          </button>
          {open === s.id && (
            <div className="px-5 pb-5" style={{ fontFamily: "'Nunito'" }}>
              <div className="text-center text-lg py-3 rounded-xl" style={{ background: "#FFF8EC", whiteSpace: "pre-line", lineHeight: 1.8 }}>{s.sanskrit}</div>
              <div className="flex gap-2 justify-center mt-3">
                <PrimaryButton onClick={() => speak(s)} color="#3D9970">
                  {speaking === s.id ? "🔊 Playing..." : "🔊 Listen"}
                </PrimaryButton>
                <PrimaryButton onClick={() => speak(s)} color="#E94F80">🎤 Practice</PrimaryButton>
              </div>
              <div className="mt-4">
                <div className="text-xs font-bold uppercase text-[#B08D3E]">Meaning</div>
                <div className="text-[#1F3B73] mt-1">{s.meaning}</div>
              </div>
              <div className="mt-4">
                <div className="text-xs font-bold uppercase text-[#B08D3E]">Word by Word</div>
                {s.words.map(([w, m]) => (
                  <div key={w} className="text-sm mt-1"><span className="font-bold text-[#1F3B73]">{w}:</span> <span className="text-[#1F3B73]/80">{m}</span></div>
                ))}
              </div>
              <div className="mt-4">
                <PrimaryButton onClick={() => markLearned(s.id)} color="#FF9933">
                  {stats.learnedShlokaIds.includes(s.id) ? "Marked as Learned ✓" : "I've Learned This"}
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- Feature: Games ---------- */

function GamesHubScreen({ onOpenGame }) {
  const tiles = [
    { id: "memory", title: "Memory Match", emoji: "🃏", color: "#E94F80" },
    { id: "quiz", title: "Mythology Quiz", emoji: "❓", color: "#3D9970" },
    { id: "wordsearch", title: "Word Search", emoji: "🔤", color: "#FF9933" },
    { id: "spotdiff", title: "Spot the Difference", emoji: "🔍", color: "#1F3B73" },
    { id: "temple", title: "Temple Builder", emoji: "🛕", color: "#8B5CF6" },
    { id: "hanumanleap", title: "Hanuman's Leap", emoji: "🐒", color: "#3D9970" },
  ];
  return (
    <div className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-4">
      {tiles.map((t) => (
        <button key={t.id} onClick={() => onOpenGame(t.id)}
          className="rounded-3xl p-8 text-center transition-transform hover:-translate-y-0.5"
          style={{ background: `${t.color}1A`, border: `1px solid ${t.color}40` }}>
          <div className="text-5xl">{t.emoji}</div>
          <div className="mt-3 font-extrabold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>{t.title}</div>
        </button>
      ))}
    </div>
  );
}

function MemoryMatchGame() {
  const { bump } = useStats();
  const shuffle = () => {
    const pairs = [...MEMORY_CHARACTERS, ...MEMORY_CHARACTERS]
      .map((c) => ({ c, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.c);
    return pairs;
  };
  const [cards, setCards] = useState(shuffle);
  const [revealed, setRevealed] = useState(Array(12).fill(false));
  const [matched, setMatched] = useState(Array(12).fill(false));
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);
  const [won, setWon] = useState(false);

  const newGame = () => {
    setCards(shuffle()); setRevealed(Array(12).fill(false)); setMatched(Array(12).fill(false));
    setSelected([]); setMoves(0); setBusy(false); setWon(false);
  };

  const tap = (i) => {
    if (busy || revealed[i] || matched[i]) return;
    const nextRevealed = [...revealed]; nextRevealed[i] = true;
    setRevealed(nextRevealed);
    const nextSelected = [...selected, i];
    setSelected(nextSelected);
    if (nextSelected.length === 2) {
      setBusy(true);
      setMoves((m) => m + 1);
      const [a, b] = nextSelected;
      if (cards[a] === cards[b]) {
        setTimeout(() => {
          const nm = [...matched]; nm[a] = true; nm[b] = true;
          setMatched(nm); setSelected([]); setBusy(false);
          if (nm.every((m) => m)) { setWon(true); bump("kindnessScore", 5); }
        }, 200);
      } else {
        setTimeout(() => {
          const nr = [...nextRevealed]; nr[a] = false; nr[b] = false;
          setRevealed(nr); setSelected([]); setBusy(false);
        }, 700);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <span style={{ fontFamily: "'Nunito'" }}>Moves: {moves}</span>
        <button onClick={newGame} className="text-sm font-semibold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>↻ Restart</button>
      </div>
      {won && <div className="text-center mb-3 font-bold text-[#3D9970]" style={{ fontFamily: "'Baloo 2'" }}>You won in {moves} moves! 🎉</div>}
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c, i) => {
          const shown = revealed[i] || matched[i];
          return (
            <div key={i} onClick={() => tap(i)}
              className="aspect-square rounded-2xl flex items-center justify-center text-3xl cursor-pointer transition-colors"
              style={{ background: matched[i] ? "#3D997055" : shown ? "#FF993333" : "#1F3B73" }}>
              {shown ? c : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuizGame() {
  const { bump } = useStats();
  const [setName, setSetName] = useState(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);

  if (!setName) {
    return (
      <div className="max-w-md mx-auto grid gap-3">
        {Object.keys(QUIZ_SETS).map((name) => (
          <button key={name} onClick={() => setSetName(name)}
            className="text-left rounded-2xl bg-white border border-[#EADFC8] px-5 py-4">
            <div className="font-bold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>{name}</div>
            <div className="text-sm text-[#1F3B73]/70">{QUIZ_SETS[name].length} questions</div>
          </button>
        ))}
      </div>
    );
  }

  const questions = QUIZ_SETS[setName];
  if (done) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="text-5xl">🎉</div>
        <div className="mt-3 text-xl font-extrabold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>You scored {score} / {questions.length}</div>
        <div className="mt-5"><PrimaryButton onClick={() => { setSetName(null); setIndex(0); setScore(0); setSelected(null); setDone(false); }}>Back to Games</PrimaryButton></div>
      </div>
    );
  }

  const q = questions[index];
  const answer = (i) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correct) setScore((s) => s + 1);
  };
  const next = () => {
    if (index === questions.length - 1) { bump("kindnessScore", score * 2); setDone(true); }
    else { setIndex((i) => i + 1); setSelected(null); }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-sm text-[#1F3B73]/60 mb-2">{setName} · {index + 1}/{questions.length}</div>
      <div className="text-lg font-bold text-[#1F3B73] mb-4" style={{ fontFamily: "'Baloo 2'" }}>{q.q}</div>
      <div className="grid gap-2">
        {q.options.map((opt, i) => {
          let bg = "#FFFFFF";
          if (selected !== null) {
            if (i === q.correct) bg = "#3D997055";
            else if (i === selected) bg = "#E94F8033";
          }
          return (
            <button key={i} onClick={() => answer(i)} className="text-left px-4 py-3 rounded-xl border border-[#EADFC8]" style={{ background: bg }}>
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && <div className="mt-4"><PrimaryButton onClick={next}>{index === questions.length - 1 ? "Finish" : "Next"}</PrimaryButton></div>}
    </div>
  );
}

/* ---------- Game: Word Search ---------- */

const WORD_SEARCH_WORDS = ["RAMA", "SITA", "KRISHNA", "HANUMAN", "GANESHA", "DHARMA", "SHIVA", "GITA"];
const WORD_SEARCH_SIZE = 12;

function generateWordSearchGrid() {
  const grid = Array.from({ length: WORD_SEARCH_SIZE }, () => Array(WORD_SEARCH_SIZE).fill(null));
  const directions = [
    [0, 1],  // right
    [1, 0],  // down
    [1, 1],  // diagonal down-right
  ];
  const placements = [];

  for (const word of WORD_SEARCH_WORDS) {
    let placed = false;
    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
      const [dr, dc] = directions[Math.floor(Math.random() * directions.length)];
      const maxRow = WORD_SEARCH_SIZE - (dr ? word.length : 1);
      const maxCol = WORD_SEARCH_SIZE - (dc ? word.length : 1);
      if (maxRow < 0 || maxCol < 0) continue;
      const row = Math.floor(Math.random() * (maxRow + 1));
      const col = Math.floor(Math.random() * (maxCol + 1));

      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const r = row + dr * i, c = col + dc * i;
        if (grid[r][c] !== null && grid[r][c] !== word[i]) { fits = false; break; }
      }
      if (!fits) continue;

      const cells = [];
      for (let i = 0; i < word.length; i++) {
        const r = row + dr * i, c = col + dc * i;
        grid[r][c] = word[i];
        cells.push(`${r}-${c}`);
      }
      placements.push({ word, cells });
      placed = true;
    }
  }

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < WORD_SEARCH_SIZE; r++) {
    for (let c = 0; c < WORD_SEARCH_SIZE; c++) {
      if (grid[r][c] === null) grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
    }
  }
  return { grid, placements };
}

function WordSearchGame() {
  const { bump } = useStats();
  const [puzzle, setPuzzle] = useState(generateWordSearchGrid);
  const [selecting, setSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [foundCells, setFoundCells] = useState(new Set());

  const newGame = () => {
    setPuzzle(generateWordSearchGrid());
    setSelectedCells([]);
    setFoundWords([]);
    setFoundCells(new Set());
  };

  const cellKey = (r, c) => `${r}-${c}`;

  const startSelect = (r, c) => {
    setSelecting(true);
    setSelectedCells([cellKey(r, c)]);
  };

  const dragOver = (r, c) => {
    if (!selecting) return;
    const start = selectedCells[0];
    if (!start) return;
    const [sr, sc] = start.split("-").map(Number);
    const dr = Math.sign(r - sr), dc = Math.sign(c - sc);
    // Only allow straight lines (horizontal, vertical, diagonal)
    if (dr !== 0 && dc !== 0 && Math.abs(r - sr) !== Math.abs(c - sc)) return;
    const cells = [];
    const steps = Math.max(Math.abs(r - sr), Math.abs(c - sc));
    for (let i = 0; i <= steps; i++) {
      cells.push(cellKey(sr + dr * i, sc + dc * i));
    }
    setSelectedCells(cells);
  };

  const endSelect = () => {
    setSelecting(false);
    const selectedWord = selectedCells.map((k) => {
      const [r, c] = k.split("-").map(Number);
      return puzzle.grid[r][c];
    }).join("");
    const reversed = selectedWord.split("").reverse().join("");

    const match = puzzle.placements.find(
      (p) => (p.word === selectedWord || p.word === reversed) && !foundWords.includes(p.word)
    );
    if (match) {
      setFoundWords((f) => [...f, match.word]);
      setFoundCells((prev) => new Set([...prev, ...match.cells]));
      if (foundWords.length + 1 === WORD_SEARCH_WORDS.length) {
        bump("kindnessScore", 8);
      }
    }
    setSelectedCells([]);
  };

  const allFound = foundWords.length === WORD_SEARCH_WORDS.length;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-[#1F3B73]/70" style={{ fontFamily: "'Nunito'" }}>
          Found {foundWords.length} / {WORD_SEARCH_WORDS.length}
        </div>
        <button onClick={newGame} className="text-sm font-semibold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>↻ New Puzzle</button>
      </div>
      {allFound && <div className="text-center mb-3 font-bold text-[#3D9970]" style={{ fontFamily: "'Baloo 2'" }}>You found them all! 🎉</div>}

      <div
        className="grid select-none touch-none"
        style={{ gridTemplateColumns: `repeat(${WORD_SEARCH_SIZE}, minmax(0, 1fr))`, gap: "2px" }}
        onMouseLeave={() => { if (selecting) endSelect(); }}
      >
        {puzzle.grid.map((row, r) =>
          row.map((letter, c) => {
            const key = cellKey(r, c);
            const isSelected = selectedCells.includes(key);
            const isFound = foundCells.has(key);
            return (
              <div
                key={key}
                onMouseDown={() => startSelect(r, c)}
                onMouseEnter={() => dragOver(r, c)}
                onMouseUp={endSelect}
                onTouchStart={() => startSelect(r, c)}
                className="aspect-square flex items-center justify-center text-xs font-bold rounded cursor-pointer"
                style={{
                  background: isFound ? "#3D997055" : isSelected ? "#FF993355" : "#FFFDF8",
                  border: "1px solid #EADFC8",
                  color: "#1F3B73",
                  fontFamily: "'Nunito'",
                }}
              >
                {letter}
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {WORD_SEARCH_WORDS.map((w) => (
          <span
            key={w}
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{
              background: foundWords.includes(w) ? "#3D997040" : "#1F3B7314",
              color: foundWords.includes(w) ? "#3D9970" : "#1F3B73",
              textDecoration: foundWords.includes(w) ? "line-through" : "none",
            }}
          >
            {w}
          </span>
        ))}
      </div>
      <div className="text-xs text-center text-[#1F3B73]/50 mt-3" style={{ fontFamily: "'Nunito'" }}>
        Click and drag across letters to find each word.
      </div>
    </div>
  );
}

/* ---------- Game: Spot the Difference ---------- */

const SPOT_DIFF_ICONS = ["🪷", "🕉️", "🐒", "🦚", "🐘", "🏹", "🐄", "🌙", "⭐", "🔔", "🪈", "🎨"];
const SPOT_DIFF_GRID = 6; // 6x6

function generateSpotDiffBoards() {
  const cellCount = SPOT_DIFF_GRID * SPOT_DIFF_GRID;
  const base = Array.from({ length: cellCount }, () => SPOT_DIFF_ICONS[Math.floor(Math.random() * SPOT_DIFF_ICONS.length)]);
  const modified = [...base];

  const diffCount = 4;
  const diffIndices = new Set();
  while (diffIndices.size < diffCount) {
    diffIndices.add(Math.floor(Math.random() * cellCount));
  }
  diffIndices.forEach((i) => {
    let newIcon;
    do { newIcon = SPOT_DIFF_ICONS[Math.floor(Math.random() * SPOT_DIFF_ICONS.length)]; }
    while (newIcon === base[i]);
    modified[i] = newIcon;
  });

  return { base, modified, diffIndices };
}

function SpotDifferenceGame() {
  const { bump } = useStats();
  const [puzzle, setPuzzle] = useState(generateSpotDiffBoards);
  const [found, setFound] = useState(new Set());
  const [wrongFlash, setWrongFlash] = useState(null);

  const newGame = () => {
    setPuzzle(generateSpotDiffBoards());
    setFound(new Set());
  };

  const tapModified = (i) => {
    if (found.has(i)) return;
    if (puzzle.diffIndices.has(i)) {
      const next = new Set([...found, i]);
      setFound(next);
      if (next.size === puzzle.diffIndices.size) bump("kindnessScore", 6);
    } else {
      setWrongFlash(i);
      setTimeout(() => setWrongFlash(null), 400);
    }
  };

  const allFound = found.size === puzzle.diffIndices.size;

  const renderBoard = (icons, interactive) => (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${SPOT_DIFF_GRID}, minmax(0, 1fr))` }}>
      {icons.map((icon, i) => (
        <div
          key={i}
          onClick={interactive ? () => tapModified(i) : undefined}
          className="aspect-square rounded-lg flex items-center justify-center text-xl"
          style={{
            background: interactive && found.has(i) ? "#3D997055" : interactive && wrongFlash === i ? "#E94F8055" : "#FFFDF8",
            border: interactive && found.has(i) ? "2px solid #3D9970" : "1px solid #EADFC8",
            cursor: interactive ? "pointer" : "default",
          }}
        >
          {icon}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-[#1F3B73]/70" style={{ fontFamily: "'Nunito'" }}>
          Found {found.size} / {puzzle.diffIndices.size}
        </div>
        <button onClick={newGame} className="text-sm font-semibold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>↻ New Puzzle</button>
      </div>
      {allFound && <div className="text-center mb-3 font-bold text-[#3D9970]" style={{ fontFamily: "'Baloo 2'" }}>You spotted them all! 🎉</div>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-center text-[#1F3B73]/60 mb-1">Original</div>
          {renderBoard(puzzle.base, false)}
        </div>
        <div>
          <div className="text-xs text-center text-[#1F3B73]/60 mb-1">Find the differences here</div>
          {renderBoard(puzzle.modified, true)}
        </div>
      </div>
    </div>
  );
}

/* ---------- Game: Temple Builder ---------- */

const TEMPLE_PARTS = [
  { id: "foundation", label: "Foundation", emoji: "🟫", height: 22,
    fact: "Every temple starts with a strong, wide foundation, dug deep into the earth to hold everything above it steady." },
  { id: "steps", label: "Steps", emoji: "🪜", height: 16,
    fact: "Steps lead worshippers upward, out of the everyday world and into the sacred space." },
  { id: "pillars", label: "Pillars", emoji: "🏛️", height: 42,
    fact: "Carved pillars hold up the temple's roof and are often decorated with stories from the epics." },
  { id: "walls", label: "Walls", emoji: "🧱", height: 30,
    fact: "The walls enclose the garbhagriha — the quiet inner sanctum where the deity resides." },
  { id: "dome", label: "Dome (Shikhara)", emoji: "🔺", height: 52,
    fact: "The tower, or shikhara, rises upward like a mountain peak, said to reach toward the heavens." },
  { id: "flag", label: "Flag (Dhwaja)", emoji: "🚩", height: 20,
    fact: "A flag or finial crowns the very top of the temple, completing it." },
];

function TempleBuilderGame() {
  const { bump } = useStats();
  const [built, setBuilt] = useState([]);
  const [options, setOptions] = useState(() => shuffleArray(TEMPLE_PARTS.map((p) => p.id)));
  const [message, setMessage] = useState(null);
  const [wrongId, setWrongId] = useState(null);

  const nextNeeded = TEMPLE_PARTS[built.length];
  const complete = built.length === TEMPLE_PARTS.length;

  const tapPart = (id) => {
    if (complete) return;
    if (id === nextNeeded.id) {
      setBuilt((b) => [...b, id]);
      setMessage(nextNeeded.fact);
      if (built.length + 1 === TEMPLE_PARTS.length) bump("kindnessScore", 8);
    } else {
      setWrongId(id);
      setTimeout(() => setWrongId(null), 400);
    }
  };

  const newGame = () => {
    setBuilt([]);
    setOptions(shuffleArray(TEMPLE_PARTS.map((p) => p.id)));
    setMessage(null);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-[#1F3B73]/70" style={{ fontFamily: "'Nunito'" }}>Build from the ground up</div>
        <button onClick={newGame} className="text-sm font-semibold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>↻ Restart</button>
      </div>

      <div
        className="rounded-2xl border border-[#EADFC8] flex flex-col-reverse items-center justify-start p-3"
        style={{ height: 260, background: "linear-gradient(180deg, #FFF8EC, #FDEBD0)" }}
      >
        {built.map((id) => {
          const part = TEMPLE_PARTS.find((p) => p.id === id);
          return (
            <div
              key={id}
              className="flex items-center justify-center rounded-md mb-1 text-2xl"
              style={{ width: "70%", height: part.height, background: "#FF993322", border: "1px solid #FF993355" }}
            >
              {part.emoji}
            </div>
          );
        })}
      </div>

      {complete ? (
        <div className="text-center mt-4">
          <div className="text-4xl">🎉</div>
          <div className="font-bold text-[#1F3B73] mt-2" style={{ fontFamily: "'Baloo 2'" }}>You built the temple!</div>
        </div>
      ) : (
        <>
          <div className="text-center text-sm font-semibold text-[#1F3B73] mt-4 mb-2" style={{ fontFamily: "'Baloo 2'" }}>
            Tap the next piece to add
          </div>
          <div className="grid grid-cols-2 gap-2">
            {options.filter((id) => !built.includes(id)).map((id) => {
              const part = TEMPLE_PARTS.find((p) => p.id === id);
              return (
                <button
                  key={id}
                  onClick={() => tapPart(id)}
                  className="rounded-xl px-3 py-3 text-sm font-semibold border text-left"
                  style={{ background: wrongId === id ? "#E94F8033" : "#FFFFFF", borderColor: "#EADFC8", color: "#1F3B73" }}
                >
                  {part.emoji} {part.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {message && (
        <div className="mt-4 rounded-xl p-3 text-sm text-[#1F3B73]" style={{ background: "#3D997022", fontFamily: "'Nunito'" }}>
          {message}
        </div>
      )}
    </div>
  );
}

/* ---------- Game: Hanuman's Leap ---------- */

function HanumanFlyingGame() {
  const { bump } = useStats();
  const [gameState, setGameState] = useState("ready"); // ready | playing | gameover
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState([]); // [{ id, x }] x in % (0-105)
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [best, setBest] = useState(0);

  const isJumpingRef = useRef(false);
  const gameStateRef = useRef("ready");
  const scoreRef = useRef(0);
  const nextObstacleIn = useRef(60);
  const rafRef = useRef(null);
  const lastTime = useRef(0);
  const invincibleUntil = useRef(0);

  useEffect(() => { isJumpingRef.current = isJumping; }, [isJumping]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  const jump = () => {
    if (gameStateRef.current !== "playing" || isJumpingRef.current) return;
    setIsJumping(true);
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    setObstacles([]);
    nextObstacleIn.current = 60;
    lastTime.current = performance.now();
    setGameState("playing");
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    const tick = (time) => {
      const dt = Math.min(50, time - lastTime.current || 16);
      lastTime.current = time;
      const speed = 0.16 + Math.min(0.14, scoreRef.current * 0.0006);

      setObstacles((prev) => {
        let next = prev.map((o) => ({ ...o, x: o.x - speed * dt })).filter((o) => o.x > -8);

        nextObstacleIn.current -= dt / 16.6;
        if (nextObstacleIn.current <= 0) {
          next = [...next, { id: Math.random(), x: 105 }];
          nextObstacleIn.current = 55 + Math.random() * 30;
        }

        for (const o of next) {
          if (o.x < 17 && o.x > 5 && !isJumpingRef.current && time > invincibleUntil.current) {
            invincibleUntil.current = time + 1200;
            setLives((l) => {
              const nl = l - 1;
              if (nl <= 0) {
                setBest((b) => Math.max(b, Math.floor(scoreRef.current)));
                bump("kindnessScore", Math.min(10, Math.floor(scoreRef.current / 5)));
                setGameState("gameover");
              }
              return nl;
            });
          }
        }
        return next;
      });

      setScore((s) => s + dt / 100);

      if (gameStateRef.current === "playing") {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [gameState]);

  useEffect(() => {
    const onKey = (e) => { if (e.code === "Space") { e.preventDefault(); jump(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onJumpAnimEnd = () => setIsJumping(false);

  return (
    <div className="max-w-md mx-auto select-none">
      <style>{`
        @keyframes mld-hanuman-jump {
          0% { transform: translateY(0); }
          40% { transform: translateY(-68px); }
          100% { transform: translateY(0); }
        }
      `}</style>

      <div className="flex justify-between items-center mb-2 text-sm" style={{ fontFamily: "'Nunito'", color: "#1F3B73" }}>
        <div>{"❤️".repeat(Math.max(0, lives))}</div>
        <div>Score: {Math.floor(score)}</div>
      </div>

      <div
        onClick={jump}
        onTouchStart={(e) => { e.preventDefault(); jump(); }}
        className="relative rounded-2xl border border-[#EADFC8] overflow-hidden cursor-pointer"
        style={{ height: 220, background: "linear-gradient(180deg, #A7D8E8, #3D9970)" }}
      >
        {/* Ground line */}
        <div className="absolute left-0 right-0" style={{ bottom: 30, height: 2, background: "#1F3B7333" }} />

        {/* Hanuman */}
        <div
          onAnimationEnd={onJumpAnimEnd}
          className="absolute text-4xl"
          style={{
            left: "8%",
            bottom: 30,
            animation: isJumping ? "mld-hanuman-jump 0.6s ease" : "none",
          }}
        >
          🐒
        </div>

        {/* Obstacles (ocean waves) */}
        {obstacles.map((o) => (
          <div key={o.id} className="absolute text-3xl" style={{ left: `${o.x}%`, bottom: 26 }}>🌊</div>
        ))}

        {gameState === "ready" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6" style={{ background: "#00000030" }}>
            <div className="text-white font-bold text-lg mb-3" style={{ fontFamily: "'Baloo 2'" }}>
              Help Hanuman leap across the ocean to Lanka!
            </div>
            <PrimaryButton onClick={(e) => { e.stopPropagation(); startGame(); }} color="#FF9933">Start</PrimaryButton>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6" style={{ background: "#00000055" }}>
            <div className="text-white font-bold text-lg mb-1" style={{ fontFamily: "'Baloo 2'" }}>
              Great effort!
            </div>
            <div className="text-white text-sm mb-3">Score: {Math.floor(score)} · Best: {best}</div>
            <PrimaryButton onClick={(e) => { e.stopPropagation(); startGame(); }} color="#FF9933">Try Again</PrimaryButton>
          </div>
        )}
      </div>

      <div className="text-xs text-center text-[#1F3B73]/50 mt-3" style={{ fontFamily: "'Nunito'" }}>
        Tap the ocean, or press Space, to make Hanuman jump over the waves.
      </div>
    </div>
  );
}

/* ---------- Feature: Emotional Wellness ---------- */

function WellnessScreen() {
  const moods = [["Happy", "😊"], ["Sad", "😢"], ["Angry", "😠"], ["Scared", "😨"], ["Excited", "🤩"], ["Lonely", "🥺"]];
  const [mood, setMood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [breathing, setBreathing] = useState(false);

  const pick = async (m) => {
    setMood(m); setLoading(true); setResult(null); setBreathing(false);
    try {
      const prompt = `${SAFETY_RULES}\n\nA 7-year-old child says they are feeling "${m}" today.\n\nRespond ONLY with JSON, no markdown fences:\n{"affirmation": "one warm sentence to the child", "activitySuggestion": "one simple activity in 1 sentence", "storyHook": "one sentence teasing a mythology story that fits this feeling"}`;
      const text = await callAI(prompt, 400);
      const cleaned = text.replace(/^```json/i, "").replace(/```$/, "").trim();
      setResult(JSON.parse(cleaned));
    } catch {
      setResult({ affirmation: "Whatever you're feeling is okay. I'm here with you.", activitySuggestion: "Let's take three slow breaths together.", storyHook: "There's a story about feelings just like yours — want to hear it?" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex flex-wrap gap-3 justify-center">
        {moods.map(([name, emoji]) => (
          <button key={name} onClick={() => pick(name)}
            className="w-24 py-3 rounded-2xl border-2 text-center"
            style={{ background: mood === name ? "#FF993355" : "#FFFDF8", borderColor: mood === name ? "#FF9933" : "#EADFC8" }}>
            <div className="text-2xl">{emoji}</div>
            <div className="text-xs mt-1">{name}</div>
          </button>
        ))}
      </div>
      {loading && <LoadingLamp label="Thinking of something for you..." />}
      {result && !breathing && (
        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl p-4" style={{ background: "#E94F8022" }}>{result.affirmation}</div>
          <div className="rounded-2xl p-4 bg-white border border-[#EADFC8] flex items-center justify-between gap-3">
            <span>{result.activitySuggestion}</span>
            <button onClick={() => setBreathing(true)} className="px-3 py-1.5 rounded-xl text-white text-sm font-bold flex-shrink-0" style={{ background: "#3D9970" }}>Try It</button>
          </div>
          <div className="rounded-2xl p-4 bg-white border border-[#EADFC8]">📖 {result.storyHook}</div>
        </div>
      )}
      {breathing && (
        <div className="mt-8 text-center">
          <div className="mb-6">Breathe in... breathe out...</div>
          <div className="mx-auto rounded-full animate-pulse" style={{ width: 140, height: 140, background: "#3D997066" }} />
          <div className="mt-6"><PrimaryButton onClick={() => setBreathing(false)} color="#3D9970">All Done</PrimaryButton></div>
        </div>
      )}
    </div>
  );
}

/* ---------- Feature: Gratitude Journal ---------- */

function GratitudeJournalScreen() {
  const { stats, recordGratitudeToday } = useStats();
  const [good, setGood] = useState(["", "", ""]);
  const [helpedMe, setHelpedMe] = useState("");
  const [iHelped, setIHelped] = useState("");
  const [madeMeSmile, setMadeMeSmile] = useState("");
  const today = new Date().toDateString();
  const savedToday = stats.gratitudeDates.includes(today);

  const save = () => {
    recordGratitudeToday({
      good: good.filter((g) => g.trim()),
      helpedMe: helpedMe.trim() || null,
      iHelped: iHelped.trim() || null,
      madeMeSmile: madeMeSmile.trim() || null,
    });
    setGood(["", "", ""]); setHelpedMe(""); setIHelped(""); setMadeMeSmile("");
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="rounded-2xl p-4 flex items-center gap-3 mb-5" style={{ background: "#3D997022" }}>
        <span className="text-2xl">🔥</span>
        <span className="font-bold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>{stats.gratitudeStreak} day streak</span>
      </div>
      {savedToday && <div className="mb-4 text-sm text-[#1F3B73]/70">You've already journaled today — come back tomorrow! 🌟</div>}
      <div className="grid gap-2">
        {good.map((g, i) => (
          <input key={i} value={g} disabled={savedToday} placeholder={`${i + 1}.`}
            onChange={(e) => setGood((arr) => arr.map((x, idx) => idx === i ? e.target.value : x))}
            className="rounded-xl border-2 border-[#EADFC8] px-4 py-2.5 outline-none focus:border-[#FF9933] bg-white disabled:opacity-50" />
        ))}
        <input value={helpedMe} disabled={savedToday} placeholder="Who helped me today?" onChange={(e) => setHelpedMe(e.target.value)}
          className="rounded-xl border-2 border-[#EADFC8] px-4 py-2.5 outline-none focus:border-[#FF9933] bg-white disabled:opacity-50" />
        <input value={iHelped} disabled={savedToday} placeholder="Who did I help today?" onChange={(e) => setIHelped(e.target.value)}
          className="rounded-xl border-2 border-[#EADFC8] px-4 py-2.5 outline-none focus:border-[#FF9933] bg-white disabled:opacity-50" />
        <input value={madeMeSmile} disabled={savedToday} placeholder="What made me smile?" onChange={(e) => setMadeMeSmile(e.target.value)}
          className="rounded-xl border-2 border-[#EADFC8] px-4 py-2.5 outline-none focus:border-[#FF9933] bg-white disabled:opacity-50" />
      </div>
      <div className="mt-4"><PrimaryButton onClick={save} disabled={savedToday} color="#3D9970">Save Today's Entry</PrimaryButton></div>
      {stats.gratitudeEntries.length > 0 && (
        <div className="mt-6">
          <div className="font-bold text-[#1F3B73] mb-2" style={{ fontFamily: "'Baloo 2'" }}>Past Entries</div>
          {stats.gratitudeEntries.slice(0, 10).map((e, i) => (
            <div key={i} className="rounded-xl bg-white border border-[#EADFC8] p-3 mb-2 text-sm">
              <div className="font-semibold">{e.date}</div>
              {e.good.map((g, j) => <div key={j}>• {g}</div>)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Feature: Parent Dashboard ---------- */

function ParentDashboardScreen() {
  const { stats, resetProgress } = useStats();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const cards = [
    ["Stories Completed", stats.storiesCompleted, "#FF9933"],
    ["Questions Asked", stats.questionsAsked, "#3D9970"],
    ["Shlokas Learned", stats.shlokasLearned, "#1F3B73"],
    ["Kindness Score", stats.kindnessScore, "#E94F80"],
    ["Gratitude Streak", stats.gratitudeStreak, "#3D9970"],
  ];
  const achievements = [
    ["First Story", "📖", stats.storiesCompleted >= 1],
    ["Story Explorer", "🗺️", stats.storiesCompleted >= 10],
    ["First Shloka", "🕉️", stats.shlokasLearned >= 1],
    ["Grateful Heart", "🙏", stats.gratitudeStreak >= 3],
    ["Kindness Hero", "💛", stats.kindnessScore >= 50],
  ];
  const max = Math.max(1, ...cards.map((c) => c[1]));

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-end gap-3 h-40 mb-6">
        {cards.map(([label, val, color]) => (
          <div key={label} className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="w-full rounded-t-lg transition-all" style={{ height: `${Math.max(4, (val / max) * 100)}%`, background: color }} />
            <div className="text-[10px] mt-1 text-center text-[#1F3B73]/70">{label.split(" ")[0]}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cards.map(([label, val, color]) => (
          <div key={label} className="rounded-2xl p-3" style={{ background: `${color}1F` }}>
            <div className="text-2xl font-extrabold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>{val}</div>
            <div className="text-xs text-[#1F3B73]/70">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 font-bold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>Achievements</div>
      <div className="flex flex-wrap gap-2 mt-2">
        {achievements.map(([title, emoji, unlocked]) => (
          <div key={title} className="px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5"
            style={{ background: unlocked ? "#FF993340" : "#00000010", color: unlocked ? "#1F3B73" : "#999" }}>
            <span>{emoji}</span>{title}
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-[#EADFC8]">
        {!confirmingReset ? (
          <button
            onClick={() => setConfirmingReset(true)}
            className="text-sm text-[#1F3B73]/50 underline"
            style={{ fontFamily: "'Nunito'" }}
          >
            Reset all progress on this device
          </button>
        ) : (
          <div className="rounded-xl p-3" style={{ background: "#E94F8018" }}>
            <div className="text-sm text-[#1F3B73] mb-2">
              This clears everything saved on this device — stories completed, shlokas
              learned, gratitude entries, kindness score. It can't be undone.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmingReset(false)}
                className="text-sm px-3 py-1.5 rounded-lg border border-[#EADFC8]"
              >
                Cancel
              </button>
              <button
                onClick={() => { resetProgress(); setConfirmingReset(false); }}
                className="text-sm px-3 py-1.5 rounded-lg text-white font-semibold"
                style={{ background: "#E94F80" }}
              >
                Yes, reset everything
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Home / Nav ---------- */

const SECTIONS = [
  {
    title: "Learn",
    tiles: [
      { id: "story", title: "Ask Why", subtitle: 'Ask any "why should I..." question', color: "#FF9933", emoji: "📜" },
      { id: "chat", title: "Ask Anything", subtitle: "Chat about gods, festivals, and stories", color: "#3D9970", emoji: "💬" },
      { id: "personal", title: "My Own Story", subtitle: "Become the hero of a mythology tale", color: "#E94F80", emoji: "⭐" },
      { id: "bedtime", title: "Bedtime Stories", subtitle: "Gentle stories to read together", color: "#1F3B73", emoji: "🌙" },
      { id: "shloka", title: "Shlokas", subtitle: "Learn Sanskrit verses, word by word", color: "#FF9933", emoji: "🕉️" },
    ],
  },
  {
    title: "Play",
    tiles: [
      { id: "games", title: "Games", subtitle: "Memory match and mythology quizzes", color: "#E94F80", emoji: "🎮" },
    ],
  },
  {
    title: "Wellbeing",
    tiles: [
      { id: "wellness", title: "How Are You Feeling?", subtitle: "A daily emotional check-in", color: "#E94F80", emoji: "❤️" },
      { id: "gratitude", title: "Gratitude Journal", subtitle: "Three good things, every day", color: "#3D9970", emoji: "📔" },
    ],
  },
];

const ALL_TILES = SECTIONS.flatMap((s) => s.tiles);

function AppShell() {
  useGoogleFonts();
  const [tab, setTab] = useState("home");
  const [game, setGame] = useState(null); // "memory" | "quiz" | "wordsearch" | "spotdiff" | "temple" | "hanumanleap" | null

  const goTo = (id) => {
    setTab(id);
    setGame(null);
  };

  const GAME_TITLES = { memory: "Memory Match", quiz: "Mythology Quiz", wordsearch: "Word Search", spotdiff: "Spot the Difference", temple: "Temple Builder", hanumanleap: "Hanuman's Leap" };
  const currentTitle = tab === "games" && game
    ? GAME_TITLES[game]
    : (ALL_TILES.find((t) => t.id === tab)?.title || (tab === "dashboard" ? "Parent Dashboard" : ""));

  return (
    <div className="min-h-screen" style={{ background: "#FFF8EC" }}>
      <header className="border-b border-[#EADFC8] bg-[#FFF8EC]/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <button onClick={() => { setTab("home"); setGame(null); }} className="flex items-center gap-2">
            <span className="text-2xl">🪷</span>
            <span className="text-xl font-extrabold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>
              My Little Dharma
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setTab("dashboard")} className="text-lg" title="Parent Dashboard">📊</button>
            <span className="text-xs px-3 py-1 rounded-full bg-[#FF9933]/15 text-[#B08D3E] font-semibold hidden sm:inline" style={{ fontFamily: "'Nunito'" }}>
              Web Preview
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8">
        {tab === "home" && (
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1F3B73] text-center" style={{ fontFamily: "'Baloo 2'" }}>
              Stories that teach values,<br />one adventure at a time
            </h1>
            <p className="text-center text-[#1F3B73]/70 mt-3 max-w-md mx-auto" style={{ fontFamily: "'Nunito'" }}>
              Inspired by the timeless wisdom of Hindu epics — for kids ages 3–12.
            </p>
            {SECTIONS.map((section) => (
              <div key={section.title} className="mt-9">
                <div className="text-lg font-extrabold text-[#1F3B73] mb-3" style={{ fontFamily: "'Baloo 2'" }}>{section.title}</div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {section.tiles.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => goTo(t.id)}
                      className="text-left rounded-3xl p-6 transition-transform hover:-translate-y-0.5"
                      style={{ background: `${t.color}1A`, border: `1px solid ${t.color}40` }}
                    >
                      <div className="text-4xl">{t.emoji}</div>
                      <div className="mt-3 text-lg font-extrabold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>{t.title}</div>
                      <div className="text-sm text-[#1F3B73]/70 mt-1" style={{ fontFamily: "'Nunito'" }}>{t.subtitle}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab !== "home" && (
          <div>
            <button
              onClick={() => {
                if (tab === "games" && game) setGame(null);
                else { setTab("home"); setGame(null); }
              }}
              className="mb-6 text-[#1F3B73] font-semibold flex items-center gap-1"
              style={{ fontFamily: "'Baloo 2'" }}
            >
              ← Back
            </button>
            {currentTitle && (
              <h2 className="text-xl font-extrabold text-[#1F3B73] mb-5" style={{ fontFamily: "'Baloo 2'" }}>{currentTitle}</h2>
            )}
            {tab === "story" && <StoryEngineScreen />}
            {tab === "chat" && <ChatbotScreen />}
            {tab === "personal" && <PersonalizedStoryScreen />}
            {tab === "bedtime" && <BedtimeStoriesScreen />}
            {tab === "shloka" && <ShlokaScreen />}
            {tab === "games" && !game && <GamesHubScreen onOpenGame={setGame} />}
            {tab === "games" && game === "memory" && <MemoryMatchGame />}
            {tab === "games" && game === "quiz" && <QuizGame />}
            {tab === "games" && game === "wordsearch" && <WordSearchGame />}
            {tab === "games" && game === "spotdiff" && <SpotDifferenceGame />}
            {tab === "games" && game === "temple" && <TempleBuilderGame />}
            {tab === "games" && game === "hanumanleap" && <HanumanFlyingGame />}
            {tab === "wellness" && <WellnessScreen />}
            {tab === "gratitude" && <GratitudeJournalScreen />}
            {tab === "dashboard" && <ParentDashboardScreen />}
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StatsProvider>
      <AppShell />
    </StatsProvider>
  );
}
