# StayOnStay — Architecture & Roadmap

## 1. Confirmed stack

| Layer | Choice |
|-------|--------|
| **Frontend** | Vite + React + TypeScript + React Router + shadcn/ui |
| **Backend** | Supabase |
| **Auth** | Supabase Auth (Google OAuth + Phone OTP) |
| **SMS OTP + WhatsApp** | Twilio |
| **Payments** | Razorpay |
| **Hosting** | Vercel |

---

## 2. Frontend (client)

- **Framework:** Vite, React, TypeScript  
- **Routing:** React Router  
- **UI:** shadcn/ui, Tailwind CSS  
- **Theme:** next-themes  
- **Scripts:** `npm run dev` (vite), `npm run build` (vite build)

**Responsibilities:** Login UI, booking flow, payment page, user dashboard, admin panel.

---

## 3. Backend & database (Supabase)

- **Engine:** PostgreSQL  
- **Stored data:** users, services, bookings, payments, notifications  
- **Features:** Database, REST API, Row Level Security (RLS), Edge Functions, Auth  

---

## 4. Authentication (Supabase Auth)

- **Provider:** Supabase Auth  
- **Methods:** Google Sign-In (Google OAuth), Phone OTP  

---

## 5. SMS OTP (Twilio)

1. User enters phone number  
2. Supabase generates OTP  
3. Twilio sends SMS  
4. User verifies OTP  
5. Login successful  

**Rough cost:** ~$2/month for 100 OTPs  

---

## 6. WhatsApp notifications (Twilio)

- **Use:** Booking confirmation, reminders, driver details  
- **Flow:** e.g. Payment success → Edge Function → Twilio API → WhatsApp message  
- **Rough cost:** ~$2/month  

---

## 7. Payments (Razorpay)

- **Supported:** UPI, debit/credit cards, net banking, international cards  
- **International:** US, UAE, Rwanda etc.; currency conversion via bank  
- **Fees:** ~2–3% per transaction  

---

## 8. Backend logic / automation

- **Location:** Supabase Edge Functions  
- **Example:** Payment success → Edge Function → Twilio → WhatsApp confirmation  

---

## 9. High-level architecture

```
User Browser
      ↓
Vite + React Frontend
      ↓
Supabase Auth
      ↓
Supabase PostgreSQL
      ↓
Supabase Edge Functions
      ↓
Razorpay  ←→  Twilio (SMS + WhatsApp)
```

---

## 10. Estimated monthly cost (e.g. 100 bookings)

| Service | Cost |
|---------|------|
| Supabase | $0 |
| SMS OTP | ~$2 |
| WhatsApp | ~$2 |
| Hosting (Vercel) | $0 |
| Payment gateway | ~2–3% per transaction |
| **Infrastructure total** | **~$4/month** |

---

## 11. Premium UI/UX layer

- **Framer Motion** — page transitions, hover, loading skeletons, modals, micro-interactions  
- **Lucide** — icons (fits shadcn)  
- **Tailwind CSS** — already in use  

Goal: polished, premium feel.

---

## 12. Professional dashboard

- Booking history, payment history, upcoming bookings  
- Cancel / reschedule booking  
- **Libraries:** Recharts, TanStack Table  
- **Widgets:** Total bookings, revenue, upcoming services, customer list  

---

## 13. Real-time updates

- **Supabase Realtime**  
- Example: driver accepts booking → customer dashboard updates instantly (Uber-style).  

---

## 14. Notifications (multi-channel)

- **Current:** WhatsApp (Twilio)  
- **Add:** Email (e.g. Resend), in-app notifications  
- **Use cases:** Booking confirmed, payment success, driver assigned, reminders  

---

## 15. Role-based access (RLS)

- **Supabase RLS**  
- **Roles:** customer, driver, admin  
- **Examples:** Customer → own bookings; Driver → assigned; Admin → all.  

---

## 16. Performance

- Code splitting, lazy loading, API caching  
- **TanStack Query** — faster loading, caching, API management  

---

## 17. Analytics (optional)

- **Tools:** PostHog, Google Analytics  
- **Track:** Bookings, activity, conversion, popular services  

---

## 18. Progressive Web App (optional)

- **Vite PWA Plugin**  
- Installable app, push notifications, offline features  

---

## 19. Security

- Rate limiting, API validation, JWT checks, captcha on OTP  
- **Tool:** e.g. Cloudflare  

---

## 20. Premium customer experience

- Booking status tracking, driver live status, ETA  
- **Maps:** e.g. Google Maps API  

---

## Premium architecture (target)

```
Vite + React + TypeScript
       ↓
React Router
       ↓
shadcn/ui + Framer Motion
       ↓
Supabase (Auth + DB + Realtime)
       ↓
Razorpay
       ↓
Twilio (SMS + WhatsApp)
       ↓
Resend (Email)
       ↓
Analytics (e.g. PostHog)
```

---

## Top 3 premium upgrades (quick wins)

1. **Framer Motion** — animations across the app  
2. **TanStack Query** — data layer, caching, loading states  
3. **Supabase Realtime** — live updates (e.g. booking/driver status)  

These three make the product feel significantly more professional with limited scope.
