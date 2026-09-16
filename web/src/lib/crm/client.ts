import { createClient } from '@supabase/supabase-js'

/**
 * The Akhari CRM's own Supabase project (`D:\projects\Akhari- CRM`), not a
 * database this site owns. The website only ever inserts into `leads`, never
 * reads — the anon key is scoped by an insert-only RLS policy restricted to a
 * fixed column list (see `Akhari- CRM/supabase/002_public_website_enquiry.sql`),
 * so shipping it in the client bundle is the intended Supabase security model,
 * not a leak.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const crm = url && anonKey ? createClient(url, anonKey) : null
