import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as config from "./config.js";

const SUPABASE_URL =
  config.SUPABASE_URL ||
  config.supabaseUrl ||
  config.SUPABASE_PROJECT_URL ||
  config.PROJECT_URL;

const SUPABASE_KEY =
  config.SUPABASE_PUBLISHABLE_KEY ||
  config.SUPABASE_ANON_KEY ||
  config.SUPABASE_KEY ||
  config.supabaseKey ||
  config.PUBLISHABLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("Supabase URL is missing in js/config.js");
}

if (!SUPABASE_KEY) {
  throw new Error("Supabase publishable key is missing in js/config.js");
}

export const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);