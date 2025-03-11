# 🎟️ RCB Ticket Availability Notifier

This script monitors the official RCB ticket booking page and sends notifications via email and Telegram when tickets become available.

## 🚀 Features

- Scrapes the RCB ticket booking website using Puppeteer
- Parses available matches and their ticket status
- Sends email notifications to configured recipients
- Sends Telegram messages to specified usernames
- Configurable retry intervals and email sending limits

## 📋 Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14+ recommended)
- npm or Yarn package manager
- A valid SMTP email account for sending notifications
- A CallMeBot Telegram API setup for messaging

## 🔧 Setup & Installation

1. **Clone the repository**

   ```sh
   git clone https://github.com/yourusername/rcb-ticket-notifier.git
   cd rcb-ticket-notifier
   ```

2. **Install dependencies**

   ```sh
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the project root and add the following:

   ```ini
   RECIPIENT_EMAIL="your-email@example.com"
   TELEGRAM_USERNAMES="your_telegram_username"
   NUM_OF_EMAILS_TO_SEND=3
   INTERVAL_BETWEEN_EMAILS=10
   FETCH_STATUS_DELAY=60
   RCB_TICKETS_PAGE_URL="https://shop.royalchallengers.com/ticket"

   SMTP_HOST="your-smtp-host"
   SMTP_PORT=587
   EMAIL_USER="your-email@example.com"
   EMAIL_PASS="your-email-password"
   ```

   - `RECIPIENT_EMAIL`: Comma-separated list of email addresses to receive notifications.
   - `TELEGRAM_USERNAMES`: Comma-separated list of Telegram usernames.
   - `NUM_OF_EMAILS_TO_SEND`: Number of times to send emails per alert.
   - `INTERVAL_BETWEEN_EMAILS`: Delay (in seconds) between sending multiple emails.
   - `FETCH_STATUS_DELAY`: Delay (in seconds) between ticket availability checks.
   - `RCB_TICKETS_PAGE_URL`: URL of the RCB ticket booking page.
   - `SMTP_HOST`, `SMTP_PORT`, `EMAIL_USER`, `EMAIL_PASS`: SMTP configuration for sending emails.

4. **Run the script**
   ```sh
   node tickets.js
   ```

## 🛠️ How It Works

1. The script uses **Puppeteer** to scrape ticket details from the RCB ticket booking page.
2. It extracts match details, ticket availability, and pricing.
3. If tickets are available, it:
   - Sends email notifications using **nodemailer**.
   - Sends Telegram messages via **CallMeBot** API.
4. The script runs in a loop, checking availability at regular intervals (as per `FETCH_STATUS_DELAY`).
5. It stops execution once notifications are successfully sent.

## 📬 Email & Telegram Notifications

- **Email notifications** are sent with match details and a booking link.
- **Telegram messages** are sent via the CallMeBot API.
- Messages include match details, ticket prices, and a booking link.

## 🔄 Customization

- Adjust the `.env` values to modify notification settings.
- Modify `fetchTickets()` function in `index.js` to support other ticket websites.
- Change `sendEmailNotification()` or `sendTelegramMessage()` for custom notification logic.

## 🛑 Stopping the Script

To stop the script from running, press `CTRL + C` in the terminal.

## 📜 License

This project is licensed under the MIT License. Feel free to use and modify it.

## 🤝 Contributing

Pull requests and feature enhancements are welcome! Feel free to fork and contribute.

🙌 Inspired By

This project was inspired by .[RCB-Tickets-Notification-Script](https://github.com/DhruvAwasthi/RCB-Tickets-Notification-Script)
