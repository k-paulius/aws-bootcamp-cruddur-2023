from flask import Flask
from flask import request, g
from flask_cors import cross_origin

from aws_xray_sdk.core import xray_recorder

from lib.xray import init_xray
from lib.rollbar import init_rollbar
from lib.honeycomb import init_honeycomb
from lib.cors import init_cors
from lib.helpers import model_json
from lib.cognito_jwt_token import jwt_required

import routes.general
import routes.activities
import routes.users
import routes.messages

app = Flask(__name__)

# initialization
init_xray(app)
init_honeycomb(app)
init_cors(app)
with app.app_context():
  g.rollbar = init_rollbar(app)

# load routes
routes.general.load(app)
routes.activities.load(app)
routes.users.load(app)
routes.messages.load(app)

if __name__ == "__main__":
  app.run(debug=True)