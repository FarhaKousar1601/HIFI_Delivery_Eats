from flask_login import UserMixin
from sqlalchemy import func, event, text
from app import db
from datetime import datetime

# Define an abstract base model with our ID generator
class BaseModel(db.Model):
    __abstract__ = True
    PREFIX = None  # each child model must set this

    @classmethod
    def generate_id(cls, connection):
        """
        Generates a new primary key for the model.
        It queries the table for the last inserted id, extracts the numeric part,
        increments it and returns a new id string.
        """
        # Get the name of the primary key column.
        pk_field = list(cls.__mapper__.primary_key)[0].name
        prefix = cls.PREFIX
        query = text(f"SELECT {pk_field} FROM {cls.__tablename__} ORDER BY {pk_field} DESC LIMIT 1")
        result = connection.execute(query)
        last_id = result.scalar()
        if last_id:
            numeric_part = int(last_id[len(prefix):])
            new_numeric = numeric_part + 1
        else:
            new_numeric = 1
        return f"{prefix}{new_numeric:03d}"

def set_primary_key(mapper, connection, target):
    """
    Event listener that automatically sets the primary key
    if it is not already provided.
    """
    pk_field = list(target.__mapper__.primary_key)[0].name
    if not getattr(target, pk_field):
        new_id = target.__class__.generate_id(connection)
        setattr(target, pk_field, new_id)

# -----------------------------
# Model definitions follow below
# -----------------------------

# Admin Model
class Admin(UserMixin, BaseModel):
    __tablename__ = 'admin'
    PREFIX = 'A'
    admin_id = db.Column(db.String(10), primary_key=True)
    username = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.Integer, unique=True, nullable=False)

    def __repr__(self):
        return f'<Admin {self.username}>'

    def get_id(self):
        return f"admin:{self.admin_id}"

# Attach event listener
event.listen(Admin, 'before_insert', set_primary_key)

# Customer Model
class Customer(UserMixin, BaseModel):
    __tablename__ = 'customer'
    PREFIX = 'U'
    customer_id = db.Column(db.String(10), primary_key=True)
    username = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    phone = db.Column(db.Integer, unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    
    addresses = db.relationship("Address", back_populates="customer", lazy=True)
    orders = db.relationship("Order", back_populates="customer", foreign_keys="Order.customer_id")
    cart_items = db.relationship("Cart", back_populates="customer")

    def __repr__(self):
        return f'<Customer {self.username}>'
    
    def get_id(self):
        return f"customer:{self.customer_id}"

event.listen(Customer, 'before_insert', set_primary_key)

# Address Model
class Address(BaseModel):
    __tablename__ = 'address'
    PREFIX = 'ADD'
    address_id = db.Column(db.String(10), primary_key=True)
    customer_id = db.Column(db.String(10), db.ForeignKey('customer.customer_id'), nullable=False)
    address_line = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(50), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    zip_code = db.Column(db.String(20), nullable=False)
    is_preferred = db.Column(db.Boolean, default=False)

    customer = db.relationship("Customer", back_populates="addresses")

    def __repr__(self):
        return f'<Address {self.address_line}>'

event.listen(Address, 'before_insert', set_primary_key)

# DeliveryAgent Model
class DeliveryAgent(UserMixin, BaseModel):
    __tablename__ = 'delivery_agent'
    PREFIX = 'DA'
    delivery_agent_id = db.Column(db.String(10), primary_key=True)
    username = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    phone = db.Column(db.Integer, unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    image = db.Column(db.String(255), nullable=True, server_default='')
    bio = db.Column(db.Text, nullable=True, server_default='')
    delivery_area = db.Column(db.String(100), nullable=False)
    available_slots = db.Column(db.Boolean, nullable=False, default=True)
    id_proof = db.Column(db.String(12), nullable=False, server_default='')
    is_approved = db.Column(db.Boolean, nullable=False, server_default='0')
    is_active = db.Column(db.Boolean, nullable=False, server_default='1')

    earnings = db.relationship("Earnings", back_populates="delivery_agent")
    delivery_feedbacks = db.relationship("DeliveryFeedback", back_populates="delivery_agent")
    deliveries = db.relationship("Order", back_populates="delivery_agent", foreign_keys="Order.delivery_agent_id")

    def __repr__(self):
        return f'<DeliveryAgent {self.username}>'

    def get_id(self):
        return f"delivery:{self.delivery_agent_id}"

event.listen(DeliveryAgent, 'before_insert', set_primary_key)

# Earnings Model
class Earnings(BaseModel):
    __tablename__ = 'earnings'
    PREFIX = 'E'
    earnings_id = db.Column(db.String(10), primary_key=True)
    delivery_agent_id = db.Column(db.String(10), db.ForeignKey('delivery_agent.delivery_agent_id'), nullable=False)
    base_pay = db.Column(db.Float, nullable=False, default=0.0)
    bonus = db.Column(db.Float, nullable=False, default=0.0)
    trips_count = db.Column(db.Integer, nullable=False, default=0)
    earned_at = db.Column(db.DateTime, default=func.now)

    delivery_agent = db.relationship("DeliveryAgent", back_populates="earnings")

    def __repr__(self):
        return f'<Earnings {self.delivery_agent_id} - {self.earned_at}>'

event.listen(Earnings, 'before_insert', set_primary_key)

# DeliveryFeedback Model
class DeliveryFeedback(BaseModel):
    __tablename__ = 'delivery_feedback'
    PREFIX = 'DF'
    delivery_feedback_id = db.Column(db.String(10), primary_key=True)
    order_id = db.Column(db.String(10), db.ForeignKey('orders.order_id'), nullable=False)
    delivery_agent_id = db.Column(db.String(10), db.ForeignKey('delivery_agent.delivery_agent_id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    feedback = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=func.now)

    order = db.relationship("Order", back_populates="delivery_feedbacks")
    delivery_agent = db.relationship("DeliveryAgent", back_populates="delivery_feedbacks")

    def __repr__(self):
        return f'<DeliveryFeedback Order:{self.order_id} Agent:{self.delivery_agent_id} Rating:{self.rating}>'

event.listen(DeliveryFeedback, 'before_insert', set_primary_key)

# Category Model
class Category(BaseModel):
    __tablename__ = "categories"
    PREFIX = 'IC'
    category_id = db.Column(db.String(10), primary_key=True)
    name = db.Column(db.String(255), nullable=False)

    menu_items = db.relationship("MenuItem", back_populates="category")

event.listen(Category, 'before_insert', set_primary_key)

# Subcategory Model
class Subcategory(BaseModel):
    __tablename__ = "subcategories"
    PREFIX = 'ISC'
    subcategory_id = db.Column(db.String(10), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    category_id = db.Column(db.String(10), db.ForeignKey("categories.category_id", ondelete="CASCADE"), nullable=False)

    menu_items = db.relationship("MenuItem", back_populates="subcategory")

event.listen(Subcategory, 'before_insert', set_primary_key)

# MenuItem Model
class MenuItem(BaseModel):
    __tablename__ = "menu_items"
    PREFIX = 'MI'
    menu_item_id = db.Column(db.String(10), primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.DECIMAL(10, 2), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    category_id = db.Column(db.String(10), db.ForeignKey("categories.category_id", ondelete="CASCADE"), nullable=False)
    subcategory_id = db.Column(db.String(10), db.ForeignKey("subcategories.subcategory_id", ondelete="CASCADE"), nullable=False)
    nutrient_value = db.Column(db.String(255), nullable=False)
    calorie_count = db.Column(db.Integer, nullable=False)
    is_best_seller = db.Column(db.Boolean, default=False)
    is_out_of_stock = db.Column(db.Boolean, default=False)
    discount_percentage = db.Column(db.DECIMAL(5, 2), nullable=True)
    stock_available = db.Column(db.Integer, default=100)
    scheduled_update_time = db.Column(db.DateTime, nullable=True, default=datetime.utcnow)
    pending_update = db.Column(db.Text, nullable=True)  # JSON string for pending changes

    category = db.relationship("Category", back_populates="menu_items")
    subcategory = db.relationship("Subcategory", back_populates="menu_items")
    order_items = db.relationship("OrderItem", back_populates="menu_item")
    cart_items = db.relationship("Cart", back_populates="menu_item")

    def __repr__(self):
        return f'<MenuItem {self.name}, Price: {self.price}>'

event.listen(MenuItem, 'before_insert', set_primary_key)

# Order Model
class Order(BaseModel):
    __tablename__ = "orders"
    PREFIX = 'O'
    order_id = db.Column(db.String(10), primary_key=True)
    customer_id = db.Column(db.String(10), db.ForeignKey("customer.customer_id", ondelete="CASCADE"), nullable=False)
    delivery_agent_id = db.Column(db.String(10), db.ForeignKey("delivery_agent.delivery_agent_id", ondelete="SET NULL"), nullable=True)
    delivery_status = db.Column(db.Enum("Pending", "Preparing","Accepted","Picked Up","Out for Delivery", "Delivered", "Cancelled","Refunded","Declined", name="order_status"), nullable=False, default="Pending")
    total_price = db.Column(db.DECIMAL(10, 2), nullable=False)
    delivery_location = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    delivered_at = db.Column(db.DateTime, nullable=True)
    order_feedback = db.Column(db.Integer, nullable=True)

    customer = db.relationship("Customer", back_populates="orders", foreign_keys=[customer_id])
    delivery_agent = db.relationship("DeliveryAgent", back_populates="deliveries")
    order_items = db.relationship("OrderItem", back_populates="order")
    delivery_feedbacks = db.relationship("DeliveryFeedback", back_populates="order")

    def __repr__(self):
        return f'<Order {self.order_id}, Status: {self.status}>'

event.listen(Order, 'before_insert', set_primary_key)

# OrderItem Model
class OrderItem(BaseModel):
    __tablename__ = "order_item"
    PREFIX = 'OI'
    order_item_id = db.Column(db.String(10), primary_key=True)
    order_id = db.Column(db.String(10), db.ForeignKey("orders.order_id", ondelete="CASCADE"), nullable=False)
    menu_item_id = db.Column(db.String(10), db.ForeignKey("menu_items.menu_item_id", ondelete="CASCADE"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.DECIMAL(10, 2), nullable=False)

    order = db.relationship("Order", back_populates="order_items")
    menu_item = db.relationship("MenuItem", back_populates="order_items")

    def __repr__(self):
        return f'<OrderItem {self.order_item_id}, Order: {self.order_id}, Item: {self.menu_item_id}>'

event.listen(OrderItem, 'before_insert', set_primary_key)

# Cart Model
class Cart(BaseModel):
    __tablename__ = "cart"
    PREFIX = 'C'
    cart_id = db.Column(db.String(10), primary_key=True)
    customer_id = db.Column(db.String(10), db.ForeignKey("customer.customer_id", ondelete="CASCADE"), nullable=False)
    menu_item_id = db.Column(db.String(10), db.ForeignKey("menu_items.menu_item_id", ondelete="CASCADE"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    customer = db.relationship("Customer", back_populates="cart_items")
    menu_item = db.relationship("MenuItem", back_populates="cart_items")

event.listen(Cart, 'before_insert', set_primary_key)
