require("dotenv").config();
const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");
const moment = require("moment");
const { promisify } = require("util");
const axios = require("axios");
const sleep = promisify(setTimeout);

// Load environment variables
const recipientEmails = process.env.RECIPIENT_EMAIL.split(",");
const telegramUsernames = process.env.TELEGRAM_USERNAMES.split(",").map((u) =>
  u.trim()
);

const numOfEmailsToSend = parseInt(process.env.NUM_OF_EMAILS_TO_SEND);
const intervalBetweenEmails = parseInt(process.env.INTERVAL_BETWEEN_EMAILS);
const fetchStatusDelay = parseInt(process.env.FETCH_STATUS_DELAY);
const rcbTicketsPageUrl = process.env.RCB_TICKETS_PAGE_URL;

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to scrape tickets from the website
async function fetchTickets() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(rcbTicketsPageUrl, { waitUntil: "networkidle2" });

  const tickets = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".css-q38j1a")).map(
      (ticket) => {
        const dateTimeElement = ticket.querySelector(
          "p.chakra-text.css-1nm99ps"
        );
        const teams = ticket.querySelectorAll("p.chakra-text.css-10rvbm3");
        const descriptionElement = ticket.querySelector(
          "p.chakra-text.css-vahgqk"
        );
        const rangeElement = ticket.querySelector("span.css-1eveppl");
        const buttonElement = ticket.querySelector("button");

        const date_time = dateTimeElement
          ? dateTimeElement.innerText.trim()
          : null;
        const team1 = teams[0] ? teams[0].innerText.trim() : null;
        const team2 = teams[1] ? teams[1].innerText.trim() : null;
        const match = team1 && team2 ? `${team1} vs ${team2}` : null;
        const description = descriptionElement
          ? descriptionElement.innerText.trim()
          : null;
        const range = rangeElement ? rangeElement.innerText.trim() : null;
        const label = buttonElement ? buttonElement.innerText.trim() : null;
        const tickets_available = label === "BUY TICKETS";

        return {
          date_time,
          match,
          description,
          range,
          label,
          tickets_available,
        };
      }
    );
  });

  await browser.close();

  // Format date properly (handling both formats)
  tickets.forEach((ticket) => {
    if (ticket.date_time) {
      const parsedDate = moment(
        ticket.date_time,
        ["MMM DD, YYYY hh:mm A", "ddd, MMM DD, YYYY hh:mm A"],
        true
      );
      if (parsedDate.isValid()) {
        ticket.formatted_date = parsedDate.format("YYYY-MM-DD");
      }
    }
  });

  return tickets;
}

// Function to filter matches with available tickets and future dates
function getAvailableMatches(tickets) {
  const currentDate = moment().format("YYYY-MM-DD");
  return tickets.filter(
    (ticket) => ticket.formatted_date > currentDate && ticket.tickets_available
  );
}

// Function to send email notifications
async function sendEmailNotification(ticket) {
  let match = ticket?.match ? ticket.match : ticket.description;
  const mailOptions = {
    from: `"Ticket Alert" <${process.env.EMAIL_USER}>`,
    to: recipientEmails.join(","),
    subject: `🎟️ Tickets Available: ${match} on ${ticket.formatted_date}!`,
    text: `The tickets for ${match} on ${ticket.formatted_date} are available!\n\nPrice Range: ${ticket.range}\n\nBook Now: ${rcbTicketsPageUrl}`,
  };

  for (let i = 0; i < numOfEmailsToSend; i++) {
    await transporter.sendMail(mailOptions);
    console.log(
      `[${new Date().toLocaleString()}] Email sent for ${match} (${
        i + 1
      }/${numOfEmailsToSend})`
    );
    if (i < numOfEmailsToSend - 1) await sleep(intervalBetweenEmails * 1000);
  }
}

async function sendTelegramMessage(ticket) {
  let match = ticket?.match ? ticket.match : ticket.description;
  const message = `🎟️ Tickets Available: ${match} on ${ticket.formatted_date}!%0A💰 Price Range: ${ticket.range}%0A🔗 Book Now: ${rcbTicketsPageUrl}`;

  for (let i = 0; i < numOfEmailsToSend; i++) {
    for (const username of telegramUsernames) {
      const apiUrl = `http://api.callmebot.com/text.php?user=${username}&text=${message}`;
      try {
        await axios.get(apiUrl);
        console.log(
          `[${new Date().toLocaleString()}] Telegram message sent to @${username} (${
            i + 1
          }/${numOfEmailsToSend})`
        );
      } catch (error) {
        console.error(`Failed to send message to @${username}:`, error.message);
      }
    }
    if (i < numOfEmailsToSend - 1) await sleep(intervalBetweenEmails * 1000);
  }
}

// Main function to check and notify
(async function monitorTickets() {
  while (true) {
    try {
      console.log(
        `[${new Date().toLocaleString()}] Fetching latest tickets...`
      );
      const tickets = await fetchTickets();
      const availableMatches = getAvailableMatches(tickets);

      if (availableMatches.length > 0) {
        console.log(
          `[${new Date().toLocaleString()}] 🎉 Available matches found! Sending notifications...`
        );

        for (const ticket of availableMatches) {
          await Promise.all([
            sendEmailNotification(ticket), // Send Email
            sendTelegramMessage(ticket), // Send Telegram Message
          ]);
        }

        break; // Stop execution once notifications are sent
      } else {
        console.log(
          `[${new Date().toLocaleString()}] ❌ No tickets available. Retrying in ${fetchStatusDelay} seconds...`
        );
      }
    } catch (error) {
      console.error("Error:", error.message);
    }

    await sleep(fetchStatusDelay * 1000);
  }
})();
