-- this file was manually created
INSERT INTO public.users (display_name, handle, email, cognito_user_id)
VALUES
  ('Walter Boggis',   'walter_boggis',   'boggis@cruddur.me', '9cd83186-bb18-4f73-a577-21f73e1a7299'),
  ('Nathaniel Bunce', 'nathaniel_bunce', 'bunce@cruddur.me',  '5d5b9024-2c6f-4002-8e8f-ac61607c3c6a'),
  ('Franklin Bean',   'franklin_bean',   'bean@cruddur.me',   '36566fc0-2ae3-4e9c-b340-08784f00d4cb');

INSERT INTO public.activities (user_uuid, message, expires_at)
VALUES
  (
    (SELECT uuid from public.users WHERE users.handle = 'walter_boggis' LIMIT 1),
    'This was imported as seed data!',
    current_timestamp + interval '10 day'
  )