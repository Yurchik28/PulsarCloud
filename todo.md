# KirovskDC Platform - Development TODO

## Database & Backend
- [x] Design and implement database schema (servers, gpus, instances, orders, users)
- [x] Create database migrations
- [x] Implement tRPC procedures for all features

## Frontend Pages & Features
- [x] Landing page with hero, features, and terminal demo
- [x] Cloud servers catalog with filtering
- [x] Cloud server detail page
- [x] GPU rental catalog with real-time availability
- [x] GPU detail page
- [x] Add real GPU data (A100, H100, RTX 4090) to database
- [x] Create GPU catalog page with filtering and sorting
- [x] Create GPU detail pages with specifications
- [x] Pricing comparison page
- [x] Contact page with support form
- [x] User authentication (login/signup)
- [x] User dashboard with active instances
- [x] Booking/configuration system
- [x] Order management
- [x] Admin panel - inventory management
- [x] Admin panel - order management
- [x] Admin panel - pricing management

## UI/UX & Design
- [x] Global navigation and layout
- [x] Responsive design for mobile/tablet/desktop
- [x] Smooth animations and transitions
- [x] Premium modern design with enhanced visuals
- [x] Translate all content to Russian
- [x] Dark theme as default
- [x] Loading states and error handling
- [x] Empty states for lists

## Testing & Optimization
- [x] Write vitest tests for backend procedures (17 tests passing)
- [ ] Write vitest tests for critical frontend components
- [x] Performance optimization
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing

## Major Redesign v2
- [x] Fix text contrast issues in dark theme (headers, pricing cards, etc.)
- [x] Switch all prices to Russian rubles
- [x] Add real Russian IaaS market pricing based on uploaded spreadsheets
- [x] Expand GPU catalog with RTX 5090, more models, real prices from immers.cloud
- [x] Remove default/generic SVG icons, create premium custom design
- [x] Redesign landing page with million-dollar premium UI
- [x] Redesign cloud servers catalog with new design language
- [x] Redesign GPU catalog with new design language
- [x] Build pricing tariff grid page with Russian market rates
- [x] Build contact page
- [x] Build user dashboard
- [x] Build booking/order system
- [x] Build admin panel

## Calculator & Deployment Guide
- [x] Interactive pricing calculator page with sliders for CPU, RAM, storage, GPU
- [x] Manual input fields alongside sliders for precise values
- [x] Server cost calculator with hourly/monthly toggle
- [x] GPU cost calculator with model selection and quantity
- [x] Summary section with total cost breakdown
- [x] Add calculator to site navigation
- [x] Write deployment guide for Cloudflare Tunnel + custom domain

## Billing & Auth (v3)
- [x] Extend DB schema: billing_records table, per-minute pricing fields
- [x] Billing engine: per-minute accrual cron job on server
- [x] tRPC procedures: startInstance, stopInstance, getBillingHistory, getBalance
- [x] Auth flow: login page, protected routes, session handling
- [x] Personal dashboard: active instances, balance, usage stats
- [x] Billing history page: itemized per-minute charges
- [x] Instance management: start/stop with real-time cost counter
- [x] Vitest tests: billing calculations, auth procedures, instance lifecycle (43 tests passing)

## v4 - UI Improvement & TimeWeb Integration
- [x] Generate beautiful hero/feature images (datacenter hero, GPU cluster)
- [x] Improve landing page UI with generated background images
- [x] Switch billing model from per-minute to per-hour (like TimeWeb)
- [x] Update billing engine to hourly accrual (calculateHours, calculateCharge)
- [x] Update Dashboard to show hourly billing instead of per-minute
- [x] Fix all "посекундная/поминутная тарификация" copy to "почасовая"
- [x] Update pricing to +10% over TimeWeb (T4: 33₽, 4090: 99₽, 5090: 149₽, A100-40: 165₽, A100-80: 220₽, H100: 385₽, H200: 550₽)
- [x] Update Calculator prices to match new pricing model
- [x] Update Pricing page with new prices
- [x] Update cloud server seed data with new pricing
- [x] Write vitest tests for hourly billing (26 billing tests)
- [x] Fix TypeScript errors (reduced from 18 to 1 pre-existing tRPC type issue)
- [x] Fix drizzle schema boolean defaults
- [x] Fix db.ts return types for proper TS inference
- [x] Final checkpoint and delivery

## v5 - Infrastructure MVP (Control Node + Compute Node + Site Integration)
- [ ] Add infrastructure router to website tRPC (proxy to Control Node)
- [ ] Add "Создать сервер" button on CloudServerDetail page calling Control Node API
- [ ] Add VM management section to Dashboard (real VMs from Control Node)
- [ ] Add balance top-up UI in Dashboard
- [ ] Write deployment guide for Control Node (Russia) + Compute Node (Hetzner)
- [ ] Add vitest tests for infrastructure tRPC router
- [ ] Save checkpoint with all infrastructure code

## v5 - Infrastructure MVP (Control Node + Compute Node)

- [x] Infrastructure tRPC router (server/routers/infrastructure.ts)
- [x] Control Node API proxy (listVMs, createVM, startVM, stopVM, deleteVM, healthCheck)
- [x] CloudServerDetail - VM creation form with plan/OS selector
- [x] Dashboard - KVM VM tab with real-time status
- [x] Infrastructure vitest tests (26 tests)
- [x] DEPLOYMENT.md guide (Control Node + Compute Node)
