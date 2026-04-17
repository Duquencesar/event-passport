-- Remove tabelas com PII do Realtime para evitar broadcast de nomes/emails
ALTER PUBLICATION supabase_realtime DROP TABLE public.people;
ALTER PUBLICATION supabase_realtime DROP TABLE public.registrations;