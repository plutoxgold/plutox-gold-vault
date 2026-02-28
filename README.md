# Plutox Gold Vault

Fractional physical gold investment platform.

## Apps
| App | Path |
|-----|------|
| Customer Web App | /customer-app |
| Admin Dashboard  | /admin-app    |

## Tech Stack
- React + Vite
- Supabase (PostgreSQL + Auth + Realtime)
- Stripe (payments + recurring billing)
- Metals API (live gold price)
- Vercel (hosting)

## Getting Started
```bash
git clone https://github.com/your-username/plutox-gold-vault.git
cd plutox-gold-vault
cd customer-app && npm install
cd ../admin-app  && npm install
```

Copy .env.example to .env.local in each app and fill in your keys.

```bash
cd customer-app && npm run dev   # http://localhost:5173
cd admin-app    && npm run dev   # http://localhost:5174
```

## Environment Variables
| Variable | Description |
|----------|-------------|
| VITE_SUPABASE_URL | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Supabase anon key |
| VITE_STRIPE_PUBLIC_KEY | Stripe publishable key |

## Supabase Setup
1. Create project at supabase.com
2. Run supabase/schema.sql in SQL editor
3. supabase functions deploy process-storage-billing