-- Pantry LK — factory address and map link (matches the Google Maps listing "Pantry LK (Pvt) Ltd").
-- Only fills them in if they're still empty, so edits made later in the database are kept.

update public.site_settings
set address = coalesce(nullif(address, ''), '248 Aguruwathota Road, Bandaragama 12530, Sri Lanka'),
    map_url = coalesce(nullif(map_url, ''), 'https://maps.app.goo.gl/AmypXMnGY2ShRuwJA')
where id = 1;
