from app.database import Base, engine, SessionLocal
from app.core.seed import seed_default_admin, seed_default_categories


def reset():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Seeding default admin and categories...")
    with SessionLocal() as db:
        seed_default_admin(db)
        seed_default_categories(db)
    print("DB reset complete")


if __name__ == '__main__':
    reset()
