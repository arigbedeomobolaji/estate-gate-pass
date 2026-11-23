# Deployment checklist

1. Provision PostgreSQL (Supabase or Neon recommended).
2. Set `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, and `DEMO_MODE=false` in Vercel.
3. Run Prisma migration/push against the production database from a controlled environment.
4. Seed only approved non-sensitive demo/test accounts in preview environments.
5. Configure a scheduled retention job using `SystemSetting.retention_days` before operational launch.
6. Add rate limiting/WAF rules for authentication and verification endpoints.
7. Complete admin CRUD, CSV import/export and notification provider integration.
8. Test camera scanning on the exact guard tablet/browser combination.
9. Run browser E2E tests against a preview deployment.
10. Promote the verified preview to production.
