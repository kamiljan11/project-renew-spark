import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ConversationalForm } from "@/components/site/ConversationalForm";
import { FloatContact } from "@/components/site/FloatContact";
import {
  Gauge, Settings2, Landmark, Wrench, TrendingDown, Sparkles,
  MessageSquarePlus, SearchCode, FileText, CreditCard, Truck, PackageCheck,
  Quote, Award, ArrowUpRight, MessageCircle, CheckCircle2, ChevronDown,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  component: Index,
});

const BENEFITS = [
  { icon: Gauge, t: "Fast delivery", d: "We find the fastest shipping route for your order. You always know when it arrives before you pay." },
  { icon: Settings2, t: "We find any part", d: "No link? Just describe the part. We search European suppliers and send you the price. Search fee: 5,000 ISK." },
  { icon: Landmark, t: "Icelandic invoice", d: "Every order comes with a proper Icelandic VAT invoice. You can deduct it as a business expense. We handle customs — you don't touch it." },
  { icon: Wrench, t: "No middleman stress", d: "You send a request. We handle everything between the European supplier and your door. You just wait for the package." },
  { icon: TrendingDown, t: "Fair price", d: "We show you the full price before you commit — part cost, shipping, and our fee. No surprises at the end." },
];

const PROCESS = [
  { n: "01", icon: MessageSquarePlus, t: "You send a link", d: "Fill out the form: paste a link to the part you found online, or describe what you need. That's it." },
  { n: "02", icon: SearchCode, t: "We check the part", d: "We verify availability, check the price, and calculate the full cost including shipping to Iceland." },
  { n: "03", icon: FileText, t: "You get the total", d: "We send you one number: part + shipping + our fee. No hidden costs. You decide if you want to proceed." },
  { n: "04", icon: CreditCard, t: "You confirm", d: "You say yes, you pay. We immediately place the order with the supplier." },
  { n: "05", icon: Truck, t: "We ship it", d: "We handle the purchase, international shipping, and all customs paperwork to Iceland. You get tracking info." },
  { n: "06", icon: PackageCheck, t: "Pickup", d: "When the package arrives, you can pick it up locally or we deliver it to you." },
];

const REVIEWS = [
  { q: "Time matters to us. I ordered engine parts, and they were here faster than I expected. Solid work, no unnecessary talk or paperwork.", n: "Mariusz", c: "Flottur Bill ehf.", color: "var(--mas-orange)" },
  { q: "I run a rental agency, cars need to drive, not sit idle. MAS Parts takes the hassle of finding parts off my shoulders. Icelandic invoice included, everything works.", n: "Łukasz", c: "Rabel Travel ehf.", color: "var(--navy)" },
  { q: "I was looking for a part that no one had in stock. Found it here immediately and at a good price. Quickly sorted.", n: "Gudjon", c: "Private Garage", color: "#e2e8f0" },
];

const FAQ = [
  ["How exactly does this work?", "Simple. Find a part on any website (Autodoc, eBay, a Polish shop, anywhere in Europe) and copy the link. Fill in our form, paste the link, and submit. We check the part, add up shipping to Iceland, and send you the total. If you agree, you pay and we handle everything else: buying, shipping, customs, and delivery to your door."],
  ["Do you issue an Icelandic VAT invoice?", "Yes. We are a registered company in Iceland (ehf.) and every order comes with a full Icelandic VAT invoice. If you run a workshop or company, you can deduct it as a business expense."],
  ["How long does part delivery take?", "It depends on where the part ships from, but we always tell you the estimated delivery time before you pay. Most European orders arrive within 5-10 business days. Express options are available."],
  ["What if the ordered part doesn't fit?", "If we ordered the wrong part on our end, we replace it or refund you, no questions asked. If you sent us an incorrect link or wrong vehicle details, we'll do our best to help but the responsibility lies on your side. Always double-check the link before sending."],
  ["Do you deliver parts outside the capital area?", "Yes, everywhere in Iceland. Reykjavik, Akureyri, Egilsstaðir, Westfjords — we ship to your address. Just write your delivery address in the form."],
  ["What car brands do you support?", "All of them. VW, Audi, BMW, Toyota, Kia, Ford, Volvo — if it drives, we can get the part. Both original OEM parts and quality aftermarket alternatives."],
  ["Do you supply used parts?", "Yes, on request. Engines, gearboxes, body parts — just ask. Keep in mind: used parts cannot be returned once delivered, so make sure you know what you're ordering."],
];

function Index() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <Header onContact={() => setContactOpen(true)} />

      {/* HERO */}
      <section
        id="order"
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--navy) 0%, oklch(0.22 0.05 265) 100%)" }}
      >
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 20% 20%, var(--mas-orange) 0, transparent 50%), radial-gradient(circle at 80% 80%, var(--mas-orange) 0, transparent 40%)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div className="text-white">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/15 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-mas-orange" />
              AI-assisted · Iceland-ready
            </span>
            <h1 className="mt-5 text-4xl md:text-6xl font-black leading-[1.05] tracking-tight uppercase italic" style={{ fontFamily: "Exo 2", letterSpacing: "-0.02em" }}>
              FOUND A PART ONLINE?<br/>
              SEND US <span className="text-mas-orange">THE LINK.</span>
            </h1>
            <p className="mt-6 text-lg text-white/75 max-w-xl leading-relaxed">
              We buy it, ship it to Iceland, and deliver to your door — with a proper Icelandic VAT invoice. No customs headaches.
            </p>
            <ul className="mt-6 space-y-2.5 text-white/85 text-sm">
              {[
                "Paste a link or describe the part — we'll find it.",
                "One total: part + shipping + our fee. No surprises.",
                "Icelandic ehf. — full VAT invoice on every order.",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-mas-orange shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:pl-6">
            <ConversationalForm />
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="w-full py-16 px-6 bg-[#f3f4f6]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1 rounded-full bg-navy text-white text-xs font-bold uppercase tracking-widest">
              How it works
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase text-navy" style={{ letterSpacing: "-0.02em" }}>
              WHAT YOU <span className="italic text-mas-orange">ACTUALLY GET</span>
            </h2>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="h-1 w-12 bg-slate-300 rounded" />
              <div className="h-1.5 w-6 rounded-full bg-mas-orange" />
              <div className="h-1 w-12 bg-slate-300 rounded" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BENEFITS.map(({ icon: Icon, t, d }) => (
              <div key={t} className="parts-card group p-8 rounded-xl flex flex-col items-start">
                <div className="icon-box p-3 rounded-lg mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 italic uppercase text-navy">{t}</h3>
                <p className="text-slate-500 leading-relaxed">{d}</p>
              </div>
            ))}
            <div className="relative rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-xl overflow-hidden bg-navy">
              <div className="absolute bottom-0 left-0 w-full h-2 bg-mas-orange" />
              <h3 className="text-2xl font-black italic text-white mb-2 uppercase tracking-tighter">Have questions?</h3>
              <p className="text-slate-300 text-xs mb-4">Write to us and we'll get back to you within a few hours.</p>
              <button onClick={() => setContactOpen(true)} className="w-full text-white px-6 py-4 font-black uppercase tracking-widest transition-all bg-mas-orange hover:opacity-90">
                Contact us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="proces" className="w-full py-16 px-6 bg-[#f3f4f6]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1 rounded-full bg-slate-200 text-navy text-xs font-bold uppercase tracking-widest">
              Our Process
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 uppercase text-navy" style={{ letterSpacing: "-0.02em" }}>
              HOW IT <span className="italic text-mas-orange">WORKS</span>
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto font-medium">6 steps from your message to the part at your door.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROCESS.map(({ n, icon: Icon, t, d }) => (
              <div key={n} className="parts-card p-5 md:p-8 rounded-xl relative group">
                <span className="step-number">{n}</span>
                <div className="mb-4 text-mas-orange"><Icon className="w-8 h-8" /></div>
                <h4 className="text-xl font-bold mb-2 uppercase text-navy">{t}</h4>
                <p className="text-slate-500 text-sm">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest">
              Trusted by
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold uppercase text-navy" style={{ letterSpacing: "-0.02em" }}>
              WHAT CLIENTS SAY ABOUT US
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {REVIEWS.map((r, i) => (
              <div key={i} className="review-card p-8 rounded-2xl relative pt-12">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 p-2 rounded-lg shadow-sm" style={{ background: r.color, color: r.color === "#e2e8f0" ? "var(--navy)" : "white" }}>
                  <Quote className="w-5 h-5" />
                </div>
                <div className="flex-grow flex items-center justify-center mb-6 mt-2">
                  <p className="text-slate-600 italic leading-relaxed">"{r.q}"</p>
                </div>
                <div className="w-full border-t border-slate-100 pt-4 mt-auto">
                  <p className="font-bold text-lg text-navy">{r.n}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{r.c}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-6 py-12 bg-[#f3f4f6]">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1.5 z-20 bg-mas-orange" />
            <div className="flex flex-col lg:flex-row">
              <div className="p-10 md:p-16 lg:w-2/3 relative z-10">
                <div className="inline-block mb-6 px-4 py-1 rounded-sm text-xs font-bold uppercase tracking-widest border-l-2 text-mas-orange border-mas-orange bg-white/10">
                  Built on experience
                </div>
                <h2 className="text-3xl md:text-5xl font-black italic text-white mb-8 uppercase" style={{ letterSpacing: "-0.02em" }}>
                  FROM WORKSHOP OWNERS,<br />
                  <span className="text-mas-orange">FOR WORKSHOP OWNERS</span>
                </h2>
                <div className="space-y-6 text-slate-300 text-lg leading-relaxed text-left">
                  <p>We didn't just open a trading company; <span className="text-white font-bold italic">we created a solution to our own problems.</span></p>
                  <p>Our experience is based on running a total of 4 of our own workshops, so we perfectly understand the challenges you face every day. We know the stress of a car blocking a lift because of a missing bolt.</p>
                  <p>MAS Parts was created to effectively solve one of the key problems in the industry: <span className="text-mas-orange font-bold uppercase">Logistics.</span> We take the problems on ourselves so you can focus on the work.</p>
                </div>
                <div className="mt-12 flex flex-wrap items-center gap-8 md:gap-12 border-t border-slate-800 pt-8">
                  {[["4","Own workshops"],["99%","Available parts"],["11+","B2B Partners"]].map(([num, lbl], i) => (
                    <div key={i} className="flex items-center gap-8 md:gap-12">
                      <div className="flex flex-col">
                        <span className="text-3xl font-black text-white italic">{num}</span>
                        <span className="text-xs uppercase text-slate-400 font-bold tracking-widest">{lbl}</span>
                      </div>
                      {i < 2 && <div className="w-px h-10 bg-slate-700 hidden md:block" />}
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative w-full lg:w-1/3 bg-slate-800 flex flex-col group">
                <div className="relative h-96 lg:absolute lg:inset-0 lg:h-full w-full z-0">
                  <img
                    src="https://d1yei2z3i6k35z.cloudfront.net/15618994/697e3d5dc2511_524328434_24789902067262583_8208866975824560474_n.jpg"
                    alt="Workshop Owner"
                    className="w-full h-full object-cover object-top opacity-90 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent hidden lg:block" />
                </div>
                <div className="relative z-10 bg-slate-900 p-8 lg:bg-transparent lg:absolute lg:bottom-0 lg:w-full lg:p-10 text-center">
                  <div className="mb-4 mx-auto w-20 h-20 rounded-full flex items-center justify-center border-4 border-slate-900 relative -mt-14 lg:mt-0 bg-mas-orange" style={{ boxShadow: "0 0 30px rgba(255,123,0,0.5)" }}>
                    <Award className="w-10 h-10 text-white" />
                  </div>
                  <h5 className="text-white font-bold text-2xl mb-2 italic">Local Support</h5>
                  <p className="text-slate-200 text-sm font-medium leading-relaxed">"We operate in Iceland; we know local needs and market realities."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 px-6 bg-white text-navy">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest">
              Knowledge
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold uppercase leading-tight text-navy" style={{ letterSpacing: "-0.02em" }}>
              FREQUENT <span className="italic text-mas-orange">QUESTIONS</span>
            </h2>
            <p className="text-slate-500 mt-4">Everything you need to know about working with MAS Parts in one place.</p>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ.map(([q, a], i) => (
              <AccordionItem key={i} value={`f-${i}`} className="rounded-xl border border-slate-200 bg-slate-50 px-5 data-[state=open]:bg-white data-[state=open]:shadow-sm transition-all">
                <AccordionTrigger className="hover:no-underline text-left text-base md:text-lg font-bold text-navy py-5">
                  <span>{q}</span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed pb-5">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 relative overflow-hidden bg-navy">
        <div className="cta-pattern absolute inset-0" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black italic mb-6 leading-tight text-white uppercase" style={{ letterSpacing: "-0.02em" }}>
            GOT A LINK? <span className="text-mas-orange">SEND IT TO US.</span>
          </h2>
          <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Paste the link, fill in your details, click send. We reply with the full price. You decide. That's the whole process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="#order" className="text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-3 text-lg w-full sm:w-auto justify-center bg-mas-orange hover:opacity-90">
              Get a Quote <ArrowUpRight className="w-6 h-6" />
            </a>
            <button onClick={() => setContactOpen(true)} className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-white/20 transition-all flex items-center gap-3 w-full sm:w-auto justify-center">
              Have a Question <MessageCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-8 text-sm text-slate-400 font-medium flex flex-wrap justify-center gap-4">
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-mas-orange" /> Secure VIN selection</span>
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-mas-orange" /> Fast shipping</span>
          </p>
        </div>
      </section>

      <Footer />
      <FloatContact open={contactOpen} setOpen={setContactOpen} />
    </>
  );
}
