import { useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import {
  HeartHandshake,
  PlaneTakeoff,
  Hotel,
  UserRound,
  Building2,
  Hospital,
  ChevronRight,
  FileText,
  Plane,
  Stethoscope,
  HeartPulse,
  Home,
  CheckCircle2,
  Sparkles,
  RefreshCcw,
  Mail,
  Users,
  BedDouble,
  CarFront,
  ClipboardList,
  Percent,
  Award,
  Clock,
  Headphones,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import { NavLink } from "react-router-dom";
import { useMtText } from "@/lib/medTourismText";
import {
  MED_TOURISM_WHY_INDIA_SECTION_ID,
  pathForJourneyContext,
  type JourneyContext,
} from "@/lib/medTourismTopicPaths";
import { cn } from "@/lib/utils";

type Country = "nigeria" | "kenya" | "ghana" | "south-africa";
type Treatment = "Heart Bypass" | "Hip Replacement" | "Dental Implants" | "Fertility / IVF";

const countryLabel: Record<Country, string> = {
  nigeria: "Nigeria",
  kenya: "Kenya",
  ghana: "Ghana",
  "south-africa": "South Africa",
};

const pricing: Record<Country, Record<Treatment, { local: number; india: number }>> = {
  nigeria: {
    "Heart Bypass": { local: 18000, india: 5500 },
    "Hip Replacement": { local: 12000, india: 6000 },
    "Dental Implants": { local: 3000, india: 800 },
    "Fertility / IVF": { local: 8000, india: 3500 },
  },
  kenya: {
    "Heart Bypass": { local: 16000, india: 5500 },
    "Hip Replacement": { local: 10500, india: 6000 },
    "Dental Implants": { local: 2600, india: 800 },
    "Fertility / IVF": { local: 7200, india: 3500 },
  },
  ghana: {
    "Heart Bypass": { local: 16500, india: 5500 },
    "Hip Replacement": { local: 11200, india: 6000 },
    "Dental Implants": { local: 2800, india: 800 },
    "Fertility / IVF": { local: 7600, india: 3500 },
  },
  "south-africa": {
    "Heart Bypass": { local: 25000, india: 5500 },
    "Hip Replacement": { local: 15000, india: 6000 },
    "Dental Implants": { local: 4000, india: 800 },
    "Fertility / IVF": { local: 10000, india: 3500 },
  },
};

function CountUp({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const control = animate(0, value, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => control.stop();
  }, [value]);
  return <>{`${prefix}${display.toLocaleString()}${suffix}`}</>;
}

function ScreenShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center space-y-3">
        {eyebrow ? (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {eyebrow}
          </Badge>
        ) : null}
        <h3 className="font-heading text-3xl md:text-4xl font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground max-w-3xl mx-auto">{subtitle}</p>
      </motion.div>
      {children}
    </div>
  );
}

export function CostSavingsScreen() {
  const tx = useMtText();
  const [country, setCountry] = useState<Country>("nigeria");
  const [treatment, setTreatment] = useState<Treatment>("Heart Bypass");
  const picked = pricing[country][treatment];
  const savingsPct = Math.round(((picked.local - picked.india) / picked.local) * 100);

  const barData = (["nigeria", "kenya", "ghana", "south-africa"] as Country[]).map((c) => ({
    country: countryLabel[c],
    local: pricing[c]["Heart Bypass"].local,
    india: pricing[c]["Heart Bypass"].india,
  }));

  const expenseBreakdown = [
    { name: "Treatment", value: 65, fill: "var(--color-treatment)" },
    { name: "Travel", value: 15, fill: "var(--color-travel)" },
    { name: "Stay", value: 14, fill: "var(--color-stay)" },
    { name: "Misc", value: 6, fill: "var(--color-misc)" },
  ];

  return (
    <ScreenShell
      title="Save Up to 70% on Medical Treatments"
      subtitle="Get the same quality care at a fraction of the cost, including travel and stay."
    >
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardDescription>Estimated Average Savings</CardDescription>
            <CardTitle className="text-4xl text-primary">
              <CountUp value={70} suffix="%" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            We show realistic ranges from treatment quotes used during consultation calls. Final pricing depends on diagnosis and hospital package.
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Heart Bypass: Local vs India</CardTitle>
            <CardDescription>Sample benchmark from partner consultation quotes</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ local: { label: "Local Cost", color: "#64748b" }, india: { label: "India Cost", color: "#0ea5e9" } }} className="h-[260px] w-full">
              <BarChart data={barData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="country" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `$${Number(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="local" fill="var(--color-local)" radius={6} />
                <Bar dataKey="india" fill="var(--color-india)" radius={6} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense Breakdown in India</CardTitle>
            <CardDescription>Even with travel and stay, overall spend stays lower</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ treatment: { label: "Treatment", color: "#0284c7" }, travel: { label: "Travel", color: "#0ea5e9" }, stay: { label: "Stay", color: "#7dd3fc" }, misc: { label: "Misc", color: "#bae6fd" } }}
              className="h-[240px] w-full"
            >
              <PieChart>
                <Pie data={expenseBreakdown} dataKey="value" nameKey="name" outerRadius={88} innerRadius={56}>
                  {expenseBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Interactive Savings Calculator</CardTitle>
            <CardDescription>Select your country and treatment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Select value={country} onValueChange={(v) => setCountry(v as Country)}>
                <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nigeria">Nigeria</SelectItem>
                  <SelectItem value="kenya">Kenya</SelectItem>
                  <SelectItem value="ghana">Ghana</SelectItem>
                  <SelectItem value="south-africa">South Africa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={treatment} onValueChange={(v) => setTreatment(v as Treatment)}>
                <SelectTrigger><SelectValue placeholder="Treatment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Heart Bypass">Heart Bypass</SelectItem>
                  <SelectItem value="Hip Replacement">Hip Replacement</SelectItem>
                  <SelectItem value="Dental Implants">Dental Implants</SelectItem>
                  <SelectItem value="Fertility / IVF">Fertility / IVF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Local</p><p className="font-semibold">${picked.local.toLocaleString()}</p></div>
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">India</p><p className="font-semibold text-primary">${picked.india.toLocaleString()}</p></div>
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Savings</p><p className="font-semibold text-emerald-600">{savingsPct}%</p></div>
            </div>
            <p className="text-sm text-muted-foreground">Thousands of patients from Africa save significantly while receiving treatment in accredited Indian hospitals.</p>
          </CardContent>
        </Card>
      </div>
    </ScreenShell>
  );
}

export function HospitalsScreen() {
  const tx = useMtText();
  const stats = [
    { label: "JCI Hospitals", value: 40, suffix: "+" },
    { label: "Specialists", value: 1000, suffix: "+" },
    { label: "International Patients / yr", value: 500000, suffix: "+" },
  ];
  const successTrend = [
    { year: "2020", rate: 88 },
    { year: "2021", rate: 90 },
    { year: "2022", rate: 91 },
    { year: "2023", rate: 92 },
    { year: "2024", rate: 94 },
  ];
  const timeline = ["Accreditation verification", "Modern infrastructure checks", "Technology & protocol alignment", "Outcome monitoring"];

  return (
    <ScreenShell title="World-Class Accredited Hospitals" subtitle="Trusted by international patients for quality and safety.">
      <div className="grid md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader><CardDescription>{s.label}</CardDescription><CardTitle className="text-3xl"><CountUp value={s.value} suffix={s.suffix} /></CardTitle></CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle className="text-lg">Success Rate Trend</CardTitle><CardDescription>Representative partner-program outcomes</CardDescription></CardHeader>
          <CardContent>
            <ChartContainer config={{ rate: { label: "Success Rate", color: "#0284c7" } }} className="h-[260px] w-full">
              <LineChart data={successTrend}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="year" />
                <YAxis domain={[80, 100]} tickFormatter={(v) => `${v}%`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line dataKey="rate" type="monotone" stroke="var(--color-rate)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Certification Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {timeline.map((item, i) => (
              <div key={item} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">{i + 1}</div>
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        {[
          { name: "Dr. R. Menon", exp: "22 years", spec: "Cardiac Surgery" },
          { name: "Dr. P. Rao", exp: "19 years", spec: "Orthopedics" },
          { name: "Dr. N. Kapoor", exp: "17 years", spec: "Fertility & IVF" },
        ].map((doc) => (
          <Card key={doc.name}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><UserRound className="w-4 h-4 text-primary" />{doc.name}</CardTitle>
              <CardDescription>{doc.spec}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{doc.exp} experience supporting international treatment plans.</CardContent>
          </Card>
        ))}
      </div>
    </ScreenShell>
  );
}

export function FasterTreatmentScreen() {
  const tx = useMtText();
  const comparisonRows = [
    { label: "Consultation", africaDays: 20, indiaDays: 2 },
    { label: "Surgery wait", africaDays: 120, indiaDays: 5 },
  ];
  const flowSteps = [
    { icon: FileText, title: "Share Reports", duration: "1 day", detail: "Upload reports via WhatsApp or the form.", badge: "Pre-arranged" },
    { icon: UserRound, title: "Doctor Review", duration: "24-48 hrs", detail: "Specialists review and recommend treatment.", badge: "No waiting" },
    { icon: PlaneTakeoff, title: "Travel Planning", duration: "2-3 days", detail: "Visa, flights, and stay are coordinated.", badge: "24/7 support" },
    { icon: Hospital, title: "Treatment", duration: "Starts in 3-7 days", detail: "Immediate scheduling at accredited hospitals.", badge: "Verified hospitals" },
    { icon: HeartPulse, title: "Recovery", duration: "1-2 weeks", detail: "Guided recovery and follow-up support.", badge: "Continuity of care" },
  ];
  const [activeJourneyStep, setActiveJourneyStep] = useState(1);
  const detailedJourney = [
    {
      icon: PlaneTakeoff,
      title: "Airport Arrival - Warm Welcome",
      status: "completed" as const,
      happens: [
        "Our local coordinator meets you at the airport",
        "Assistance with luggage and immigration guidance",
        "Private transport arranged to your hotel",
      ],
      matters: "No confusion in a new country - you are guided from the first moment.",
      badge: "Pre-arranged",
      update: "Driver assigned and pickup confirmed",
      eta: "Completed",
    },
    {
      icon: Hotel,
      title: "Comfortable Stay Near Hospital",
      status: "active" as const,
      happens: [
        "Pre-booked hotel or recovery apartment",
        "Located close to your hospital",
        "Daily support available if needed",
      ],
      matters: "You stay in a safe, comfortable place during your treatment journey.",
      badge: "24/7 support",
      update: "Check-in support in progress",
      eta: "Next step in 1 day",
    },
    {
      icon: Hospital,
      title: "Hospital Visit & Consultation",
      status: "upcoming" as const,
      happens: [
        "Appointment scheduled in advance",
        "Our team coordinates with doctors",
        "Language or process assistance if required",
      ],
      matters: "No waiting, no confusion - everything is organized before you arrive.",
      badge: "No waiting",
      update: "Consultation slot held",
      eta: "Expected in 1-2 days",
    },
    {
      icon: Stethoscope,
      title: "Treatment & Medical Care",
      status: "upcoming" as const,
      happens: [
        "Treatment at accredited hospitals",
        "Regular updates from care team",
        "Continuous support during hospital stay",
      ],
      matters: "You receive world-class care with full coordination.",
      badge: "Verified hospitals",
      update: "Medical team pre-briefed",
      eta: "Scheduled after consultation",
    },
    {
      icon: HeartPulse,
      title: "Recovery & Follow-Up Care",
      status: "upcoming" as const,
      happens: [
        "Post-treatment recovery planning",
        "Follow-up consultations arranged",
        "Assistance until you are ready to travel",
      ],
      matters: "Your recovery is monitored - not left to chance.",
      badge: "Recovery monitored",
      update: "Follow-up pathway prepared",
      eta: "Starts right after treatment",
    },
    {
      icon: Home,
      title: "Safe Return Home",
      status: "upcoming" as const,
      happens: [
        "Return travel arranged",
        "Medical documents prepared",
        "Continued remote support after return",
      ],
      matters: "Your journey does not end at discharge - we stay connected.",
      badge: "Continuity of care",
      update: "Remote support line ready",
      eta: "When medically fit to fly",
    },
  ];
  const safeActiveJourneyStep = Math.min(Math.max(activeJourneyStep, 0), detailedJourney.length - 1);
  const activeJourney = detailedJourney[safeActiveJourneyStep] ?? detailedJourney[0];
  const journeyProgress = Math.round(((safeActiveJourneyStep + 1) / detailedJourney.length) * 100);
  return (
    <ScreenShell title="Faster Treatment, No Waiting" subtitle="Get treated in days, not months.">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How Fast You Get Treated - Compared Clearly</CardTitle>
            <CardDescription>No hover needed. Understand it in seconds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {comparisonRows.map((row, i) => (
              <div key={row.label} className="space-y-2">
                <p className="text-sm font-semibold">{row.label}</p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Local treatment (Africa)</span>
                      <span className="font-medium">{row.africaDays} days</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min((row.africaDays / 120) * 100, 100)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: i * 0.08 }}
                        className="h-full rounded-full bg-slate-500"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Treatment in India</span>
                      <span className="font-medium">{row.indiaDays} days</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.max((row.indiaDays / 120) * 100, 3)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 + i * 0.08 }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p><span className="font-semibold text-primary">India total to treatment:</span> 7-10 days</p>
              <p className="text-muted-foreground"><span className="font-semibold text-foreground">Local waiting:</span> 2-6 months</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Treatment Journey - Clear & Time-Bound</CardTitle>
            <CardDescription>Each step has a timeline and support status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-3">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
              {flowSteps.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="relative pl-8"
                >
                  <div className="absolute left-0 top-4 h-6 w-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <s.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{s.title}</p>
                      <Badge variant="secondary" className="text-[10px]">{s.duration}</Badge>
                      <Badge variant="outline" className="text-[10px]">{s.badge}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{s.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="pt-3">
              <p className="text-xs text-muted-foreground mb-2">Progress to treatment readiness</p>
              <Progress value={82} />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="sticky top-16 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <CardTitle className="text-lg">Your Journey From Arrival to Recovery - Fully Managed</CardTitle>
          <CardDescription>
            Step {safeActiveJourneyStep + 1} of {detailedJourney.length} - {activeJourney?.update ?? "Journey in progress"}
          </CardDescription>
          <div className="pt-2">
            <Progress value={journeyProgress} />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {detailedJourney.map((item, i) => {
              const isActive = i === safeActiveJourneyStep;
              const isCompleted = i < safeActiveJourneyStep;
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -2 }}
                  onMouseEnter={() => setActiveJourneyStep(i)}
                >
                  <Card
                    onClick={() => setActiveJourneyStep(i)}
                    className={cn(
                      "cursor-pointer transition-all border",
                      isActive && "border-primary bg-primary/5 shadow-md",
                      !isActive && "hover:border-primary/50",
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full border flex items-center justify-center shrink-0",
                          isCompleted ? "bg-emerald-100 border-emerald-500 text-emerald-600" : isActive ? "bg-primary text-primary-foreground border-primary" : "bg-background text-primary",
                        )}>
                          {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className={cn("h-5 w-5", isActive && "animate-pulse")} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={isActive ? "default" : "secondary"}>{item.badge}</Badge>
                            <span className="text-xs text-muted-foreground">{item.eta}</span>
                          </div>
                          <h4 className="font-semibold mt-1">{item.title}</h4>
                          <motion.div
                            initial={false}
                            animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
                            className="overflow-hidden"
                          >
                            <ul className="mt-3 space-y-1 text-sm text-muted-foreground list-disc pl-5">
                              {(item.happens ?? []).map((line) => <li key={line}>{line}</li>)}
                            </ul>
                            <p className="mt-3 text-sm">
                              <span className="font-medium text-foreground">Why it matters: </span>
                              <span className="text-muted-foreground">{item.matters}</span>
                            </p>
                          </motion.div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl border bg-muted/30 p-4 text-sm">
            <p className="text-muted-foreground">
              "From airport pickup to hospital discharge, everything was arranged. I did not feel lost even for a moment."
            </p>
            <p className="mt-2 font-medium">- Patient from Nigeria</p>
          </div>
        </CardContent>
      </Card>
    </ScreenShell>
  );
}

export function ConciergeScreen() {
  const tx = useMtText();
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const supportSplit = [
    { name: "Medical", value: 40, fill: "#0284c7" },
    { name: "Travel", value: 22, fill: "#0ea5e9" },
    { name: "Accommodation", value: 20, fill: "#7dd3fc" },
    { name: "Assistance", value: 18, fill: "#bae6fd" },
  ];
  const services = [
    { icon: PlaneTakeoff, title: "Visa & Flight Assistance" },
    { icon: Hospital, title: "Hospital Coordination" },
    { icon: Building2, title: "Recovery Stay Booking" },
    { icon: HeartHandshake, title: "24/7 Patient Helpdesk" },
  ];
  const processSteps = [
    {
      icon: FileText,
      title: "Tell us your problem",
      summary: "Share your medical details",
      youDo: "Upload your medical reports or describe your condition.",
      weDo: "Our medical experts review your case within 24-48 hours.",
      metric: "Timeline: 1-2 days",
      trustTag: "Doctor-reviewed",
    },
    {
      icon: Hospital,
      title: "Get hospitals and prices",
      summary: "Clear choices, no confusion",
      youDo: "Review recommended hospitals and doctors.",
      weDo: "We provide trusted options with transparent package pricing.",
      metric: "Save up to 70% vs local cost",
      trustTag: "Verified hospitals",
    },
    {
      icon: PlaneTakeoff,
      title: "We plan travel and stay",
      summary: "No stress, everything arranged",
      youDo: "Confirm your preferred treatment plan.",
      weDo: "We coordinate visa, flights, accommodation, and schedules.",
      metric: "Most patients complete this in 2 days",
      trustTag: "No hidden costs",
    },
    {
      icon: Plane,
      title: "You fly to India",
      summary: "Safe arrival, guided support",
      youDo: "Travel to India with your confirmed itinerary.",
      weDo: "Our local team receives you and supports check-in and transfers.",
      metric: "Airport pickup arranged before arrival",
      trustTag: "Arrival assistance",
    },
    {
      icon: HeartPulse,
      title: "Treatment and rest",
      summary: "Expert care, continuous support",
      youDo: "Focus on your health and follow doctor guidance.",
      weDo: "We stay in touch with your care team and support you 24/7.",
      metric: "Daily updates for family",
      trustTag: "24/7 support",
    },
    {
      icon: Sparkles,
      title: "Visit India (optional)",
      summary: "Recover comfortably",
      youDo: "Rest based on your doctor-approved recovery plan.",
      weDo: "We arrange comfortable stay options and light local experiences.",
      metric: "Recovery-first planning",
      trustTag: "Comfort-focused",
    },
    {
      icon: Home,
      title: "Your trip home",
      summary: "Back home, fully supported",
      youDo: "Return home with your discharge and follow-up notes.",
      weDo: "We assist travel closure and post-treatment follow-up coordination.",
      metric: "Follow-up guidance after return",
      trustTag: "Continuity of care",
    },
  ] as const;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const index = Number((visible[0].target as HTMLElement).dataset.stepIndex ?? 0);
          setActiveStep(index);
        }
      },
      {
        threshold: [0.35, 0.55, 0.75],
        rootMargin: "-30% 0px -35% 0px",
      },
    );

    stepRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const progressValue = Math.round(((activeStep + 1) / processSteps.length) * 100);
  return (
    <ScreenShell title={tx("Full patient support")} subtitle={tx("We handle travel and updates. You focus on getting better.")}>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">{tx("Service breakdown")}</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            {services.map((s) => (
              <div key={s.title} className="rounded-xl border p-3 text-sm flex items-start gap-2">
                <s.icon className="w-4 h-4 text-primary mt-0.5" />
                {s.title}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">{tx("Support coverage")}</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{ medical: { label: "Medical", color: "#0284c7" }, travel: { label: "Travel", color: "#0ea5e9" }, accommodation: { label: "Accommodation", color: "#7dd3fc" }, assistance: { label: "Assistance", color: "#bae6fd" } }} className="h-[230px] w-full">
              <PieChart>
                <Pie data={supportSplit} dataKey="value" nameKey="name" outerRadius={86}>
                  {supportSplit.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="sticky top-16 z-20 rounded-t-xl border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <CardTitle className="text-lg">{tx("Process timeline")}</CardTitle>
          <CardDescription>{tx("Step")} {activeStep + 1} {tx("of")} {processSteps.length} - {tx("You are guided at every step")}</CardDescription>
          <div className="pt-2">
            <Progress value={progressValue} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative space-y-3">
            <div className="absolute left-5 top-6 bottom-6 w-px bg-border" />
            {processSteps.map((step, i) => {
              const isActive = i === activeStep;
              const StepIcon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  data-step-index={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  whileHover={{ y: -2 }}
                  onMouseEnter={() => setActiveStep(i)}
                >
                  <Card
                    onClick={() => setActiveStep(i)}
                    className={`relative ml-0 cursor-pointer transition-all ${
                      isActive ? "border-primary shadow-md bg-primary/5" : "hover:border-primary/50"
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        <div className={`relative z-10 mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border ${
                          isActive ? "bg-primary text-primary-foreground border-primary" : "bg-background text-primary border-border"
                        }`}>
                          {i < activeStep ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold text-primary">Step {i + 1}</p>
                            <Badge variant="secondary" className="text-[11px]">{step.trustTag}</Badge>
                          </div>
                          <h4 className="font-semibold text-foreground mt-1">{tx(step.title)}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{tx(step.summary)}</p>

                          <motion.div
                            initial={false}
                            animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
                            className="overflow-hidden"
                          >
                            <div className="grid md:grid-cols-2 gap-3 mt-4">
                              <div className="rounded-lg bg-muted/40 border p-3">
                                <p className="text-xs font-semibold text-foreground mb-1">{tx("What you do")}</p>
                                <p className="text-sm text-muted-foreground">{tx(step.youDo)}</p>
                              </div>
                              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                                <p className="text-xs font-semibold text-foreground mb-1">{tx("What we do")}</p>
                                <p className="text-sm text-muted-foreground">{tx(step.weDo)}</p>
                              </div>
                            </div>
                            <p className="mt-3 text-sm font-medium text-primary">{tx(step.metric)}</p>
                          </motion.div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{tx("Over 10,000 patients used this guided path with our support team.")}</p>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { name: "Amina O.", country: "Nigeria", note: "Saved 62% with coordinated travel support." },
          { name: "David K.", country: "Kenya", note: "Fast scheduling and daily patient updates." },
          { name: "Grace A.", country: "Ghana", note: "Smooth airport-to-recovery experience." },
        ].map((t) => (
          <Card key={t.name}>
            <CardHeader><CardTitle className="text-base">{t.name}</CardTitle><CardDescription>{t.country}</CardDescription></CardHeader>
            <CardContent className="text-sm text-muted-foreground">{tx(t.note)}</CardContent>
          </Card>
        ))}
      </div>
    </ScreenShell>
  );
}

export type { JourneyContext } from "@/lib/medTourismTopicPaths";

const WHY_INDIA_CARD_NAV: {
  key: JourneyContext;
  icon: typeof Percent;
  title: string;
  desc: string;
}[] = [
  {
    key: "cost",
    icon: Percent,
    title: "Save Up to 70%",
    desc: "Get the same quality treatment at a fraction of the cost — including travel and stay.",
  },
  {
    key: "hospitals",
    icon: Award,
    title: "World-Class JCI Hospitals",
    desc: "India has 40+ JCI-accredited hospitals with globally trained specialists.",
  },
  {
    key: "speed",
    icon: Clock,
    title: "Faster Treatment Timelines",
    desc: "No long waiting lists. Get treated within days, not months.",
  },
  {
    key: "support",
    icon: Headphones,
    title: "Full Concierge Support",
    desc: "From visa to recovery — our team handles every detail of your journey.",
  },
];

function LeadRoutingModal({
  open,
  onOpenChange,
  journeyContext,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journeyContext: JourneyContext;
}) {
  const tx = useMtText();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isIndia, setIsIndia] = useState<boolean | null>(null);
  const [detectedCountry, setDetectedCountry] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const detectCountry = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (!mounted) return;
        const countryName = String(data?.country_name ?? "");
        const countryCode = String(data?.country ?? "");
        setDetectedCountry(countryName);
        setIsIndia(countryCode === "IN");
      } catch {
        // Non-blocking: user can still pick location manually.
      }
    };
    detectCountry();
    return () => {
      mounted = false;
    };
  }, [open]);

  const getContextLine = () => {
    const map: Record<JourneyContext, string> = {
      cost: "I am exploring treatment pricing and savings.",
      hospitals: "I want guidance on hospital quality and accreditation.",
      speed: "I need faster treatment timelines.",
      support: "I need full concierge support for travel and recovery.",
    };
    return map[journeyContext];
  };

  const getCountryMessage = (country: string) => {
    const countryMessages: Record<string, string> = {
      Nigeria: "Hello, I am from Nigeria and need help with treatment in India.",
      Kenya: "Hello, I am from Kenya looking for medical treatment options.",
      Ghana: "Hello, I am from Ghana and need guidance for treatment.",
      "South Africa": "Hello, I am from South Africa exploring treatment options.",
      Rwanda: "Hello, I am from Rwanda and need assistance.",
      Uganda: "Hello, I am from Uganda seeking medical support.",
      default: "Hello, I need help with medical treatment in India.",
    };
    return countryMessages[country] || countryMessages.default;
  };

  const handleSubmit = async () => {
    if (!name.trim() || isIndia === null) return;
    setSubmitting(true);
    const country = detectedCountry || (isIndia ? "India" : "International");
    const number = isIndia ? "919312972981" : "250788944143";
    const message = encodeURIComponent(
      `${getCountryMessage(country)} My name is ${name.trim()}.${phone ? ` My phone is ${phone.trim()}.` : ""} ${getContextLine()}`,
    );

    try {
      await fetch("/api/save-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), country, isIndia, source: "why-india-cta", journeyContext }),
      });
    } catch {
      // Optional endpoint in current setup.
    }

    localStorage.setItem("leadCaptured", "true");
    localStorage.setItem("leadCountry", country);
    onOpenChange(false);
    window.open(`https://wa.me/${number}?text=${message}`, "_blank");
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{tx("Get Guidance for Your Treatment")}</DialogTitle>
          <DialogDescription>{tx("We connect you with the right care team in seconds.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {detectedCountry && (
            <p className="text-sm text-muted-foreground">
              {tx("We detected you are from")} <span className="font-medium text-foreground">{detectedCountry}</span>. {tx("Detected location helps us connect you faster.")}
            </p>
          )}
          <div className="space-y-2">
            <Label>{tx("Where are you now?")}</Label>
            <RadioGroup
              value={isIndia === null ? "" : isIndia ? "india" : "outside"}
              onValueChange={(value) => setIsIndia(value === "india")}
              className="gap-3"
            >
              <label className="flex items-center gap-2 rounded-md border p-3 text-sm cursor-pointer">
                <RadioGroupItem value="india" />
                {tx("India")}
              </label>
              <label className="flex items-center gap-2 rounded-md border p-3 text-sm cursor-pointer">
                <RadioGroupItem value="outside" />
                {tx("Outside India")}
              </label>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-name">{tx("Your name")}</Label>
            <Input id="lead-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={tx("Enter your name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-phone">{tx("Phone (optional)")}</Label>
            <Input id="lead-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={tx("Enter phone number")} />
          </div>
          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            {tx("Average response time: 2-5 minutes • Trusted by 10,000+ patients")}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim() || isIndia === null} className="w-full">
            {submitting ? tx("Connecting...") : tx("Continue to WhatsApp")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TreatmentPlanModal({
  open,
  onOpenChange,
  journeyContext,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journeyContext: JourneyContext;
}) {
  const tx = useMtText();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [travelStart, setTravelStart] = useState("");
  const [travelEnd, setTravelEnd] = useState("");
  const [treatmentDuration, setTreatmentDuration] = useState("");
  const [persons, setPersons] = useState("");
  const [rooms, setRooms] = useState("");
  const [roomType, setRoomType] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [cabNeeded, setCabNeeded] = useState<"yes" | "no">("no");
  const [vehicleType, setVehicleType] = useState("4 Seater");
  const [supportServices, setSupportServices] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setCountry(String(data?.country_name ?? ""));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [open]);

  const toggleItem = (list: string[], value: string, setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const hasCorePackageSelection = Boolean(persons && rooms && roomType);
  const parsedRooms = Number((rooms || "0").replace("+", ""));
  const parsedPersons = persons === "5+" ? 5 : Number((persons || "0").split("-")[0]);
  const estimatedMin = hasCorePackageSelection
    ? Math.max(
        450,
        parsedRooms * 300 +
          parsedPersons * 120 +
          (roomType === "Luxury" ? 450 : roomType === "Deluxe" ? 220 : 80),
      )
    : 0;
  const estimatedMax = hasCorePackageSelection
    ? estimatedMin + 700 + (cabNeeded === "yes" ? 250 : 0) + supportServices.length * 70
    : 0;

  const summary = hasCorePackageSelection ? [
    `${roomType} room`,
    `${rooms} room(s)`,
    `${persons} traveler(s)`,
    cabNeeded === "yes" ? `${vehicleType} cab` : "No cab",
    ...supportServices,
  ].join(", ") : "";

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) return;
    setSubmitting(true);
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      country: country.trim(),
      travelStart,
      travelEnd,
      treatmentDuration,
      persons,
      rooms,
      roomType,
      amenities,
      cabNeeded,
      vehicleType: cabNeeded === "yes" ? vehicleType : "",
      supportServices,
      notes: notes.trim(),
      estimatedMin,
      estimatedMax,
      source: "stay-travel-configurator",
      journeyContext,
    };

    try {
      await fetch("/api/save-stay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await fetch("/api/notify-stay-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {}

    const message = encodeURIComponent(
      `Stay & Travel Request\nName: ${payload.name}\nPhone: ${payload.phone}\nEmail: ${payload.email || "-"}\nCountry: ${payload.country || "-"}\nTravel Dates: ${payload.travelStart || "-"} to ${payload.travelEnd || "-"}\nTreatment Duration: ${payload.treatmentDuration || "-"}\nPersons: ${payload.persons}\nRooms: ${payload.rooms}\nRoom Type: ${payload.roomType}\nAmenities: ${payload.amenities.join(", ") || "-"}\nCab: ${payload.cabNeeded}\nVehicle: ${payload.vehicleType || "-"}\nSupport: ${payload.supportServices.join(", ") || "-"}\nNotes: ${payload.notes || "-"}\nEstimated Cost: $${payload.estimatedMin} - $${payload.estimatedMax}`,
    );
    onOpenChange(false);
    window.open(`https://wa.me/250788944143?text=${message}`, "_blank");
    setSubmitting(false);
  };

  const validateStep = (targetStep: number) => {
    const nextErrors: Record<string, string> = {};
    if (targetStep === 0) {
      if (!name.trim()) nextErrors.name = "Name is required";
      if (!phone.trim()) nextErrors.phone = "Phone is required";
      if (!email.trim()) nextErrors.email = "Email is required";
      if (!travelStart) nextErrors.travelStart = "Travel start date is required";
      if (!travelEnd) nextErrors.travelEnd = "Travel end date is required";
      if (!treatmentDuration) nextErrors.treatmentDuration = "Select treatment duration";
    } else if (targetStep === 1) {
      if (!persons) nextErrors.persons = "Please select number of travelers";
    } else if (targetStep === 2) {
      if (!rooms) nextErrors.rooms = "Please select rooms";
      if (!roomType) nextErrors.roomType = "Please select room type";
    } else if (targetStep === 3) {
      if (amenities.length === 0) nextErrors.amenities = "Select at least one amenity";
    } else if (targetStep === 4) {
      if (cabNeeded === "yes" && !vehicleType) nextErrors.vehicleType = "Please select vehicle type";
    } else if (targetStep === 5) {
      if (supportServices.length === 0) nextErrors.supportServices = "Select at least one support service";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const stepTitles = [
    "Basic details",
    "Travel group",
    "Room requirements",
    "Amenities",
    "Transport",
    "Additional support",
    "Other requirements",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-5 gap-4">
        <DialogHeader>
          <Badge variant="secondary" className="w-fit bg-primary/10 text-primary mb-1">
          {tx("Plan your stay and travel")}
          </Badge>
          <DialogTitle className="text-xl sm:text-2xl">{tx("Plan your stay and travel for treatment in India")}</DialogTitle>
          <DialogDescription className="text-sm">{tx("Customize your stay, travel, and support. Get your quote fast.")}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-2.5">
          <p className="text-xs sm:text-sm font-medium">{tx("Section")} {step + 1} {tx("of")} {stepTitles.length}: {tx(stepTitles[step])}</p>
          <Progress value={Math.round(((step + 1) / stepTitles.length) * 100)} className="mt-2" />
        </div>

        <div className="space-y-3 pr-1">
          {step === 0 && (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Name</Label>
                <Input className="h-10" value={name} onChange={(e) => setName(e.target.value)} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Phone Number</Label>
                <Input className="h-10" value={phone} onChange={(e) => setPhone(e.target.value)} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Email</Label>
                <Input className="h-10" value={email} onChange={(e) => setEmail(e.target.value)} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Country</Label>
                <Input className="h-10" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Travel Start</Label>
                <Input className="h-10" type="date" value={travelStart} onChange={(e) => setTravelStart(e.target.value)} />
                {errors.travelStart && <p className="text-xs text-destructive">{errors.travelStart}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs sm:text-sm">Travel End</Label>
                <Input className="h-10" type="date" value={travelEnd} onChange={(e) => setTravelEnd(e.target.value)} />
                {errors.travelEnd && <p className="text-xs text-destructive">{errors.travelEnd}</p>}
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs sm:text-sm">Expected Treatment Duration</Label>
                <Select value={treatmentDuration} onValueChange={setTreatmentDuration}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select duration" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3-7 days">3-7 days</SelectItem>
                    <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                    <SelectItem value="3-4 weeks">3-4 weeks</SelectItem>
                  </SelectContent>
                </Select>
                {errors.treatmentDuration && <p className="text-xs text-destructive">{errors.treatmentDuration}</p>}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <Label className="inline-flex items-center gap-2 text-xs sm:text-sm"><Users className="h-4 w-4 text-primary" /> How many persons traveling?</Label>
              <RadioGroup value={persons} onValueChange={setPersons} className="grid sm:grid-cols-4 gap-2">
                {["1", "2", "3-5", "5+"].map((p) => (
                  <label key={p} className="flex items-center gap-2 rounded-md border p-2.5 cursor-pointer text-sm">
                    <RadioGroupItem value={p} /> {p}
                  </label>
                ))}
              </RadioGroup>
              {errors.persons && <p className="text-xs text-destructive">{errors.persons}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="inline-flex items-center gap-2"><BedDouble className="h-4 w-4 text-primary" /> Number of rooms</Label>
                <RadioGroup value={rooms} onValueChange={setRooms} className="grid grid-cols-3 gap-2">
                  {["1", "2", "3+"].map((r) => <label key={r} className="flex items-center gap-2 rounded-md border p-3 cursor-pointer text-sm"><RadioGroupItem value={r} />{r}</label>)}
                </RadioGroup>
              </div>
              <div className="space-y-1">
                <Label>Room Type</Label>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Deluxe">Deluxe</SelectItem>
                    <SelectItem value="Luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
                {errors.roomType && <p className="text-xs text-destructive">{errors.roomType}</p>}
              </div>
              {errors.rooms && <p className="text-xs text-destructive md:col-span-2">{errors.rooms}</p>}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <Label>Amenities</Label>
              <div className="grid sm:grid-cols-2 gap-2">
                {["WiFi", "Air Conditioning", "Kitchen Setup", "Laundry Service", "Nearby Hospital Access", "Daily Cleaning"].map((a) => (
                  <label key={a} className="flex items-center gap-2 rounded-md border p-3 text-sm cursor-pointer">
                    <Checkbox checked={amenities.includes(a)} onCheckedChange={() => toggleItem(amenities, a, setAmenities)} />
                    {a}
                  </label>
                ))}
              </div>
              {errors.amenities && <p className="text-xs text-destructive">{errors.amenities}</p>}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <Label className="inline-flex items-center gap-2"><CarFront className="h-4 w-4 text-primary" /> Do you need cab service?</Label>
              <RadioGroup value={cabNeeded} onValueChange={(v) => setCabNeeded(v as "yes" | "no")} className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer text-sm"><RadioGroupItem value="yes" /> Yes</label>
                <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer text-sm"><RadioGroupItem value="no" /> No</label>
              </RadioGroup>
              {cabNeeded === "yes" && (
                <div className="space-y-1">
                  <Label>Vehicle type</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4 Seater">4 Seater</SelectItem>
                      <SelectItem value="7 Seater">7 Seater</SelectItem>
                      <SelectItem value="Premium Car">Premium Car</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.vehicleType && <p className="text-xs text-destructive">{errors.vehicleType}</p>}
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-2">
              <Label>Additional support</Label>
              <div className="grid sm:grid-cols-2 gap-2">
                {["Airport Pickup", "Translator", "Personal Care Assistant", "Medical Coordinator", "Fitness Cycle Availability"].map((s) => (
                  <label key={s} className="flex items-center gap-2 rounded-md border p-3 text-sm cursor-pointer">
                    <Checkbox checked={supportServices.includes(s)} onCheckedChange={() => toggleItem(supportServices, s, setSupportServices)} />
                    {s}
                  </label>
                ))}
              </div>
              {errors.supportServices && <p className="text-xs text-destructive">{errors.supportServices}</p>}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-2">
              <Label className="inline-flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Any special requirements?</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special requirements?" className="min-h-[120px]" />
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
          <p className="text-sm font-semibold">Your Package Configuration</p>
          {hasCorePackageSelection ? (
            <>
              <p className="text-xs sm:text-sm"><span className="font-semibold">You selected:</span> {summary}</p>
              <p className="text-xs sm:text-sm"><span className="font-semibold text-primary">Estimated stay cost:</span> ${estimatedMin} - ${estimatedMax}</p>
              <p className="text-xs text-muted-foreground">Get quote within 30 minutes</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Choose your travel group and room preferences in the next sections to unlock an instant package estimate.</p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>{tx("Back")}</Button>
          {step < stepTitles.length - 1 ? (
            <Button
              onClick={() => {
                if (validateStep(step)) {
                  setStep((s) => Math.min(stepTitles.length - 1, s + 1));
                }
              }}
            >
              {tx("Next")}
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (validateStep(0) && validateStep(1) && validateStep(2) && validateStep(3) && validateStep(4) && validateStep(5)) {
                  handleSubmit();
                }
              }}
              disabled={submitting || !name.trim() || !phone.trim()}
            >
              {submitting ? tx("Submitting...") : tx("Get personalized quote")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Full-page topic body: one chart/screen + CTA + modals (used on `/med-tourism/:topic`). */
export function MedTourismTopicContent({ topic }: { topic: JourneyContext }) {
  const tx = useMtText();
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);

  const openCareGuideFlow = () => {
    const alreadySubmitted = localStorage.getItem("leadCaptured");
    if (alreadySubmitted) {
      const savedCountry = localStorage.getItem("leadCountry") || "International";
      const isIndia = savedCountry === "India";
      const number = isIndia ? "919312972981" : "250788944143";
      const message = encodeURIComponent(
        `Hello, I am back for more guidance. I am from ${savedCountry}. I need help with the ${topic} journey.`,
      );
      window.open(`https://wa.me/${number}?text=${message}`, "_blank");
      return;
    }
    setLeadModalOpen(true);
  };

  const screen =
    topic === "cost" ? (
      <CostSavingsScreen />
    ) : topic === "hospitals" ? (
      <HospitalsScreen />
    ) : topic === "speed" ? (
      <FasterTreatmentScreen />
    ) : (
      <ConciergeScreen />
    );

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {screen}
      <Card className="bg-primary text-primary-foreground border-primary/70 shadow-lg">
        <CardContent className="py-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold">{tx("Talk to a Care Expert - Get Clear Answers in Minutes")}</p>
            <p className="text-sm text-primary-foreground/90">{tx("No confusion. No pressure. Just simple guidance for your treatment journey.")}</p>
            <p className="text-xs text-primary-foreground/90 mt-1">{tx("Average response time: 2-5 minutes • Trusted by 10,000+ patients")}</p>
          </div>
          <div className="flex w-full lg:w-auto items-stretch sm:items-center flex-col sm:flex-row gap-2 sm:gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="secondary" className="gap-2 w-full sm:w-auto" onClick={openCareGuideFlow}>
                      {tx("Speak to a care guide")}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>{tx("Detected location helps us connect you faster.")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="ghost"
              className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 hover:text-primary"
              onClick={() => setPlanModalOpen(true)}
            >
              {tx("Plan your stay and travel")}
            </Button>
          </div>
        </CardContent>
      </Card>
      <LeadRoutingModal open={leadModalOpen} onOpenChange={setLeadModalOpen} journeyContext={topic} />
      <TreatmentPlanModal open={planModalOpen} onOpenChange={setPlanModalOpen} journeyContext={topic} />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-3 md:hidden">
        <div className="mx-auto max-w-page flex items-center gap-2">
          <Button onClick={openCareGuideFlow} className="flex-1 gap-2 bg-primary text-primary-foreground">
            {tx("Speak to a care guide")}
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="shrink-0" onClick={() => setPlanModalOpen(true)}>
            {tx("Plan")}
          </Button>
        </div>
        <p className="mt-1 text-center text-[11px] text-muted-foreground">{tx("Avg response 2-5 min")}</p>
      </div>
    </div>
  );
}

function WhyIndiaScreens() {
  const tx = useMtText();

  return (
    <section id={MED_TOURISM_WHY_INDIA_SECTION_ID} className="scroll-mt-24 py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-muted/30 border-y border-border/60">
      <div className="max-w-page mx-auto space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-3"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">{tx("WHY INDIA")}</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground text-balance">
            {tx("Why Patients Choose India")}
          </h2>
          <p
            id="mt-why-india-hint"
            className="text-sm text-muted-foreground max-w-lg mx-auto pt-1 leading-relaxed"
          >
            {tx("Choose a topic below to see charts and full details.")}
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto md:hidden leading-relaxed">
            {tx("On your phone, tap any card below.")}
          </p>
        </motion.div>

        <div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          aria-describedby="mt-why-india-hint"
        >
          {WHY_INDIA_CARD_NAV.map((card, i) => {
            const Icon = card.icon;
            const to = pathForJourneyContext(card.key);
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "group relative rounded-2xl border bg-card p-6 text-center shadow-sm transition-all duration-200 block h-full cursor-pointer",
                      "hover:shadow-lg hover:border-primary/50 hover:bg-primary/5",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      isActive && "ring-2 ring-primary border-primary/50 shadow-md",
                    )
                  }
                  aria-label={`${tx(card.title)} — ${tx("Explore details")}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto transition-colors group-hover:bg-primary/15">
                    <Icon className="w-6 h-6 text-primary" aria-hidden />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {tx(card.title)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tx(card.desc)}</p>
                  <span className="mt-5 inline-flex items-center justify-center gap-1 text-sm font-semibold text-primary">
                    <span>{tx("See details")}</span>
                    <ChevronRight
                      className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                  <p className="mt-2 text-[11px] font-medium text-muted-foreground/90 md:hidden">
                    {tx("Tap to open")}
                  </p>
                </NavLink>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export { WhyIndiaScreens };
