# HIFI Delivery

HIFI Delivery is a comprehensive delivery management system designed to streamline the process of managing delivery agents, orders, and customer interactions. This project is built using Flask, SQLAlchemy, and other modern web technologies.

## Features

- **User Authentication**: Secure login and signup for customers, delivery agents, and admins.
- **Order Management**: Track and manage orders from creation to delivery.
- **Delivery Agent Dashboard**: View assigned, pending, and completed orders.
- **Admin Dashboard**: Manage delivery agents, view sales insights, and approve/reject agent applications.
- **Customer Profile**: Manage addresses and view order history.
- **Email Notifications**: Send welcome emails and password reset links.

## Installation

1. **Clone the repository**:
    ```bash
    git clone https://github.com/Pawanverma9660/HIFIDelivery.git
    cd HIFIDelivery
    ```

2. **Create a virtual environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4. **Set up environment variables**:
    Create a `.env` file in the root directory and add the following:
    ```env
    DATABASE_URI=your_database_uri
    SECRET_KEY=your_secret_key
    MAIL_SERVER=smtp.yourmailserver.com
    MAIL_PORT=587
    MAIL_USERNAME=your_email@example.com
    MAIL_APP_PASSWORD=your_email_password
    ```

5. **Run database migrations**:
    ```bash
    flask db upgrade
    ```

6. **Start the application**:
    ```bash
    flask run
    ```

## Usage

- **Admin**: Access the admin dashboard at `/admin` to manage delivery agents and view sales insights.
- **Delivery Agent**: Access the delivery agent dashboard at `/delivery-agent` to view and manage orders.
- **Customer**: Access the customer profile at `/user/profile` to manage addresses and view order history.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For any inquiries or support, please contact us at support@hifidelivery.com.
