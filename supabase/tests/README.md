# Database tests

These check the security rules and the family rules on a throwaway local Postgres, never on your real project.
They are what proved migrations 001 to 005 (132 checks in total) before they were handed over.

How they run (needs PostgreSQL 16 installed locally):
1. Start a scratch server and create a database `wt`.
2. Run `stubs.sql` (it fakes the parts Supabase provides: `auth`, `storage`, `pg_net`, Vault).
3. Run the migrations in order, then `python3 test_security.py`, `python3 test_welcome.py`, `python3 test_family_core.py`.
Each test script prints PASS or FAIL per check and a final total. Rebuild the database between scripts.
