"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Store,
  Calendar,
  CreditCard,
  Truck,
  Printer,
  Zap,
  HelpCircle,
  MessageSquareText,
  ChevronRight,
  ChevronDown,
  Layers,
  Cpu,
} from "lucide-react";

// Most Asked Questions with realistic, genuine, battle-tested operational answers
const FAQ_CATEGORIES = [
  { id: "all", label: "All Questions" },
  { id: "collection", label: "Intake & Rates", icon: Cpu },
  { id: "billing", label: "10-Day Billing", icon: Calendar },
  { id: "store", label: "E-Store & POS", icon: Store },
  { id: "milkpay", label: "Farmer Credit", icon: CreditCard },
  { id: "hardware", label: "Thermal Printers", icon: Printer },
  { id: "delivery", label: "Village Delivery", icon: Truck },
];

const MOST_ASKED_QUESTIONS = [
  {
    category: "collection",
    question: "How fast is daily milk intake recording during peak morning shift?",
    shortAnswer: "Under 4 seconds per farmer using keyboard-first numpad navigation.",
    detailedAnswer:
      "During peak morning shifts (6:00 AM – 8:30 AM), village milk intake desks process 80–150 farmers. Milkify features a keyboard-only entry flow:\n\n1. Type farmer number (e.g. 42) and press [Enter]\n2. Enter quantity in liters and press [Tab]\n3. Enter Fat % and SNF / CLR degree\n4. Rate and total payout calculate automatically in real time\n5. Press [Enter] to save and automatically trigger the 80mm thermal receipt.\n\nEntire transaction takes under 4 seconds per farmer without touching the mouse.",
    link: { label: "Try Rate Sandbox", href: "/#roles" },
  },
  {
    category: "billing",
    question: "How does the automated 10-day cycle billing work in practice?",
    shortAnswer: "Three cooperative cycles per month (1-10, 11-20, 21-end) with batch PDF statements.",
    detailedAnswer:
      "Following Indian cooperative dairy federation standards (e.g., Amul, Mahanand, Nandini), Milkify automates 3 cycles per month:\n\n• Cycle 1: 1st to 10th of the month\n• Cycle 2: 11th to 20th of the month\n• Cycle 3: 21st to the last day of the month\n\nAt shift closure on the 10th/20th/30th, the system compiles morning and evening milk entries, subtracts cattle feed store deductions and advance loans, and generates batch PDF statements with Marathi Devanagari headers for instant farmer payout disbursement.",
    link: { label: "Go to Billing Portal", href: "/login" },
  },
  {
    category: "milkpay",
    question: "What is Farmer Milk-Pay credit and how do feed deductions work?",
    shortAnswer: "Farmers buy cattle feed or dairy items with zero cash; cost is auto-deducted from upcoming milk payout.",
    detailedAnswer:
      "Rural dairy farmers often face seasonal liquidity crunches between billing cycles. With Milk-Pay:\n\n1. A registered farmer visits the dairy store or public storefront at /store/[slug]\n2. They select cattle feed (Siddhi, Kapila, Supreme 50kg bags) or dairy products\n3. They choose 'Farmer Milk Credit (Milk-Pay)' as payment method\n4. System validates their registered mobile and unsettled milk intake balance\n5. Order is confirmed, stock decreases, and a scheduled debit entry is added to their upcoming 10-day payment statement.",
    link: { label: "Read Release Docs", href: "/version" },
  },
  {
    category: "store",
    question: "How do village residents order milk or cattle feed from the public storefront?",
    shortAnswer: "Every dairy gets a branded URL (/store/[outlet-slug]) with mobile OTP or guest checkout.",
    detailedAnswer:
      "Every registered dairy center gets its own independent public URL at milkify.app/store/[your-slug]:\n\n• Branded storefront showcasing cow/buffalo milk, paneer, curd, ghee, and feed\n• Live stock tracking: when an item sells out in the POS, it immediately reflects as 'Out of Stock' online via Socket.io\n• Customers choose Delivery or Store Pickup\n• 10-minute Swiggy-style session countdown timer prevents inventory hoarding during online Razorpay payments.",
    link: { label: "Explore Retail Services", href: "/#ecosystem" },
  },
  {
    category: "delivery",
    question: "How does the 15 km GPS geofencing delivery engine prevent out-of-area orders?",
    shortAnswer: "Haversine formula checks customer coordinates against the dairy's GPS pin before order placement.",
    detailedAnswer:
      "Rural deliveries cannot serve customers 30 km away without high spoilage risks. Milkify uses the Haversine great-circle distance algorithm:\n\n• Dairy sets its GPS coordinates and delivery radius (e.g. 10 km or 15 km)\n• When a customer enters their delivery village or location, the coordinates are verified\n• Orders outside the geofence boundary are cleanly rejected with a friendly message\n• Orders inside calculate distance-based delivery fees (or free delivery above configured order value, e.g. ₹500).",
    link: { label: "Ecosystem Specs", href: "/#ecosystem" },
  },
  {
    category: "hardware",
    question: "Which printers are supported for 80mm and 58mm thermal receipts?",
    shortAnswer: "All standard USB, Bluetooth, and network ESC/POS thermal printers (TVS, Epson, Posiflex, Everycom).",
    detailedAnswer:
      "Milkify is hardware-agnostic and supports:\n\n• Standard 80mm (3-inch) and 58mm (2-inch) thermal slip rolls\n• Bluetooth mobile printers for field collection\n• USB / Virtual COM ESC/POS desktop receipt printers (Epson TM-T82, TVS RP-3200, Posiflex, Everycom)\n• Receipts feature dairy logo, farmer ID (e.g. MI-FAR-0042), Fat, SNF, CLR degree, rate, total amount, and QR payment codes in crisp Marathi Devanagari typography.",
    link: { label: "Release Highlights", href: "/version" },
  },
  {
    category: "collection",
    question: "How are Cow and Buffalo milk rates computed in real-time?",
    shortAnswer: "Configurable dynamic rate matrix based on Fat %, SNF %, or CLR lactometer degrees.",
    detailedAnswer:
      "Milkify supports 3 distinct rate calculation models:\n\n1. Fat-Only Base Rate: Base rate adjusted by (Actual Fat - Standard Fat) * Fat Factor\n2. Dual Fat + SNF Formula: Base rate + Fat deviation + (Actual SNF - 8.5) * SNF Factor\n3. CLR Degree Formula: Computes SNF using (CLR/4) + (Fat * 0.2) + 0.36\n\nRates update instantly for Cow and Buffalo milk without page reloads, ensuring zero calculation disputes at the milk desk.",
    link: { label: "Try Dynamic Rate Engine", href: "/#roles" },
  },
  {
    category: "billing",
    question: "What happens if a farmer has zero milk collection during a 10-day sprint?",
    shortAnswer: "Automated zero-collection alerts notify the farmer and flag their ledger for staff follow-up.",
    detailedAnswer:
      "In rural societies, drop in farmer delivery often signals cattle disease or supply diversion. Milkify's zero-collection detection engine automatically:\n\n• Identifies registered farmers with zero entries during the sprint\n• Dispatches an automated email and SMS notification to check on cattle health\n• Displays an inactive member badge on the Dairy Admin dashboard for field staff engagement.",
    link: { label: "View Release Changelog", href: "/version" },
  },
];

const INITIAL_MESSAGES = [
  {
    id: "welcome-1",
    sender: "bot",
    text: "Namaste! 🙏 Welcome to Milkify AI Assistant. I can answer any operational, technical, or financial questions about the Milkify Dairy Ecosystem.\n\nYou can ask about 10-day billing, public storefronts, farmer Milk-Pay, rate formulas, or 80mm thermal receipts!",
    timestamp: "Just now",
  },
];

export default function GlobalChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState("chat"); // 'chat' | 'faq'
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && activeView === "chat") {
      scrollToBottom();
    }
  }, [messages, isOpen, activeView]);

  const handleAskQuestion = (questionObj) => {
    // Switch to chat view and post the user question and the rich answer
    setActiveView("chat");
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: questionObj.question,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: questionObj.detailedAnswer,
        link: questionObj.link,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleCustomSend = (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Look for best matching question in knowledge base
    const lower = query.toLowerCase();
    const match = MOST_ASKED_QUESTIONS.find(
      (faq) =>
        lower.includes(faq.category) ||
        faq.question.toLowerCase().split(" ").some((w) => w.length > 4 && lower.includes(w))
    );

    setTimeout(() => {
      let replyText = "";
      let replyLink = null;

      if (match) {
        replyText = match.detailedAnswer;
        replyLink = match.link;
      } else if (lower.includes("price") || lower.includes("cost") || lower.includes("plan") || lower.includes("subscription")) {
        replyText = "💰 **Milkify SaaS Pricing:**\n\n• **Starter (Basic):** ₹999/month (Up to 50 farmers, 10-day billing, Devanagari slips)\n• **Smart Dairy (Pro):** ₹2,499/month (Most popular — unlimited farmers, public e-store, 80mm thermal POS, Milk-Pay, Razorpay)\n• **Enterprise (Pro Max):** ₹4,999/month (Multi-center chilling hubs, custom domain, IoT milk analyzers, 99.99% SLA)\n\nAll plans include a **14-day free trial** with zero lock-in.";
        replyLink = { label: "View Pricing Table", href: "/#pricing" };
      } else if (lower.includes("login") || lower.includes("portal") || lower.includes("admin") || lower.includes("master")) {
        replyText = "🔐 **Milkify Portal Access:**\n\n• **Dairy Admin Portal:** For dairy operators to record collections, manage billing, and run store POS → `/login`\n• **Farmer Member Login:** Individual farmers inspect passbooks & payment slips using their registered mobile → `/login`\n• **Master Superadmin Console:** Enterprise multi-tenant oversight for platform operators → `/master/login`";
        replyLink = { label: "Go to Login", href: "/login" };
      } else {
        replyText = `Thank you for your question about "${query}".\n\nMilkify is dedicated to uplifting rural dairies and empowering village farmers with transparent, modern agritech tools. You can explore:\n• **10-Day Automated Billing** with loan deductions\n• **Public Branded Storefront** at /store/[slug]\n• **Walk-in POS** with 80mm thermal slips\n• **Farmer Milk-Pay** credit checkout\n• **Dynamic Fat/SNF Rate Matrix** for Cow and Buffalo milk.\n\nCheck the "FAQ & Ecosystem" tab above for detailed operational answers!`;
        replyLink = { label: "Explore FAQ Knowledge Base", href: "#" };
      }

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: replyText,
        link: replyLink,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 550);
  };

  const filteredFaqs = MOST_ASKED_QUESTIONS.filter(
    (faq) => selectedCategory === "all" || faq.category === selectedCategory
  );

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open Milkify AI Assistant"
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-2xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-300 font-bold text-xs"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <Bot className="w-5 h-5 text-white animate-bounce-slow" />
            <span className="font-extrabold tracking-wide">Milkify AI &bull; FAQ</span>
          </button>
        )}
      </div>

      {/* Main Chat & FAQ Modal Dialog */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[94vw] sm:w-[460px] max-h-[85vh] h-[640px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm flex items-center gap-1.5">
                  <span>Milkify AI Ecosystem Assistant</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div className="text-[11px] text-blue-100 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Verified Dairy Knowledge Base &bull; v2.5.0
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages(INITIAL_MESSAGES)}
                title="Reset conversation"
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close assistant"
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Bar: Chat Mode vs Most Asked FAQ */}
          <div className="px-3 pt-2 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveView("chat")}
                className={`px-3 py-1.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 ${
                  activeView === "chat"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                <MessageSquareText className="w-3.5 h-3.5" />
                <span>AI Chat</span>
              </button>
              <button
                onClick={() => setActiveView("faq")}
                className={`px-3 py-1.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 ${
                  activeView === "faq"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Most Asked Questions ({MOST_ASKED_QUESTIONS.length})</span>
              </button>
            </div>

            <Link
              href="/#ecosystem"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline hidden sm:flex items-center gap-1 pb-1"
            >
              <Layers className="w-3 h-3" />
              <span>Full Ecosystem</span>
            </Link>
          </div>

          {/* VIEW 1: FAQ Knowledge Base */}
          {activeView === "faq" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
              {/* Category Filter Pills */}
              <div className="p-2.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
                {FAQ_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      selectedCategory === cat.id
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* FAQ Accordion List */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
                {filteredFaqs.map((faq, idx) => {
                  const isExpanded = expandedFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                        className="w-full p-3 text-left flex items-start justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">
                            {faq.question}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {faq.shortAnswer}
                          </div>
                        </div>
                        <div className="p-1 rounded-lg text-slate-400 shrink-0">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-3.5 pt-0 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
                          <p className="whitespace-pre-wrap leading-relaxed">{faq.detailedAnswer}</p>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                            <button
                              onClick={() => handleAskQuestion(faq)}
                              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <span>Discuss in AI Chat</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>

                            {faq.link && (
                              <Link
                                href={faq.link.href}
                                onClick={() => setIsOpen(false)}
                                className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1"
                              >
                                <span>{faq.link.label}</span>
                                <Zap className="w-3 h-3 text-amber-500" />
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: Interactive AI Chat */}
          {activeView === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Quick Suggestion Chips */}
              <div className="p-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/70 dark:border-slate-800/70 flex gap-1.5 overflow-x-auto no-scrollbar">
                {MOST_ASKED_QUESTIONS.slice(0, 5).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskQuestion(q)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10.5px] font-bold text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center gap-1 shrink-0 shadow-2xs"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    <span>{q.question.split(" ").slice(0, 4).join(" ")}...</span>
                  </button>
                ))}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs bg-slate-50/50 dark:bg-slate-950/40">
                {messages.map((m) => {
                  const isBot = m.sender === "bot";
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${isBot ? "justify-start" : "justify-end"}`}
                    >
                      {isBot && (
                        <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                          isBot
                            ? "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm"
                            : "bg-blue-600 text-white font-medium shadow-md rounded-br-xs"
                        }`}
                      >
                        <div>{m.text}</div>

                        {m.link && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Link
                              href={m.link.href}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <span>{m.link.label}</span>
                              <Zap className="w-3 h-3" />
                            </Link>
                          </div>
                        )}

                        <div
                          className={`text-[9px] mt-1 text-right ${
                            isBot ? "text-slate-400" : "text-blue-100"
                          }`}
                        >
                          {m.timestamp}
                        </div>
                      </div>

                      {!isBot && (
                        <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs pl-9">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-150" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-300" />
                    <span className="text-[11px] font-semibold">Milkify AI is responding...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCustomSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Ask about 10-day billing, store POS, rates, Milk-Pay..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-2xl text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-all shadow-md shadow-blue-500/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
