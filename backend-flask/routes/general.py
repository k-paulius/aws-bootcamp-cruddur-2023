from flask import request, g

def load(app):
  @app.route('/api/health-check')
  def health_check():
    return {'success': True}, 200
