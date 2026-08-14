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

const SEED_BEDTIME_STORIES = [
  { title: "Hanuman's Great Leap", category: "Hanuman", blurb: "How courage and self-belief helped Hanuman cross the ocean." },
  { title: "Ganesha and the Moon", category: "Ganesha", blurb: "A story about not laughing at others' mistakes." },
  { title: "Krishna's Butter Mischief", category: "Krishna", blurb: "A playful tale about honesty and gentle consequences." },
  { title: "The Thirsty Crow", category: "Panchatantra", blurb: "A clever crow shows that patience and persistence pay off." },
  { title: "Sita's Garden of Patience", category: "Sita", blurb: "A gentle story about waiting and trusting good things to grow." },
];

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

function LoadingLamp({ label }) {
  return (
    <div className="flex items-center gap-3 text-[#1F3B73] mt-4" style={{ fontFamily: "'Nunito'" }}>
      <span className="inline-block w-5 h-5 rounded-full border-4 border-[#FF9933] border-t-transparent animate-spin" />
      {label}
    </div>
  );
}

/* ---------- Shared stats (feeds Parent Dashboard) ----------
   In-memory only for this preview (artifacts can't use browser storage) —
   the shipped app persists this via ProgressService / SharedPreferences,
   with a Phase 2 note to migrate to Firestore for cross-device sync. */

const StatsContext = createContext(null);
function useStats() {
  return useContext(StatsContext);
}

function StatsProvider({ children }) {
  const [stats, setStats] = useState({
    storiesCompleted: 0,
    questionsAsked: 0,
    shlokasLearned: 0,
    kindnessScore: 0,
    gratitudeStreak: 0,
    gratitudeDates: [],
  });

  const bump = (key, by = 1) => setStats((s) => ({ ...s, [key]: s[key] + by }));

  const recordGratitudeToday = () => {
    const today = new Date().toDateString();
    setStats((s) => {
      if (s.gratitudeDates.includes(today)) return s;
      const dates = [...s.gratitudeDates, today];
      return { ...s, gratitudeDates: dates, gratitudeStreak: s.gratitudeStreak + 1, kindnessScore: s.kindnessScore + 3 };
    });
  };

  return (
    <StatsContext.Provider value={{ stats, bump, recordGratitudeToday }}>
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
        <button
          key={s.title}
          onClick={() => setOpen(open === s.title ? null : s.title)}
          className="text-left rounded-2xl bg-white border border-[#EADFC8] px-5 py-4 hover:border-[#1F3B73]/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#1F3B7322" }}>
              🌙
            </div>
            <div>
              <div className="font-bold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>{s.title}</div>
              <div className="text-sm text-[#1F3B73]/70" style={{ fontFamily: "'Nunito'" }}>{s.category} · {s.blurb}</div>
            </div>
          </div>
          {open === s.title && (
            <div className="mt-3 text-sm text-[#B08D3E] italic" style={{ fontFamily: "'Nunito'" }}>
              Full story generation connects to the same AI backend as "Ask Why" — this
              preview shows the catalog entry only.
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------- Feature: Shlokas ---------- */

function ShlokaScreen() {
  const { bump } = useStats();
  const [open, setOpen] = useState(null);
  const [learned, setLearned] = useState({});
  const [voiceStatus, setVoiceStatus] = useState("checking"); // "checking" | "hindi" | "none"
  const [speaking, setSpeaking] = useState(null);
  const voiceRef = useRef(null);

  useEffect(() => {
    if (!window.speechSynthesis) { setVoiceStatus("none"); return; }
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer an actual Sanskrit voice (essentially never present), then a
      // Hindi voice, preferring ones whose name suggests a natural/Google
      // voice over a generic robotic one.
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

  // Speaking one long Devanagari string in a single utterance reads very
  // poorly — browser TTS engines mumble through the danda (।) breaks. We
  // split on line breaks and danda punctuation and speak each phrase as its
  // own utterance with a short pause, which is noticeably clearer. This is
  // still a generic Hindi voice, not a trained Sanskrit voice, so accuracy
  // has a real ceiling — see the note below the player.
  const speak = (shloka) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const useHindi = voiceStatus === "hindi";
    const source = useHindi ? shloka.sanskrit : shloka.transliteration;
    const phrases = source
      .split(/[।॥\n]+/)
      .map((p) => p.trim())
      .filter(Boolean);

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
    if (learned[id]) return;
    setLearned((l) => ({ ...l, [id]: true }));
    bump("shlokasLearned");
  };

  return (
    <div className="max-w-2xl mx-auto grid gap-3">
      <div className="text-xs rounded-xl px-4 py-2.5" style={{ background: "#1F3B7314", color: "#1F3B73", fontFamily: "'Nunito'" }}>
        {voiceStatus === "none"
          ? "This browser has no Hindi voice installed, so playback uses an English voice — pronunciation will be rough. Chrome on Android/Windows usually has a built-in Hindi voice; Safari often doesn't."
          : "Playing with the closest available voice (Hindi, not Sanskrit — no browser ships a true Sanskrit voice). For real accuracy, the shipped app should use recordings of a native speaker rather than text-to-speech."}
      </div>
      {SEED_SHLOKAS.map((s) => (
        <div key={s.id} className="rounded-2xl bg-white border border-[#EADFC8] overflow-hidden">
          <button onClick={() => setOpen(open === s.id ? null : s.id)} className="w-full text-left px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#FF993322" }}>🕉️</div>
            <div className="flex-1">
              <div className="font-bold text-[#1F3B73]" style={{ fontFamily: "'Baloo 2'" }}>{s.title}</div>
              <div className="text-sm text-[#1F3B73]/70 truncate" style={{ fontFamily: "'Nunito'" }}>{s.transliteration}</div>
            </div>
            {learned[s.id] && <span className="text-lg">✅</span>}
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
                  {learned[s.id] ? "Marked as Learned ✓" : "I've Learned This"}
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
  const [entries, setEntries] = useState([]);
  const today = new Date().toDateString();
  const savedToday = stats.gratitudeDates.includes(today);

  const save = () => {
    setEntries((e) => [{ date: today, good: good.filter((g) => g.trim()) }, ...e]);
    recordGratitudeToday();
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
      {entries.length > 0 && (
        <div className="mt-6">
          <div className="font-bold text-[#1F3B73] mb-2" style={{ fontFamily: "'Baloo 2'" }}>Past Entries</div>
          {entries.map((e, i) => (
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
  const { stats } = useStats();
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
  const [game, setGame] = useState(null); // "memory" | "quiz" | null

  const goTo = (id) => {
    setTab(id);
    setGame(null);
  };

  const currentTitle = tab === "games" && game
    ? (game === "memory" ? "Memory Match" : "Mythology Quiz")
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
