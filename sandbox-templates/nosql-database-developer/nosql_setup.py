import os
from pymongo import MongoClient

def setup_mongodb(uri):
    client = MongoClient(uri)
    db = client['mydatabase']
    users = db['users']
    # Create indexes or perform initial data setup
    users.create_index('name')
    users.insert_one({'name': 'Alice'})
    print("NoSQL database setup completed.")

if __name__ == "__main__":
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://user:password@mongodb:27017/mydatabase')
    if MONGODB_URI:
        setup_mongodb(MONGODB_URI)
    else:
        print("No MongoDB URI provided. Please set MONGODB_URI in your environment variables.")