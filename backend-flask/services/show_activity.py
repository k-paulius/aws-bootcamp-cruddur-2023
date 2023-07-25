from lib.db import db

class ShowActivity:
  def run(activity_uuid):

    sql = db.template('activities','show')
    results = db.query_array_json(sql,{
      'uuid': activity_uuid
    })
    return results