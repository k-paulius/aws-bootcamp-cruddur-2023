from flask import got_request_exception
import os
import rollbar
import rollbar.contrib.flask

def init_rollbar(app):
  rollbar_access_token = os.getenv('ROLLBAR_ACCESS_TOKEN')
  app_env = os.getenv('BACKEND_APP_ENV')
  rollbar.init(
      # access token
      rollbar_access_token,
      # environment name
      app_env,
      # server root directory, makes tracebacks prettier
      root=os.path.dirname(os.path.realpath(__file__)),
      # flask already sets up logging
      allow_logging_basic_config=False)
  # send exceptions from `app` to rollbar, using flask's signal system.
  got_request_exception.connect(rollbar.contrib.flask.report_exception, app)
  return rollbar