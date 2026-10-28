-- Local development seed: two couples, each with one invitation and a few guests.
-- Sign in as either couple with a magic link (emails arrive in Mailpit, http://127.0.0.1:54324):
--   nino.giorgi@example.com  (draft invitation)
--   ana.luka@example.com     (published invitation)
-- Invitation content follows src/lib/invitations/schema.ts (a draft may leave fields empty).

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated',
   'nino.giorgi@example.com', '', now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-4000-8000-00000000000b', 'authenticated', 'authenticated',
   'ana.luka@example.com', '', now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), 'a0000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-00000000000a', 'email',
   '{"sub":"a0000000-0000-4000-8000-00000000000a","email":"nino.giorgi@example.com","email_verified":true}', now(), now(), now()),
  (gen_random_uuid(), 'b0000000-0000-4000-8000-00000000000b', 'b0000000-0000-4000-8000-00000000000b', 'email',
   '{"sub":"b0000000-0000-4000-8000-00000000000b","email":"ana.luka@example.com","email_verified":true}', now(), now(), now());

insert into public.invitations (id, owner_id, slug, template_id, content, status, paid_at) values
  -- A draft still being filled in: no venue city, deadline or program yet.
  ('a1000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-00000000000a', 'nino-da-giorgi-k7xq', 'lumiere',
   '{
      "partners": ["ნინო", "გიორგი"],
      "startsAt": "2027-06-12T18:00",
      "venue": {"name": "მთაწმინდის ბაღი", "address": "ილია ჭავჭავაძის გამზირი 37"},
      "message": "ძვირფასო მეგობრებო,\nგვიხარია, რომ ჩვენს დღეს ჩვენთან ერთად იქნებით."
    }', 'draft', null),
  ('b1000000-0000-4000-8000-0000000000b1', 'b0000000-0000-4000-8000-00000000000b', 'ana-da-luka-m3pd', 'lumiere',
   '{
      "partners": ["ანა", "ლუკა"],
      "startsAt": "2027-09-04T17:00",
      "venue": {"name": "სასახლე ვინოთეკა", "address": "ერეკლე II-ის ქუჩა 12", "city": "თელავი"},
      "message": "გელოდებით ჩვენს დღესასწაულზე.",
      "program": [{"time": "17:00", "label": "ჯვრისწერა"}, {"time": "19:00", "label": "ვახშამი"}],
      "rsvpDeadline": "2027-08-15"
    }', 'published', now());

insert into public.guests (id, invitation_id, name, max_party_size) values
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-0000000000a1', 'თამარ ბერიძე', 2),
  ('a2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-0000000000a1', 'დავით ჩიქოვანი', 1),
  ('a2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-0000000000a1', 'მარიამ და ლევან კაპანაძეები', 4),
  ('b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-0000000000b1', 'ეკატერინე გელაშვილი', 2),
  ('b2000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-0000000000b1', 'ნიკოლოზ ლომიძე', 1),
  ('b2000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-0000000000b1', 'სოფო მახარაძე', 3);

insert into public.rsvps (guest_id, attending, party_size) values
  ('a2000000-0000-4000-8000-000000000001', true, 2),
  ('b2000000-0000-4000-8000-000000000001', true, 2),
  ('b2000000-0000-4000-8000-000000000002', false, 0);

insert into public.orders (invitation_id, provider, provider_payment_id, amount, currency, status, ref_code) values
  ('b1000000-0000-4000-8000-0000000000b1', 'dodo', 'seed_pay_ana_luka', 4900, 'GEL', 'paid', 'TAMADA');
