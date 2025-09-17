from pymongo import MongoClient
from datetime import datetime, timedelta, timezone
import pytz

from dotenv import load_dotenv
import os
load_dotenv()

uri = os.getenv('MONGODB_URI')
client = MongoClient(uri, 27017) 
db = client.project

KST = pytz.timezone("Asia/Seoul")
UTC = pytz.utc

def get_available_washer_count(sex):
    return db.washer.count_documents({"endTime":{"$lt":datetime.now(tz=UTC)}, "sex":sex, "state":{"$not":{"$eq":"not good"}}})

def get_available_dryer_count(sex):
    return db.dryer.count_documents({"endTime":{"$lt":datetime.now(tz=UTC)}, "sex":sex, "state":{"$not":{"$eq":"not good"}}})

def get_using_washer_count(sex):
    return db.washer.count_documents({"endTime":{"$gt":datetime.now(tz=UTC)},"sex":sex, "state":{"$not":{"$eq":"not good"}}})

def get_using_dryer_count(sex):
    return db.dryer.count_documents({"endTime":{"$gt":datetime.now(tz=UTC)},"sex":sex, "state":{"$not":{"$eq":"not good"}}})

def find_washer_state_count(sex, state):
    return db.washer.count_documents({"state":state, "sex":sex})

def find_dryer_state_count(sex, state):
    return db.dryer.count_documents({"state":state, "sex":sex})

def update_washer(form):
    end_time = datetime.now(tz=KST) + timedelta(hours=form["remain"]//60, minutes=form["remain"]%60)
    db.washer.update_one(
        {"_id": form["id"]},
        {
            "$set":{
                "name": form["name"], 
                "roomNum": form["roomNum"], 
                "endTime": end_time
        }})
    
def update_dryer(form):
    db.dryer.update_one(
        {"_id": form["id"]},
        {
            "$set":{
                "name": form["name"], 
                "roomNum": form["roomNum"], 
                "endTime": datetime.now(tz=UTC) + timedelta(hours=form["remain"]//60, minutes=form["remain"]%60)
        }})

def update_washer_status(form):
    db.washer.update_one({"_id":form["id"]},{"$set":{"state":form["state"]}})
    
def update_dryer_status(form):
    db.dryer.update_one({"_id":form["id"]},{"$set":{"state":form["state"]}})
    
def get_all_washer(sex):
    a = db.washer.find({"sex":sex}).to_list()
    now = datetime.now(tz=UTC)
    for i in range(0, len(a)):
        if a[i]["endTime"].replace(tzinfo=UTC) < now:
            a[i]["remain"] = 0
            print(a[i]["endTime"])
        else:
            remain_second = a[i]["endTime"].replace(tzinfo=UTC) - now
            a[i]["remain"] = remain_second.seconds//60
    return a

def get_all_dryer(sex):
    a = db.dryer.find({"sex":sex}).to_list()
    now = datetime.now(tz=UTC)
    for i in range(0, len(a)):
        if a[i]["endTime"].replace(tzinfo=UTC) < now:
            a[i]["remain"] = 0
        else:
            remain_second = a[i]["endTime"].replace(tzinfo=UTC) - now
            a[i]["remain"] = remain_second.seconds//60
    return a

def get_washer_minimum_remain_time(sex):
    now = datetime.now(tz=UTC)
    minimum_end_time = db.washer.find({"sex":sex}).sort({"endTime":1}).limit(1)[0]["endTime"]
    if(minimum_end_time.replace(tzinfo=UTC) < now):
        return 0
    remain = minimum_end_time.replace(tzinfo=UTC) - now
    return remain.seconds//60

def get_dryer_minimum_remain_time(sex):
    now = datetime.now(tz=UTC)
    print(now)
    minimum_end_time = db.dryer.find({"sex":sex}).sort({"endTime":1}).limit(1)[0]["endTime"]
    if(minimum_end_time.replace(tzinfo=UTC) < now):
        return 0
    remain = minimum_end_time.replace(tzinfo=UTC) - now
    return remain.seconds//60