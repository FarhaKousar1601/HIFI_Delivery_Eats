import base64
import datetime
import io
from flask import flash, jsonify, redirect, render_template, request, redirect, url_for
from flask_login import current_user, login_required
from matplotlib import pyplot as plt
import pandas as pd
from sqlalchemy import desc, func, asc
import seaborn as sns
import matplotlib.dates as mdates
import plotly.express as px
from datetime import datetime, timedelta, timezone
import os
import json

from models import Address, MenuItem, Category, Subcategory, Customer, DeliveryAgent, Order, OrderItem
from routes.insight_utils import (
    calculate_average_delivery_time,
    calculate_delivery_partner_performance,
    calculate_on_time_order_percentage,
    calculate_return_refund_statistics,
    calculate_revenue_per_delivery,
    generate_Customer_Demographics_Distribution,
    generate_agent_rating_chart,
    generate_customer_feedback_chart,
    generate_line_chart,
    generate_monthly_retention_chart,
    generate_Effectiveness_of_Promotions
)


def admin_routes(app, db):
    @app.route('/admin')
    def admin():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))
        
        # Aggregated order data by date for sales chart
        orders = db.session.query(
            func.date(Order.created_at).label("order_date"),
            func.sum(Order.total_price).label("total_sales")
        ).group_by(func.date(Order.created_at))\
         .order_by(func.date(Order.created_at))\
         .all()
        
        # Total orders count using proper primary key
        total_orders = db.session.query(func.count(Order.order_id)).scalar()
        
        # Total users count (assuming customers represent users)
        total_users = db.session.query(func.count(Customer.customer_id)).scalar()
        
        # Overall total sales from all orders
        overall_total_sales = db.session.query(func.coalesce(func.sum(Order.total_price), 0)).scalar()
        
        # Total delivery partners count using proper primary key
        delivery_partners = db.session.query(func.count(DeliveryAgent.delivery_agent_id)).scalar()
        
        # Query recent orders (limit to last 10 orders)
        recent_orders = Order.query.order_by(desc(Order.created_at)).limit(10).all()

        # Prepare sales chart
        if orders:
            # Convert query result to DataFrame
            df = pd.DataFrame(orders, columns=['order_date', 'total_sales'])
            df['order_date'] = pd.to_datetime(df['order_date'])
            
            # Create Plotly line chart with markers
            fig = px.line(df, x='order_date', y='total_sales', markers=True,
                          title="📊 Order Trend Over Time",
                          labels={'order_date': 'Date', 'total_sales': 'Total Sales (₹)'})
            fig.update_layout(
                hovermode="x unified",
                template="plotly_white",
                height=400,
                xaxis=dict(
                    rangeselector=dict(
                        buttons=[
                            dict(count=7, label="1w", step="day", stepmode="backward"),
                            dict(count=1, label="1m", step="month", stepmode="backward"),
                            dict(count=6, label="6m", step="month", stepmode="backward"),
                            dict(step="all")
                        ]
                    ),
                    rangeslider=dict(visible=True),
                    type="date"
                )
            )
            chart_html = fig.to_html(full_html=False)
            message = ""
        else:
            chart_html = None
            message = "No sales data available."

        return render_template('admin/home.html',
                               chart_html=chart_html,
                               message=message,
                               total_orders=total_orders,
                               total_users=total_users,
                               overall_total_sales=overall_total_sales,
                               delivery_partners=delivery_partners,
                               recent_orders=recent_orders)

    
    @app.route('/admin/delivery_partner')
    @login_required
    def delivery_partner():
        pending_agents = DeliveryAgent.query.filter_by(is_approved=False).all()
        accepted_agents = DeliveryAgent.query.filter_by(is_approved=True).all()
        return render_template(
            'admin/delivery_partner.html',
            pending_agents=pending_agents,
            accepted_agents=accepted_agents
        )
    
    @app.route('/admin/accept/<string:id>', methods=['POST'])
    def accept_agent(id):
        agent = DeliveryAgent.query.get(id)
        if not agent:
            flash("Agent not found")
            return jsonify({"message": "Agent not found"}), 404
        agent.is_approved = True  # Set approval status
        db.session.commit()
        
        flash(f"Agent {agent.username} accepted!")
        return jsonify({"message": f"Agent {agent.username} accepted!"})
    

    @app.route('/admin/reject/<string:id>', methods=['POST'])
    def reject_agent(id):
        agent = DeliveryAgent.query.get(id)
        if not agent:
            flash("Agent not found")
            return jsonify({"message": "Agent not found"}), 404

        # Delete the agent from the database
        db.session.delete(agent)
        db.session.commit()
        
        flash(f"Agent {agent.username} has been rejected and removed from the database!")
        return jsonify({"message": f"Agent {agent.username} has been rejected and removed from the database!"})
    
    @app.route('/admin/deactivate/<string:id>', methods=['POST'])
    def deactivate_agent(id):
        agent = DeliveryAgent.query.get(id)
        if not agent:
            flash("Agent not found")
            return jsonify({"message": "Agent not found"}), 404
        agent.is_active = False
        db.session.commit()
        flash(f"Agent {agent.username} has been deactivated.")
        return jsonify({"message": f"Agent {agent.username} has been deactivated."})

    @app.route('/admin/activate/<string:id>', methods=['POST'])
    def activate_agent(id):
        agent = DeliveryAgent.query.get(id)
        if not agent:
            flash("Agent not found")
            return jsonify({"message": "Agent not found"}), 404
        agent.is_active = True
        db.session.commit()
        flash(f"Agent {agent.username} has been activated.")
        return jsonify({"message": f"Agent {agent.username} has been activated."})
    
    @app.route('/admin/insights')
    @login_required
    def insights():
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))
        
        # Fetching charts (demo and database reflected)
        charts = []
        Customer_Demographics_Distribution = generate_Customer_Demographics_Distribution()           # Demo data chart
        Effectiveness_of_Promotions = generate_Effectiveness_of_Promotions()              # Demo data chart
        line_chart_html = generate_line_chart()       # Data from the database
        delivery_rating_bar = generate_agent_rating_chart()
        monthly_retention_chart = generate_monthly_retention_chart()
        customer_feedback_chart = generate_customer_feedback_chart()

        charts.append(customer_feedback_chart)
        charts.append(line_chart_html)
        charts.append(delivery_rating_bar)
        charts.append(monthly_retention_chart)
        charts.append(Customer_Demographics_Distribution)
        charts.append(Effectiveness_of_Promotions)

        # Compute analysis statistics with optimized queries:
        avg_delivery_time = calculate_average_delivery_time() 
        delivery_partner_performance = calculate_delivery_partner_performance()
        return_refund_percentage = calculate_return_refund_statistics()
        on_time_order_percentage = calculate_on_time_order_percentage()
        revenue_per_delivery = calculate_revenue_per_delivery()
        
        return render_template(
            'admin/insights.html',
            charts=charts,
            avg_delivery_time=avg_delivery_time,
            delivery_partner_performance=delivery_partner_performance,
            return_refund_percentage=return_refund_percentage,
            on_time_order_percentage=on_time_order_percentage,
            revenue_per_delivery=revenue_per_delivery
        )
    
    
    @app.route('/admin2')
    def admin2():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))
        
        return render_template('admin/admin2.html')
    
    @app.route('/admin2/menu')
    def admin2_menu():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))
        
        return render_template('admin/menu.html')
    
    # Just to show no add to cart option available
    @app.route('/admin2/show_menu')
    def admin2_show_menu():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))
        
        return render_template('admin/show_menu.html')
    
    @app.route('/admin2/dashboard')
    def admin2_dashboard():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))
        # Fetching charts (demo and database reflected)
        selected_theme = request.cookies.get('selected-theme', 'light')
        dark_mode = selected_theme.lower() == 'dark'
        
        charts = []
        Customer_Demographics_Distribution = generate_Customer_Demographics_Distribution(dark_mode)           # Demo data chart
        Effectiveness_of_Promotions = generate_Effectiveness_of_Promotions(dark_mode)              # Demo data chart
        line_chart_html = generate_line_chart(dark_mode)       # Data from the database
        delivery_rating_bar = generate_agent_rating_chart(dark_mode)
        monthly_retention_chart = generate_monthly_retention_chart(dark_mode)
        customer_feedback_chart = generate_customer_feedback_chart(dark_mode)

        charts.append(Customer_Demographics_Distribution)
        charts.append(customer_feedback_chart)
        charts.append(line_chart_html)
        charts.append(delivery_rating_bar)
        charts.append(monthly_retention_chart)
        
        charts.append(Effectiveness_of_Promotions)

        # Compute analysis statistics with optimized queries:
        avg_delivery_time = calculate_average_delivery_time() 
        delivery_partner_performance = calculate_delivery_partner_performance()
        return_refund_percentage = calculate_return_refund_statistics()
        on_time_order_percentage = calculate_on_time_order_percentage()
        revenue_per_delivery = calculate_revenue_per_delivery()
        delivered_orders = db.session.query(func.count(Order.order_id)).filter(Order.delivery_status == "Delivered").scalar()
        total_revenue = db.session.query(func.sum(Order.total_price)).scalar() or 0.0
        total_orders = db.session.query(func.count(Order.order_id)).scalar()
            
        
        
        
        # DELIVERY-PARTNERS from dashboard
        pending_agents = DeliveryAgent.query.filter_by(is_approved=False).all()
        accepted_agents = DeliveryAgent.query.filter_by(is_approved=True).all()
        
        recent_orders = Order.query.filter(Order.delivery_status == "Delivered")\
            .order_by(desc(Order.created_at)).limit(10).all()

        recent_orders_list = []
        for order in recent_orders:
            # Build order items list
            order_items_list = []
            for item in order.order_items:
                order_items_list.append({
                    'menu_item_name': item.menu_item.name,
                    'quantity': item.quantity
                })
            
            # Calculate average delivery feedback rating, if available
            if order.delivery_feedbacks:
                avg_rating = sum(feedback.rating for feedback in order.delivery_feedbacks) / len(order.delivery_feedbacks)
            else:
                avg_rating = None
            
            recent_orders_list.append({
                'order_id': order.order_id,
                'customer_name': order.customer.username if order.customer else 'N/A',
                'status': order.delivery_status,
                'total_price': float(order.total_price),
                'created_at': order.created_at.isoformat(),
                'delivery_agent_id': order.delivery_agent_id or 'Not Assigned',
                'order_items': order_items_list,
                'avg_feedback': avg_rating  # Average rating from delivery feedbacks, if any
            })

        
        return render_template(
            'admin/dashboard.html',
            charts=charts,
            avg_delivery_time=avg_delivery_time,
            delivery_partner_performance=delivery_partner_performance,
            return_refund_percentage=return_refund_percentage,
            on_time_order_percentage=on_time_order_percentage,
            revenue_per_delivery=revenue_per_delivery,
            pending_agents=pending_agents,
            accepted_agents=accepted_agents,
            recent_orders=recent_orders_list,
            delivered_orders=delivered_orders,
            total_revenue=total_revenue,
            total_orders=total_orders
        )
        
    
    # For renderMenuItems function in menu.js
    @app.route('/get_items', methods=['GET'])
    def get_items():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))
        try:
            # Query MenuItem with joins to Category and Subcategory
            items = (
                db.session.query(MenuItem, Category, Subcategory)
                .join(Category, MenuItem.category_id == Category.category_id)
                .join(Subcategory, MenuItem.subcategory_id == Subcategory.subcategory_id)
                .all()
            )

            # Format the results into a list of dictionaries
            items_list = [
                {
                    "menu_item_id": item.MenuItem.menu_item_id,
                    "name": item.MenuItem.name,
                    "description": item.MenuItem.description,
                    "price": float(item.MenuItem.price),  # Convert DECIMAL to float for JSON
                    "category_name": item.Category.name,
                    "subcategory_name": item.Subcategory.name,
                    "nutrient_value": item.MenuItem.nutrient_value,
                    "calorie_count": item.MenuItem.calorie_count,
                    "discount_percentage": float(item.MenuItem.discount_percentage) if item.MenuItem.discount_percentage else 0.0,
                    "image_url": item.MenuItem.image_url,
                    "is_best_seller": item.MenuItem.is_best_seller,
                    "is_out_of_stock": item.MenuItem.is_out_of_stock,
                    "stock_available": item.MenuItem.stock_available,
                    "scheduled_update_time": (
                        item.MenuItem.scheduled_update_time.isoformat()
                        if item.MenuItem.scheduled_update_time else None
                    ),  # Handle None explicitly
                    "pending_update": item.MenuItem.pending_update  # Include pending_update field
                }
                for item in items
            ]

            # Return JSON response
            return jsonify(items_list), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
        
    # for showEditPopup, showDeleteConfirmation funtion in menu.js
    @app.route('/get_item_by_id/<string:menu_item_id>', methods=['GET'])
    def get_item_by_id(menu_item_id):
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))
        try:
            # Query MenuItem with joins to Category and Subcategory
            item = (
                db.session.query(
                    MenuItem.menu_item_id,
                    MenuItem.name,
                    MenuItem.description,
                    MenuItem.price,
                    MenuItem.nutrient_value,
                    MenuItem.calorie_count,
                    MenuItem.discount_percentage,
                    MenuItem.image_url,
                    MenuItem.is_best_seller,
                    MenuItem.stock_available,
                    MenuItem.scheduled_update_time,
                    Category.name.label("category_name"),
                    Subcategory.name.label("subcategory_name")
                )
                .join(Category, MenuItem.category_id == Category.category_id, isouter=True)  # Left join for optional category
                .join(Subcategory, MenuItem.subcategory_id == Subcategory.subcategory_id, isouter=True)  # Left join for optional subcategory
                .filter(MenuItem.menu_item_id == menu_item_id)
                .first()
            )

            if not item:
                return jsonify({"error": "Item not found"}), 404  # Return 404 if item doesn't exist

            # Format the response data
            response_data = {
                "menu_item_id": item.menu_item_id,
                "name": item.name,
                "description": item.description,
                "price": float(item.price),  # Convert DECIMAL to float for JSON
                "category_name": item.category_name if item.category_name else "Uncategorized",
                "subcategory_name": item.subcategory_name if item.subcategory_name else "Uncategorized",
                "nutrient_value": item.nutrient_value,
                "calorie_count": item.calorie_count,
                "discount_percentage": float(item.discount_percentage or 0.0),
                "image_url": item.image_url,
                "is_best_seller": item.is_best_seller,
                "stock_available": item.stock_available,
                "scheduled_update_time": (
                    item.scheduled_update_time.isoformat() if item.scheduled_update_time else None
                )
            }

            return jsonify(response_data), 200

        except Exception as e:
            db.session.rollback()
            print("Error in get_item_by_id:", str(e))  # Debugging error
            return jsonify({"error": str(e)}), 500  # Return 500 for internal server errors
        
    # for showEditPopup function, when click on ok to update in menu.js
    @app.route('/update_item', methods=["POST"])
    def update_item():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))
        try:
            data = request.get_json()
            print("\n\n\nReceived Data for Update:", data, "\n\n\n")

            menu_item_id = data.get("menu_item_id")
            if not menu_item_id:
                return jsonify({"error": "Menu item ID not provided"}), 400

            scheduled_time = data.get("scheduled_update_time")
            scheduled_update_time = datetime.fromisoformat(scheduled_time) if scheduled_time else None

            menu_item = db.session.query(MenuItem).filter_by(menu_item_id=menu_item_id).first()
            if not menu_item:
                return jsonify({"error": "Menu item not found"}), 404

            if scheduled_update_time:
                pending_update = {
                    "name": data.get("name", menu_item.name),
                    "description": data.get("description", menu_item.description),
                    "price": float(data.get("price", menu_item.price)),
                    "category_name": data.get("category_name", menu_item.category.name),
                    "subcategory_name": data.get("subcategory_name", menu_item.subcategory.name),
                    "discount_percentage": float(data.get("discount_percentage", menu_item.discount_percentage or 0)),
                    "is_best_seller": data.get("is_best_seller", menu_item.is_best_seller),
                    "stock_available": int(data.get("stock_available", menu_item.stock_available))
                }
                menu_item.scheduled_update_time = scheduled_update_time
                menu_item.pending_update = json.dumps(pending_update)
            else:
                menu_item.name = data.get("name", menu_item.name)
                menu_item.description = data.get("description", menu_item.description)
                menu_item.price = data.get("price", menu_item.price)
                menu_item.discount_percentage = data.get("discount_percentage", menu_item.discount_percentage)
                menu_item.is_best_seller = data.get("is_best_seller", menu_item.is_best_seller)
                menu_item.stock_available = data.get("stock_available", menu_item.stock_available)
                menu_item.is_out_of_stock = int(data.get("stock_available", menu_item.stock_available)) == 0

                if "category_name" in data:
                    category = db.session.query(Category).filter(func.lower(Category.name) == data["category_name"].lower()).first()
                    if category:
                        menu_item.category_id = category.category_id

                if "subcategory_name" in data:
                    subcategory = db.session.query(Subcategory).filter(func.lower(Subcategory.name) == data["subcategory_name"].lower()).first()
                    if subcategory:
                        menu_item.subcategory_id = subcategory.subcategory_id

            db.session.commit()
            print("\n\nUpdated Successfully\n\n")
            return jsonify({"message": "Menu item updated successfully"}), 200

        except Exception as e:
            db.session.rollback()
            print("Error updating menu item:", str(e))
            return jsonify({'error': str(e)}), 500

    # for showDeleteConfirmation funtion, when click on ok to delete in menu.js
    @app.route("/delete_item", methods=["DELETE"])
    def delete_item():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))
        try:
            data = request.get_json()
            item_name = data.get("name")
            if not item_name:
                return jsonify({"error": "Item name not provided"}), 400

            item = db.session.query(MenuItem).filter_by(name=item_name).first()
            if not item:
                return jsonify({"error": f"Item '{item_name}' not found"}), 404

            db.session.delete(item)
            db.session.commit()
            return jsonify({"message": f"Item '{item_name}' deleted successfully!"}), 200

        except Exception as e:
            db.session.rollback()
            print("Error deleting menu item:", str(e))
            return jsonify({"error": str(e)}), 500
        
    # Add the menu item to the database
    @app.route('/add_item', methods=["POST"])
    def add_item():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))
        try:
            data = request.form  # Expect form data from the frontend
            print("\n\n\nReceived Data for Add:", dict(data), "\n\n\n")  # Debugging output

            # Handle scheduled update time (assuming input is in ISO format, e.g., "2025-03-28T10:00")
            scheduled_time = data.get("schedule-time")  # Match form field name from your HTML
            if scheduled_time and scheduled_time.strip():
                # Convert to UTC (assuming input is IST, offset by 5:30 hours)
                scheduled_dt = datetime.fromisoformat(scheduled_time)
                scheduled_utc = scheduled_dt - timedelta(hours=5, minutes=30)  # IST to UTC offset
                scheduled_update_time = scheduled_utc
                print(f"Converted {scheduled_time} IST to {scheduled_update_time} UTC")
            else:
                scheduled_update_time = None
                
            
            # Extract form data with defaults
            item_name = data.get("item_name")
            description = data.get("description")
            price = float(data.get("price"))
            category_name = data.get("category")
            subcategory_name = data.get("subcategory")
            discount = float(data.get("discount", 0))
            best_seller = data.get("best_seller", "no").lower() in ["yes", "true", "1"]
            stock_available = int(data.get("stock_available", 100))
            is_out_of_stock = stock_available == 0
            
            # Validate required fields
            if not all([item_name, description, price, category_name, subcategory_name]):
                return jsonify({"success": False, "message": "Missing required fields"}), 400

            # Handle image upload
            image_url = ""
            BASE_URL = "https://HiFiDeliveryEats.com/"  # Replace with your actual base URL
            if "image" in request.files:
                image = request.files["image"]
                if image.filename:
                    upload_folder = app.config.get("UPLOAD_FOLDER", "static/uploads")  # Default folder
                    os.makedirs(upload_folder, exist_ok=True)  # Ensure folder exists
                    image_path = os.path.join(upload_folder, image.filename)
                    image.save(image_path)
                    image_url = f"{BASE_URL}{image.filename}"

            # Fetch or create category
            category = db.session.query(Category).filter_by(name=category_name).first()
            if not category:
                return jsonify({"success": False, "message": f"Category '{category_name}' not found"}), 400

            # Fetch or create subcategory
            subcategory = db.session.query(Subcategory).filter_by(name=subcategory_name, category_id=category.category_id).first()
            if not subcategory:
                return jsonify({"success": False, "message": f"Subcategory '{subcategory_name}' not found"}), 400

            # Generate new menu_item_id (using your BaseModel's generate_id logic)
            latest_id = db.session.query(func.max(MenuItem.menu_item_id)).scalar() or "MI000"
            numeric_part = int(latest_id[2:]) + 1 if latest_id else 1
            menu_item_id = f"MI{numeric_part:03d}"

            # If scheduled, store as pending update
            if scheduled_update_time:
                pending_update = {
                    "name": item_name,
                    "description": description,
                    "price": price,
                    "category_name": category_name,
                    "subcategory_name": subcategory_name,
                    "discount_percentage": discount,
                    "is_best_seller": best_seller,
                    "stock_available": stock_available
                }
                new_item = MenuItem(
                    menu_item_id=menu_item_id,
                    name="Pending Item",  # Placeholder
                    description="Pending",
                    price=0.0,
                    image_url=image_url,
                    category_id=category.category_id,
                    subcategory_id=subcategory.subcategory_id,
                    nutrient_value="N/A",
                    calorie_count=0,
                    is_best_seller=False,
                    is_out_of_stock=True,
                    discount_percentage=0.0,
                    stock_available=0,
                    scheduled_update_time=scheduled_update_time,
                    pending_update=json.dumps(pending_update)
                )
            else:
                # Add item immediately
                new_item = MenuItem(
                    menu_item_id=menu_item_id,
                    name=item_name,
                    description=description,
                    price=price,
                    image_url=image_url,
                    category_id=category.category_id,
                    subcategory_id=subcategory.subcategory_id,
                    nutrient_value="N/A",
                    calorie_count=0,
                    is_best_seller=best_seller,
                    is_out_of_stock=is_out_of_stock,
                    discount_percentage=discount,
                    stock_available=stock_available
                )

            # Add and commit the new item
            db.session.add(new_item)
            db.session.commit()

            return jsonify({
                "success": True,
                "message": "Item added successfully",
                "menu_item_id": new_item.menu_item_id,
                "image_url": new_item.image_url
            }), 200

        except Exception as e:
            db.session.rollback()
            print("Error adding menu item:", str(e))  # Debugging output
            return jsonify({"success": False, "message": str(e)}), 500
        
    
    
    # FOR DASHBOARD
    @app.route('/api/admin/pending_orders', methods=['GET'])
    def get_pending_orders():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))

        try:
            # Fetch pending orders with customer details (replacing User with Customer)
            orders = (
                db.session.query(Order, Customer)
                .join(Customer, Order.customer_id == Customer.customer_id)
                .filter(Order.delivery_status == "Pending")
                .all()
            )

            orders_list = []
            for order, customer in orders:
                # Fetch order items
                order_items = (
                    db.session.query(OrderItem, MenuItem)
                    .join(MenuItem, OrderItem.menu_item_id == MenuItem.menu_item_id)
                    .filter(OrderItem.order_id == order.order_id)
                    .all()
                )
                items = [{
                    'itemId': item.OrderItem.menu_item_id,
                    'itemName': item.MenuItem.name,
                    'quantity': item.OrderItem.quantity,
                    'price': float(item.OrderItem.price),
                    'image': item.MenuItem.image_url
                } for item in order_items]

                # Parse delivery_location (assumes "street, city, state pincode" format)
                delivery_parts = order.delivery_location.split(', ') if order.delivery_location else ['', '', '']
                state_pin = delivery_parts[2].split(' ') if len(delivery_parts) > 2 else ['', '']

                orders_list.append({
                    'orderId': order.order_id,
                    'date': order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'items': items,
                    'total': float(order.total_price),
                    'name': customer.username,  # Using username since full_name isn't in Customer model
                    'phone': customer.phone,
                    'street': delivery_parts[0],
                    'city': delivery_parts[1] if len(delivery_parts) > 1 else '',
                    'state': state_pin[0] if state_pin else '',
                    'pincode': state_pin[1] if len(state_pin) > 1 else '',
                    'status': order.delivery_status  # Using delivery_status from Order model
                })

            return jsonify({'data': orders_list, 'ok': True}), 200

        except Exception as e:
            print(f"Error fetching pending orders: {e}")
            return jsonify({"error": str(e)}), 500


    @app.route('/api/admin/delivery_agents', methods=['GET'])
    def get_delivery_agents():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))

        try:
            agents = db.session.query(DeliveryAgent).all()
            agents_list = [{
                'name': agent.username,  # Using username since name isn't in DeliveryAgent model
                'status': 'available' if agent.is_active else 'busy',  # Mapping is_active to status
                'delivery_agent_id': agent.delivery_agent_id
            } for agent in agents]
            return jsonify({'data': agents_list, 'ok': True}), 200

        except Exception as e:
            print(f"Error fetching delivery agents: {e}")
            return jsonify({"error": str(e)}), 500


    @app.route('/api/admin/assign_order', methods=['POST'])
    def assign_order():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))

        data = request.get_json()
        order_id = data.get('order_id')
        delivery_agent_id = data.get('delivery_agent_id')

        try:
            order = db.session.query(Order).filter_by(order_id=order_id).first()
            if not order or order.delivery_status != "Pending":
                return jsonify({"error": "Order not found or not pending"}), 404

            agent = db.session.query(DeliveryAgent).filter_by(delivery_agent_id=delivery_agent_id).first()
            if not agent:
                return jsonify({"error": "Delivery agent not found"}), 404
            if not agent.is_active:  # Checking Boolean field instead of string
                return jsonify({"error": "Agent not available"}), 400

            order.delivery_agent_id = delivery_agent_id
            order.delivery_status = "Preparing"
            #agent.is_active = False  # Mark agent as busy

            db.session.commit()
            return jsonify({"message": f"Order {order_id} assigned to {agent.username}", "ok": True}), 200

        except Exception as e:
            db.session.rollback()
            print(f"Error assigning order: {e}")
            return jsonify({"error": str(e)}), 500


    @app.route('/api/admin/reject_order', methods=['POST'])
    def reject_order():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))

        data = request.get_json()
        order_id = data.get('order_id')

        try:
            order = db.session.query(Order).filter_by(order_id=order_id).first()
            if not order or order.delivery_status != "Pending":
                return jsonify({"error": "Order not found or not pending"}), 404

            order.delivery_status = "Cancelled"
            db.session.commit()
            return jsonify({"message": f"Order {order_id} rejected", "ok": True}), 200

        except Exception as e:
            db.session.rollback()
            print(f"Error rejecting order: {e}")
            return jsonify({"error": str(e)}), 500


    @app.route('/api/admin/summary', methods=['GET'])
    def get_summary():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))

        try:
            total_orders = db.session.query(func.count(Order.order_id)).scalar()
            total_revenue = db.session.query(func.sum(Order.total_price)).scalar() or 0.0
            cancelled_orders = db.session.query(func.count(Order.order_id)).filter(Order.delivery_status == "Cancelled").scalar()
            delivered_orders = db.session.query(func.count(Order.order_id)).filter(Order.delivery_status == "Delivered").scalar()
            summary = {
                "total_orders": total_orders,
                "total_revenue": float(total_revenue),  # Convert Decimal to float
                "cancelled_orders": cancelled_orders,
                "delivered_orders": delivered_orders
            }
            return jsonify({"data": summary, "ok": True}), 200

        except Exception as e:
            print(f"Error fetching summary: {e}")
            return jsonify({"error": str(e)}), 500


    @app.route('/api/admin/order_status_chart', methods=['GET'])
    def get_order_status_chart():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))

        try:
            status_counts = db.session.query(Order.delivery_status, func.count(Order.order_id)).group_by(Order.delivery_status).all()
            chart_data = {status: count for status, count in status_counts}
            # Ensure all statuses from Order.delivery_status Enum are included
            all_statuses = ["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled", "Refunded"]
            for status in all_statuses:
                if status not in chart_data:
                    chart_data[status] = 0
            return jsonify({"data": chart_data, "ok": True}), 200

        except Exception as e:
            print(f"Error fetching chart data: {e}")
            return jsonify({"error": str(e)}), 500


    @app.route('/api/admin/all_orders', methods=['GET'])
    def get_all_orders():
        print(current_user)
        if not current_user.is_authenticated:
            return redirect(url_for('employee_login'))

        try:
            # Pagination parameters
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            offset = (page - 1) * per_page

            # Sorting parameters
            sort_by = request.args.get('sort_by', 'order_id')  # Default sort by order_id
            sort_dir = request.args.get('sort_dir', 'asc')  # Default ascending
            sort_func = asc if sort_dir.lower() == 'asc' else desc

            # Valid sortable columns
            valid_columns = {
                'order_id': Order.order_id,
                'status': Order.delivery_status,
                'created_at': Order.created_at,
                'total_price': Order.total_price
            }
            sort_column = valid_columns.get(sort_by, Order.order_id)  # Fallback to order_id

            # Query orders with sorting and pagination
            total_orders = db.session.query(func.count(Order.order_id)).scalar()
            orders_query = (
                db.session.query(Order)
                .join(Customer, Order.customer_id == Customer.customer_id)
                .order_by(sort_func(sort_column))
                .limit(per_page)
                .offset(offset)
            )
            orders = orders_query.all()

            orders_list = [{
                'order_id': order.order_id,
                'customer_name': order.customer.username,  # Using username from Customer model
                'status': order.delivery_status,
                'total_price': float(order.total_price),
                'created_at': order.created_at.isoformat(),
                'delivery_agent_id': order.delivery_agent_id or 'Not Assigned'
            } for order in orders]

            return jsonify({
                'data': orders_list,
                'total': total_orders,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_orders + per_page - 1) // per_page,
                'ok': True
            }), 200

        except Exception as e:
            print(f"Error fetching all orders: {e}")
            return jsonify({"error": str(e)}), 500
        
