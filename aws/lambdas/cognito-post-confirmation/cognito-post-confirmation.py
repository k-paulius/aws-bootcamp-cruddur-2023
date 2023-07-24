import psycopg2
import os

def lambda_handler(event, context):
    user = event['request']['userAttributes']
    #print(event)

    try:
      sql = f"""
         INSERT INTO public.users (
          display_name,
          email,
          handle,
          cognito_user_id
          )
        VALUES(
          '{user['name']}',
          '{user['email']}',
          '{user['preferred_username']}',
          '{user['sub']}'
        )
      """
      conn = psycopg2.connect(os.getenv('PROD_CONNECTION_URL'))
      cur = conn.cursor()
      cur.execute(sql)
      conn.commit()

    except (Exception, psycopg2.DatabaseError) as error:
      print(error)
    finally:
      if conn is not None:
          cur.close()
          conn.close()
          print('Database connection closed.')
    return event