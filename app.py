from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from status_dao import *
app = Flask(__name__)
cors = CORS(app, origins=["http://127.0.0.1:5500/", "http://localhost:5500", "*"], resources={r"/*":{"origins":"*"}})

## URL 별로 함수명이 같거나,
## route('/') 등의 주소가 같으면 안 됩니다.

@app.route('/')
def home():
   return render_template('index.html')

@app.route('/refresh', methods=['GET'])
def refresh():
   sex = request.args.get("sex")
   return {
         "availableWasherCnt":get_available_washer_count(sex),
         "availableDryerCnt":get_available_dryer_count(sex),
         "usingWasherCnt": get_using_washer_count(sex),
         "usingDryerCnt": get_using_dryer_count(sex),
         "washerMinimumRemainTime":get_washer_minimum_remain_time(sex),
         "dryerMinimumRemainTime":get_dryer_minimum_remain_time(sex),
         "notGoodWasherCnt":find_washer_state_count(sex, "not good"),
         "notGoodDryerCnt":find_dryer_state_count(sex, "not good"),
         "allDryer":get_all_dryer(sex),
         "allWasher":get_all_washer(sex)
      }

@app.route('/washers', methods=['POST'])
def update_washer_user() :
   form = request.form
   update_washer({"id":int(form["id"]),"name":form["name"],"roomNum":int(form["roomNum"]), "remain":int(form["remain"])})
   return jsonify(True)

@app.route('/dryers', methods=['POST'])
def update_dryer_user() :
   form = request.form
   update_dryer({"id":int(form["id"]),"name":form["name"],"roomNum":int(form["roomNum"]), "remain":int(form["remain"])})
   return jsonify(True)

@app.route('/washers', methods=['PATCH'])
def update_washer_state() :
   form = request.form
   update_washer_status({"id":int(form["id"]), "state":form["state"]})
   return jsonify(True)

@app.route('/dryers', methods=['PATCH'])
def update_dryer_state() :
   form = request.form
   update_dryer_status({"id":int(form["id"]), "state":form["state"]})
   return jsonify(True)

if __name__ == '__main__':
   app.run('0.0.0.0', port=5001, debug=True)