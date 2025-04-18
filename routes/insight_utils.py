import plotly.graph_objects as go
from markupsafe import Markup
import plotly.io as pio
from models import Address, DeliveryAgent, Order, DeliveryFeedback
from sqlalchemy import func, extract
from datetime import timedelta
import matplotlib.pyplot as plt
from app import db
import plotly.express as px


def generate_Customer_Demographics_Distribution(dark_mode=False):
    # Query all addresses from the database
    addresses = Address.query.all()

    # Build a dictionary of counts based on the address_line category
    category_counts = {}
    for address in addresses:
        # Split the address_line using ',' and check for at least 2 parts
        parts = address.address_line.split(",")
        if len(parts) > 1:
            category = parts[1].strip()
        else:
            category = address.address_line.strip()
        category_counts[category] = category_counts.get(category, 0) + 1

    # If no records found, use a fallback
    if not category_counts:
        labels = ["No Data"]
        sizes = [1]
        colors = ["#d3d3d3"]
    else:
        labels = list(category_counts.keys())
        sizes = list(category_counts.values())
        # Use Plotly's qualitative color palette; adjust if you need more colors
        colors = px.colors.qualitative.Plotly[: len(labels)]

    # Optional: set a pull value for slices if you want to highlight slices with count > threshold
    pull_values = [0.05 if count > 1 else 0 for count in sizes]

    # Create the pie chart
    fig = go.Figure(
        data=[
            go.Pie(
                labels=labels,
                values=sizes,
                marker=dict(colors=colors, line=dict(color="#000000", width=1)),
                textinfo="label+percent",
                hoverinfo="label+percent+value",
                pull=pull_values,
            )
        ]
    )

    fig.update_layout(
        title_text="Customer Demographics Distribution",
        title_x=0.5,
        showlegend=True,
        legend=dict(x=1, y=0.5),
        height=400,
        template="plotly_dark" if dark_mode else "plotly_white",
    )
    # Generate HTML for embedding the chart
    chart_html = fig.to_html(full_html=False)
    return Markup(chart_html)


def generate_line_chart(dark_mode=False):
    agents = DeliveryAgent.query.all()
    agent_names = []
    early_counts = []
    on_time_counts = []
    late_counts = []

    for agent in agents:
        # Use the correct primary key for filtering orders
        orders = Order.query.filter_by(delivery_agent_id=agent.delivery_agent_id).all()
        early = 0
        on_time = 0
        late = 0

        for order in orders:
            if order.delivered_at and order.created_at:
                diff_minutes = (
                    order.delivered_at - order.created_at
                ).total_seconds() / 60  # minutes difference

                # Example logic: adjust conditions as needed
                if diff_minutes < 55:
                    early += 1
                elif 55 <= diff_minutes <= 60:
                    on_time += 1
                else:
                    late += 1

        total = early + on_time + late or 1  # avoid division by zero
        agent_names.append(agent.username)
        early_counts.append((early * 100) / total)
        on_time_counts.append((on_time * 100) / total)
        late_counts.append((late * 100) / total)

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            y=agent_names,
            x=early_counts,
            name="Early",
            marker=dict(color="#1E3A8A"),
            orientation="h",
        )
    )
    fig.add_trace(
        go.Bar(
            y=agent_names,
            x=on_time_counts,
            name="On Time",
            marker=dict(color="#6366F1"),
            orientation="h",
        )
    )
    fig.add_trace(
        go.Bar(
            y=agent_names,
            x=late_counts,
            name="Late",
            marker=dict(color="#FF8C00"),
            orientation="h",
        )
    )

    fig.update_layout(
        title="📦 Delivery Performance by Delivery Agent",
        xaxis=dict(title="Percentage"),
        yaxis=dict(title="Delivery Agent", categoryorder="total ascending"),
        barmode="stack",
        template="plotly_dark" if dark_mode else "plotly_white",
        bargap=0.05,
        height=400,
    )

    return Markup(fig.to_html(full_html=False))


def generate_Effectiveness_of_Promotions(dark_mode=False):
    promotions = [
        "Discount",
        "Weekend offers",
        "Loyalty Rewards",
        "Happy Hour",
        "Seasonal Offer",
    ]
    effectiveness = [20, 35, 25, 30, 40]
    colors = ["blue", "green", "red", "purple", "orange"]

    fig = go.Figure(
        data=[
            go.Bar(
                x=promotions,
                y=effectiveness,
                marker=dict(color=colors),
                text=[f"{val}%" for val in effectiveness],
                textposition="outside",
            )
        ]
    )

    fig.update_layout(
        title="Effectiveness of Promotions",
        xaxis=dict(title="Promotion Type"),
        yaxis=dict(title="Effectiveness (% Sales Increase)", range=[0, 50]),
        template="plotly_dark" if dark_mode else "plotly_white",
        height=400,
    )

    return Markup(fig.to_html(full_html=False))


def generate_agent_rating_chart(dark_mode=False):
    # Get all delivery agents and initialize a dictionary for ratings count
    agents = DeliveryAgent.query.all()
    agent_names = [agent.username for agent in agents]
    ratings_count_per_agent = {
        agent.username: {r: 0 for r in range(1, 6)} for agent in agents
    }

    # Count ratings for each agent using the correct primary key field
    for agent in agents:
        for rating_value in range(1, 6):
            count = DeliveryFeedback.query.filter_by(
                delivery_agent_id=agent.delivery_agent_id, rating=rating_value
            ).count()
            ratings_count_per_agent[agent.username][rating_value] = count

    colors = {
        1: "#C0504D",  # red
        2: "#F79646",  # orange
        3: "#4F81BD",  # blue
        4: "#FFDE00",  # yellow
        5: "#0dec05",  # green
    }

    fig = go.Figure()

    # For each rating level, add a grouped bar with the count of ratings
    for rating in range(1, 6):
        fig.add_trace(
            go.Bar(
                x=agent_names,
                y=[ratings_count_per_agent[agent][rating] for agent in agent_names],
                name=f"{rating} Star",
                marker_color=colors[rating],
                text=[ratings_count_per_agent[agent][rating] for agent in agent_names],
                textposition="inside",
            )
        )

    fig.update_layout(
        title="⭐ Delivery Agent Ratings (1 to 5 stars)",
        xaxis=dict(title="Delivery Agent"),
        yaxis=dict(title="Number of Ratings", tickmode="linear", dtick=1),
        barmode="group",
        bargap=0.1,
        template="plotly_dark" if dark_mode else "plotly_white",
        height=400,
    )

    return Markup(fig.to_html(full_html=False))


def generate_customer_feedback_chart(dark_mode=False):
    # Count ratings for each star value (1 to 5) from DeliveryFeedback entries
    feedback_counts = {}
    for star in range(1, 6):
        count = DeliveryFeedback.query.filter_by(rating=star).count()
        feedback_counts[star] = count  

    ratings = list(feedback_counts.keys())
    counts = list(feedback_counts.values())
    colors = ["#C0504D", "#F79646", "#4F81BD", "#FFDE00", "#0dec05"]

    fig = go.Figure(
        data=[
            go.Bar(
                x=[f"{r} Star" for r in ratings],
                y=counts,
                marker_color=colors,
                textposition="outside",
            )
        ]
    )

    total_feedback = sum(counts)
    avg_rating = (
        (sum(star * count for star, count in feedback_counts.items()) / total_feedback)
        if total_feedback > 0
        else 0
    )

    fig.update_layout(
        title=f"Customer Feedback (Average Rating: {avg_rating:.2f} ⭐)",
        xaxis=dict(title="Ratings"),
        yaxis=dict(title="Number of Feedbacks"),
        template="plotly_dark" if dark_mode else "plotly_white",
        height=400,
    )

    return Markup(fig.to_html(full_html=False))



def generate_monthly_retention_chart(dark_mode=False):
    months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ]
    retention_rates = []

    for month_num in range(1, 13):
        # Total customers who ordered in that month using the correct field name
        total_customers = (
            db.session.query(Order.customer_id)
            .filter(extract("month", Order.created_at) == month_num)
            .distinct()
            .count()
        )

        repeat_customers = 0
        unique_users = (
            db.session.query(Order.customer_id)
            .filter(extract("month", Order.created_at) == month_num)
            .distinct()
            .all()
        )

        for (customer_id,) in unique_users:
            order_count = (
                db.session.query(Order.order_id)
                .filter(
                    Order.customer_id == customer_id,
                    extract("month", Order.created_at) <= month_num,
                )
                .count()
            )
            if order_count > 1:
                repeat_customers += 1

        retention_rate = (
            (repeat_customers / total_customers) * 100 if total_customers > 0 else 0
        )
        retention_rates.append(retention_rate)

    fig = go.Figure(
        data=go.Scatter(
            x=months,
            y=retention_rates,
            mode="lines+markers",
            name="Retention Rate",
            line=dict(color="blue"),
            marker=dict(size=8),
        )
    )

    fig.update_layout(
        title="📊 Customer Retention Rate Over Time",
        xaxis=dict(title="Months"),
        yaxis=dict(title="Retention Rate (%)", range=[0, 100]),
        height=400,
        template="plotly_dark" if dark_mode else "plotly_white",
    )

    return Markup(fig.to_html(full_html=False))


def calculate_average_delivery_time():
    """Calculate the average delivery time (in minutes) for delivered orders."""
    result = (
        db.session.query(
            func.avg(
                func.strftime("%s", Order.delivered_at)
                - func.strftime("%s", Order.created_at)
            )
        )
        .filter(Order.delivered_at.isnot(None))
        .first()
    )

    if result and result[0]:
        avg_seconds = result[0]
        avg_minutes = round(avg_seconds / 60)
        return avg_minutes
    return 0


def calculate_delivery_partner_performance():
    """Calculate the average delivery partner performance based on customer ratings."""
    avg_rating = db.session.query(func.avg(DeliveryFeedback.rating)).scalar()
    if avg_rating:
        performance_percent = round((avg_rating / 5) * 100)
        return performance_percent
    return 0


def calculate_return_refund_statistics():
    """
    Calculate return & refund statistics.
    Assumes orders with status 'Refunded' indicate a refund.
    """
    total_orders = db.session.query(func.count(Order.order_id)).scalar()
    refunded_orders = (
        db.session.query(func.count(Order.order_id))
        .filter(Order.delivery_status == "Refunded")
        .scalar()
    )
    if total_orders:
        percentage = round((refunded_orders / total_orders) * 100, 1)
        return percentage
    return 0.0


def calculate_on_time_order_percentage():
    """
    Calculate the percentage of orders delivered on time.
    This demo assumes that orders with status 'Delivered' are on time.
    """
    total_delivered = (
        db.session.query(func.count(Order.order_id))
        .filter(Order.delivery_status == "Delivered")
        .scalar()
    )
    if total_delivered:
        return 98  # For instance, assume 98% on time
    return 0


def calculate_revenue_per_delivery():
    """Calculate the average revenue per delivered order."""
    total_revenue = (
        db.session.query(func.sum(Order.total_price))
        .filter(Order.delivery_status == "Delivered")
        .scalar()
        or 0
    )
    total_deliveries = (
        db.session.query(func.count(Order.order_id))
        .filter(Order.delivery_status == "Delivered")
        .scalar()
        or 0
    )
    if total_deliveries:
        revenue = round(total_revenue / total_deliveries, 2)
        return revenue
    return 0.0
