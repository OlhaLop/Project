import re
from flask import Flask, jsonify, render_template, request, url_for
from flask_jsglue import JSGlue

from cs50 import SQL

# configure application
app = Flask(__name__)
JSGlue(app)

# ensure responses aren't cached
if app.config["DEBUG"]:
    @app.after_request
    def after_request(response):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Expires"] = 0
        response.headers["Pragma"] = "no-cache"
        return response

# configure CS50 Library to use SQLite database
db = SQL("sqlite:///places.db")

@app.route("/")
def index():
    """Render map."""
    return render_template("index.html")

@app.route("/search")
def search():
    """Search for places that match query."""

    r=request.args.get("region")
    t=request.args.get("type")

    if r=="all_ukraine" and t=="all":
        rows=db.execute("SELECT * FROM tourist_attractions JOIN regions ON tourist_attractions.region=regions.id")
        rows_all=rows
    elif r=="all_ukraine" and t!="all":
        rows=db.execute("""SELECT * FROM tourist_attractions JOIN regions ON tourist_attractions.region=regions.id
            WHERE type=:t""",t=t)
        rows_all=rows
    elif r!="all_ukraine" and t=="all":
        rows = db.execute("""SELECT * FROM tourist_attractions JOIN regions ON tourist_attractions.region=regions.id
            WHERE tourist_attractions.region=:r""", r=r)
        rows_all=db.execute("SELECT * FROM tourist_attractions JOIN regions ON tourist_attractions.region=regions.id")
    elif r!="all_ukraine" and t!="all":
        rows = db.execute("""SELECT * FROM tourist_attractions JOIN regions ON tourist_attractions.region=regions.id
            WHERE tourist_attractions.region=:r AND type=:t""", r=r,t=t)
        rows_all=db.execute("""SELECT * FROM tourist_attractions JOIN regions ON tourist_attractions.region=regions.id
            WHERE type=:t""",t=t)

    # output places as JSON
    return jsonify(rows,rows_all)