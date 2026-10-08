# LocalShore core 0.1.0

Canonical shared source for three independent repositories. Run `node scripts/sync-localshore-core.mjs` from ShorelineShopper-GMap in the LocalShoree workspace to synchronize checked-in `src/shared/core` snapshots. `--check` is read-only. Deployments use their local snapshots and need no sibling repository or registry access.

No module may import application routes, role-private services, a Supabase client, or credentials here. Database row adapters bind each app's existing generated Database type. Seller/customer DTOs are named views of the same persisted order, not separate order systems. The existing generated schemas are not silently replaced. Publish/registry distribution can replace snapshots later as a separately reviewed infrastructure change.
