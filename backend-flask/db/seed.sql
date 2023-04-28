-- this file was manually created
INSERT INTO public.users (display_name, handle, email, cognito_user_id)
VALUES
  ('Firsty Lasty The First',  'firsty_lasty_01', 'firsty_lasty_01@cruddur.com', 'MOCK'),
  ('Firsty Lasty The Second', 'firsty_lasty_02', 'firsty_lasty_02@cruddur.com', 'MOCK'),
  ('Firsty Lasty The Third',  'firsty_lasty_03', 'firsty_lasty_03@cruddur.com', 'MOCK');

INSERT INTO public.activities (user_uuid, message, expires_at)
VALUES
  (
    (SELECT uuid from public.users WHERE users.handle = 'firsty_lasty_01' LIMIT 1),
    'This was imported as seed data!',
    current_timestamp + interval '10 day'
  )