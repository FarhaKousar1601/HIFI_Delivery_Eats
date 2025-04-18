from flask import Flask, flash, redirect, request, url_for
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_mail import Mail
import os
from sqlalchemy import MetaData,func
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone
import json

load_dotenv()

metadata = MetaData(
    naming_convention={
    "ix": 'ix_%(column_0_label)s',
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
    }
)

db=SQLAlchemy(metadata=metadata)

def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static', static_url_path='/')
    
    # set up file upload folder
    app.config['UPLOAD_FOLDER'] = 'static/uploads/'
    
    # change databse what we use
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
    
    app.secret_key = os.getenv('SECRET_KEY')
    
    db.init_app(app)
    migrate = Migrate(app, db)
    bcrypt = Bcrypt(app) # for hasing the password
    
    # login manager
    login_manager = LoginManager(app)
    login_manager.init_app(app)
    
    # models
    from models import Customer, Admin, DeliveryAgent,MenuItem, Category, Subcategory
    @login_manager.user_loader
    def load_user(user_id):
        try:
            user_type, id_str = user_id.split(":")
        except Exception as e:
            # Return None if the id is not in the expected format
            return None

        if user_type == "customer":
            return Customer.query.get(id_str)
        elif user_type == "admin":
            return Admin.query.get(id_str)
        elif user_type == "delivery":
            return DeliveryAgent.query.get(id_str)
        return None


    
    @login_manager.unauthorized_handler
    def unauthorized_callback():
        if '/admin' in request.path or '/delivery-agent' in request.path:
            flash('You are not authorized to access this page.', 'danger')
            return redirect(url_for('employee_login'))
        else:
            return redirect('/login')
    
    # mail
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
    app.config['MAIL_PORT'] = os.getenv('MAIL_PORT')
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_APP_PASSWORD')
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USE_SSL'] = False
    mail = Mail(app)
    
    # routes 
    from routes.admin_routes import admin_routes
    from routes.delivery_agent_routes import delivery_agent_routes
    from routes.customer_routes import customer_routes
    from routes.auth_routes import register_routes
    
    register_routes(app, db, bcrypt, mail)
    admin_routes(app, db)
    delivery_agent_routes(app, db)
    customer_routes(app, db)
    
    # Function to apply scheduled updates
    def apply_scheduled_updates():
        with app.app_context():
            try:
                now = datetime.now(timezone.utc)
                print(f"Checking updates at {now} UTC")

                pending_items = db.session.query(MenuItem).filter(
                    MenuItem.scheduled_update_time <= now,
                    MenuItem.pending_update.isnot(None)
                ).all()
                print(f"Found {len(pending_items)} items to update")

                if not pending_items:
                    all_pending = db.session.query(MenuItem).filter(MenuItem.pending_update.isnot(None)).all()
                    print(f"All items with pending updates: {len(all_pending)}")
                    for item in all_pending:
                        print(f"Excluded item {item.menu_item_id}: scheduled_update_time={item.scheduled_update_time}")

                for item in pending_items:
                    updates = json.loads(item.pending_update)
                    print(f"Updating item {item.menu_item_id} with {updates}")
                    for key, value in updates.items():
                        if key == "price":
                            item.price = float(value)
                        elif key == "stock_available":
                            item.stock_available = int(value)
                            item.is_out_of_stock = int(value) == 0
                        elif key == "discount_percentage":
                            item.discount_percentage = float(value)
                        elif key == "is_best_seller":
                            item.is_best_seller = bool(value)
                        elif key == "name":
                            item.name = value
                        elif key == "description":
                            item.description = value
                        elif key == "category_name":
                            category = db.session.query(Category).filter(func.lower(Category.name) == value.lower()).first()
                            if category:
                                item.category_id = category.category_id
                        elif key == "subcategory_name":
                            subcategory = db.session.query(Subcategory).filter(func.lower(Subcategory.name) == value.lower()).first()
                            if subcategory:
                                item.subcategory_id = subcategory.subcategory_id
                    item.pending_update = None
                    item.scheduled_update_time = None

                db.session.commit()
                print(f"Applied scheduled updates to {len(pending_items)} items")

            except Exception as e:
                db.session.rollback()
                print(f"Error applying scheduled updates: {e}")

    # Initialize and start the scheduler
    scheduler = BackgroundScheduler()
    scheduler.add_job(apply_scheduled_updates, 'interval', minutes=1)
    scheduler.start()

    # Ensure scheduler shuts down when app exits
    import atexit
    atexit.register(lambda: scheduler.shutdown())
    
    return app