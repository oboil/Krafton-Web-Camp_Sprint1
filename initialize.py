from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
import os
load_dotenv()

# MongoDB 연결
uri = os.getenv('MONGODB_URI')
client = MongoClient(uri, 27017) 
db = client.project

washers = []
dryer = []
for i in range(1,6):
    washers.append({
        "_id":i,
        "sex":"남자",
        "name":"",
        "endTime":datetime.now(),
        "roomNum":0,
        "state":"good"
    })
    dryer.append({
        "_id":i,
        "sex":"남자",
        "name":"",
        "endTime":datetime.now(),
        "roomNum":0,
        "state":"good"
    })
for i in range(6,8):
    washers.append({
        "_id":i,
        "sex":"여자",
        "name":"",
        "endTime":datetime.now(),
        "roomNum":0,
        "state":"good"
    })
    dryer.append({
        "_id":i,
        "sex":"여자",
        "name":"",
        "endTime":datetime.now(),
        "roomNum":0,
        "state":"good"
    })

db.washer.drop()
db.washer.insert_many(washers)

db.dryer.drop()
db.dryer.insert_many(dryer)