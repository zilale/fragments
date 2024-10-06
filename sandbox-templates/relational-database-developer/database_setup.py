import os
from sqlalchemy import create_engine, Column, Integer, String, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Retrieve database URLs from environment variables
POSTGRES_URL = os.getenv('POSTGRES_URL', 'postgresql://user:password@postgres:5432/mydatabase')
MYSQL_URL = os.getenv('MYSQL_URL', 'mysql+mysqlconnector://user:password@mysql:3306/mydatabase')

Base = declarative_base()
metadata = MetaData()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String)

def setup_database(engine_url):
    engine = create_engine(engine_url)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    # Add initial data or perform migrations
    session.add(User(name='Alice'))
    session.commit()
    session.close()
    print(f"Database setup completed with engine {engine_url}")

if __name__ == "__main__":
    # Choose which database to set up based on available environment variables
    if os.getenv('POSTGRES_URL'):
        setup_database(POSTGRES_URL)
    elif os.getenv('MYSQL_URL'):
        setup_database(MYSQL_URL)
    else:
        print("No database URL provided. Please set POSTGRES_URL or MYSQL_URL in your environment variables.")