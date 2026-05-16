// src/lib/supabase.js
// ✅ FIXED: Supabase realtime was broken (wrong anon key format + Supabase project may not exist).
// All emergency drills and SOS now use the MySQL backend via REST API.
// This file is kept so existing imports don't crash, but Supabase is no longer used.

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Stub that satisfies old `supabase.from(...).select()` call patterns
// so any missed import doesn't throw. Real data comes from fetch() in components.
export const supabase = {
  from: () => ({
    select: async () => ({ data: [], error: { message: "Supabase removed – use REST API" } }),
    insert: async () => ({ data: null, error: { message: "Supabase removed – use REST API" } }),
    update: async () => ({ data: null, error: { message: "Supabase removed – use REST API" } }),
    delete: async () => ({ data: null, error: { message: "Supabase removed – use REST API" } }),
    eq:     function() { return this; },
    order:  function() { return this; },
    gte:    function() { return this; },
    limit:  function() { return this; },
    single: async function() { return { data: null, error: null }; },
  }),
  channel: () => ({
    on:          function() { return this; },
    subscribe:   function() { return { unsubscribe: () => {} }; },
    unsubscribe: () => {},
  }),
};

// Stub subscriptions (no-ops) — components should use polling instead
export const subscribeToDrills = (callback) => {
  return { unsubscribe: () => {} };
};

export const subscribeToAlerts = (callback) => {
  return { unsubscribe: () => {} };
};

export default supabase;