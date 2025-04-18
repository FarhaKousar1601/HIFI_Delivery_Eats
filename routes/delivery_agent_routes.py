import datetime
import os
from flask import flash, jsonify, redirect, render_template, request, url_for
from flask_login import current_user, login_required
from sqlalchemy import func, or_
from sqlalchemy.orm import joinedload
from werkzeug.utils import secure_filename

from models import Address, Customer, DeliveryAgent, DeliveryFeedback, Earnings, Order, OrderItem

def delivery_agent_routes(app, db):
    @app.route('/delivery-agent')
    def delivery_agent():
        # Get the delivery agent using the current user's delivery_agent_id.
        agent = DeliveryAgent.query.get(current_user.delivery_agent_id)
        
        # Create a subquery that selects one address per customer.
        address_subquery = (
            db.session.query(
                Address.customer_id,
                func.min(Address.address_line).label("customer_address")
            )
            .group_by(Address.customer_id)
            .subquery()
        )

        pending_orders = (
            db.session.query(
                Order.order_id.label("order_id"),
                Customer.customer_id.label("customer_id"),
                Customer.username.label("customer_name"),
                Customer.phone.label("customer_phone"),
                address_subquery.c.customer_address,
                Order.delivery_status.label("order_status"),
                Order.total_price.label("order_total"),
                Order.delivery_location.label("delivery_location"),
                Order.created_at.label("order_date"),
            )
            .join(Customer, Order.customer_id == Customer.customer_id)
            .outerjoin(address_subquery, address_subquery.c.customer_id == Customer.customer_id)
            .filter(Order.delivery_agent_id == current_user.delivery_agent_id, Order.delivery_status == "Preparing")
            .all()
        )

        assigned_orders = (
            db.session.query(
                Order.order_id.label("order_id"),
                Customer.customer_id.label("customer_id"),
                Customer.username.label("customer_name"),
                Customer.phone.label("customer_phone"),
                address_subquery.c.customer_address,
                Order.delivery_status.label("order_status"),
                Order.total_price.label("order_total"),
                Order.delivery_location.label("delivery_location"),
                Order.created_at.label("order_date"),
            )
            .join(Customer, Order.customer_id == Customer.customer_id)
            .outerjoin(address_subquery, address_subquery.c.customer_id == Customer.customer_id)
            .filter(
                Order.delivery_agent_id == current_user.delivery_agent_id,
                Order.delivery_status == "Accepted"
            )
            .all()
        )

        completed_orders = (
            db.session.query(
                Order.order_id.label("order_id"),
                Customer.customer_id.label("customer_id"),
                Customer.username.label("customer_name"),
                Customer.phone.label("customer_phone"),
                address_subquery.c.customer_address.label("customer_address"),
                Order.delivery_status.label("order_status"),
                Order.total_price.label("order_total"),
                Order.delivery_location.label("delivery_location"),
                Order.created_at.label("order_date"),
            )
            .join(Customer, Order.customer_id == Customer.customer_id)
            .outerjoin(address_subquery, address_subquery.c.customer_id == Customer.customer_id)
            .filter(
                Order.delivery_agent_id == current_user.delivery_agent_id,
                Order.delivery_status == "Delivered"
            )
            .all()
        )
        
        # Define today's date.
        today = datetime.date.today()
        
        # Count today's deliveries using SQLAlchemy's or_ for multiple statuses.
        todays_deliveries_count = (
            db.session.query(Order)
            .filter(
                Order.delivery_agent_id == current_user.delivery_agent_id,
                func.date(Order.created_at) == today,
                or_(Order.delivery_status == "Delivered", Order.delivery_status == "Preparing", Order.delivery_status == "Accepted")
            )
            .count()
        )
        
        # Count total pending orders.
        pending_count = (
            db.session.query(Order)
            .filter(Order.delivery_agent_id == current_user.delivery_agent_id, Order.delivery_status == "Preparing")
            .count()
        )
        
        # Count total completed orders.
        completed_count = (
            db.session.query(Order)
            .filter(Order.delivery_agent_id == current_user.delivery_agent_id, Order.delivery_status == "Delivered")
            .count()
        )
        
        # Query today's earnings.
        today_earnings = db.session.query(
            func.coalesce(func.sum(Earnings.base_pay), 0).label("base_pay"),
            func.coalesce(func.sum(Earnings.bonus), 0).label("bonus"),
            func.coalesce(func.sum(Earnings.trips_count), 0).label("trips")
        ).filter(
            Earnings.delivery_agent_id == current_user.delivery_agent_id,
            func.date(Earnings.earned_at) == today
        ).first()

        # Query the most recent earnings record.
        recent_earning = Earnings.query.filter(
            Earnings.delivery_agent_id == current_user.delivery_agent_id
        ).order_by(Earnings.earned_at.desc()).first()
        
        return render_template(
            'delivery_agent/dashboard.html',
            user=agent,
            pending_orders=pending_orders,
            assigned_orders=assigned_orders,
            completed_orders=completed_orders,
            todays_deliveries_count=todays_deliveries_count,
            pending_count=pending_count,
            completed_count=completed_count,
            timedelta=datetime.timedelta,
            earnings=today_earnings,
            recent_earnings=recent_earning
        )
    
    @app.route('/delivery-partner/profile')
    def delivery_partner_profile():
        if not current_user.is_authenticated:
            flash("Please log in to access your profile.", "danger")
            return redirect(url_for('employee_login'))
        
        agent = DeliveryAgent.query.get(current_user.delivery_agent_id)
        print("Loaded agent:", agent)
        return render_template('delivery_agent/profile.html', user=agent)
    
    @app.route('/delivery-partner/order-detail/<string:order_id>')
    def delivery_partner_order_detail(order_id):
        """Fetch detailed order information along with order items, customer details, and feedback."""
        
        order = (
            db.session.query(Order)
            .options(
                joinedload(Order.customer).joinedload(Customer.addresses),
                joinedload(Order.order_items).joinedload(OrderItem.menu_item)
            )
            .filter(
                Order.delivery_agent_id == current_user.delivery_agent_id,
                Order.order_id == order_id
            )
            .first()
        )
        
        if not order:
            return "Order not found", 404

        feedback = (
            db.session.query(DeliveryFeedback)
            .filter(
                DeliveryFeedback.delivery_agent_id == current_user.delivery_agent_id,
                DeliveryFeedback.order_id == order_id
            )
            .first()
        )
        
        print(feedback)
        return render_template("delivery_agent/order_detail.html", user=current_user, order=order, feedback=feedback)
    
    @app.route('/delivery-partner/order-tracking/<string:order_id>')
    def delivery_partner_order_tracking(order_id):
        """Fetch detailed order information along with order items and customer details."""
        
        order = (
            db.session.query(Order)
            .options(
                joinedload(Order.customer).joinedload(Customer.addresses),
                joinedload(Order.order_items).joinedload(OrderItem.menu_item)
            )
            .filter(
                Order.delivery_agent_id == current_user.delivery_agent_id,
                Order.order_id == order_id
            )
            .first()
        )
        
        if not order:
            return "Order not found", 404
        
        return render_template("delivery_agent/track_order.html", user=current_user, order=order)

    @app.route('/order/<string:order_id>/accept', methods=['POST'])
    @login_required
    def accept_order(order_id):
        order = Order.query.get_or_404(order_id)
        
        # Check instance's status, not the class's attribute
        if order.delivery_status != "Preparing":
            flash("Order already accepted.")
            return redirect(url_for("delivery_agent"))
        
        order.delivery_status = "Accepted"
        order.delivery_agent_id = current_user.delivery_agent_id
        db.session.commit()
        
        flash("Order accepted successfully")
        return redirect(url_for('delivery_agent'))

    @app.route('/order/<string:order_id>/decline', methods=['POST'])
    @login_required
    def decline_order(order_id):
        order = Order.query.get_or_404(order_id)
        
        if order.delivery_status != "Preparing":
            flash("Order already declined or processed.")
            return redirect(url_for("delivery_agent"))
        
        order.delivery_status = "Pending"
        order.delivery_agent_id = None
        db.session.commit()
        
        flash("Order declined successfully")
        return redirect(url_for("delivery_agent"))

    @app.route('/api/orders/<string:order_id>/update_status', methods=['POST'])
    @login_required
    def edit_delivery_status(order_id):
        order = Order.query.get_or_404(order_id)
        
        valid_statuses = ["Accepted", "Picked Up", "Out for Delivery", "Delivered"]
        data = request.get_json() or {}
        new_status = data.get('status')
        
        if new_status not in valid_statuses:
            return jsonify({"error": "Invalid status update"}), 400

        order.delivery_status = new_status
        if new_status == "Delivered":
            order.delivered_at = func.now()
            
            base_pay_per_delivery = 50.0
            today = datetime.date.today()
            
            today_earnings = Earnings.query.filter(
                Earnings.delivery_agent_id == current_user.delivery_agent_id,
                func.date(Earnings.earned_at) == today
            ).first()
            
            if today_earnings:
                today_earnings.base_pay += base_pay_per_delivery
                today_earnings.trips_count += 1
                if today_earnings.trips_count % 5 == 0:
                    today_earnings.bonus += 100.0
            else:
                previous_earnings = Earnings.query.filter(
                    Earnings.delivery_agent_id == current_user.delivery_agent_id,
                    func.date(Earnings.earned_at) < today
                ).order_by(Earnings.earned_at.desc()).first()
                
                initial_base_pay = previous_earnings.base_pay if previous_earnings else 0.0
                initial_bonus = previous_earnings.bonus if previous_earnings else 0.0
                
                today_earnings = Earnings(
                    delivery_agent_id=current_user.delivery_agent_id,
                    base_pay=initial_base_pay + base_pay_per_delivery,
                    bonus=initial_bonus,
                    trips_count=1,
                    earned_at=func.now()
                )
                db.session.add(today_earnings)

        db.session.commit()
        
        response_data = {
            "order_id": order.order_id,
            "delivery_status": order.delivery_status
        }
        if new_status == "Delivered" and order.delivery_agent_id:
            earnings = Earnings.query.filter_by(delivery_agent_id=order.delivery_agent_id).first()
            if earnings:
                total = earnings.base_pay + earnings.bonus
                response_data["earnings"] = {
                    "base_pay": earnings.base_pay,
                    "bonus": earnings.bonus,
                    "trips_count": earnings.trips_count,
                    "total": total
                }
            
        return jsonify(response_data), 200

    @app.route('/delivery_agent/<string:agent_id>/edit', methods=['POST'])
    def edit_delivery_agent(agent_id):
        agent = DeliveryAgent.query.get_or_404(agent_id)
        
        agent.username = request.form.get('username', agent.username)
        agent.email = request.form.get('email', agent.email)
        
        phone = request.form.get('phone')
        if phone:
            try:
                agent.phone = int(phone)
            except ValueError:
                flash("Invalid phone number.", "danger")
                return redirect(url_for('delivery_partner_profile'))
        agent.delivery_area = request.form.get('delivery_area', agent.delivery_area)
        agent.id_proof = request.form.get('id_proof', agent.id_proof)
        agent.bio = request.form.get('bio', agent.bio)
        
        agent.available_slots = True if request.form.get('available_slots') == 'on' else False

        file = request.files.get('image')
        if file and file.filename:
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            relative_path = os.path.join('uploads', filename).replace(os.sep, '/')
            agent.image = relative_path

        try:
            db.session.commit()
            flash("Delivery agent details updated successfully.", "success")
        except Exception as e:
            db.session.rollback()
            flash(f"Error updating details: {e}", "danger")
        
        return redirect(url_for('delivery_partner_profile'))
    
    @app.route('/api/delivery-agent/earnings')
    @login_required
    def get_current_earnings():
        today = datetime.date.today()
        today_earnings = Earnings.query.filter(
            Earnings.delivery_agent_id == current_user.delivery_agent_id,
            func.date(Earnings.earned_at) == today
        ).first()

        if not today_earnings:
            return jsonify({
                'base_pay': 0.0,
                'bonus': 0.0,
                'trips_count': 0
            })

        return jsonify({
            'base_pay': today_earnings.base_pay,
            'bonus': today_earnings.bonus,
            'trips_count': today_earnings.trips_count
        })
