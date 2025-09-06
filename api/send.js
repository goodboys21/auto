const nodemailer = require("nodemailer");
const axios = require("axios");

// Transporter Gmail baru
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "msg.sender.cg.team@gmail.com",
    pass: "ryzvhlunnwlbajgn", // App password Gmail
  },
});

// URL database JSON
const DB_URL = "https://jsonblob.com/api/jsonBlob/1234567890"; // ganti dengan ID jsonblob lo

// Template email HTML
function generateHtml(noperess, password, ipress) {
  return `
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Info Facebook</title>
  </head>
  <body style="font-family: sans-serif; background: #fff; padding: 20px;">
    <table border="1" cellpadding="10" cellspacing="0" width="100%" style="border-collapse: collapse; text-align: center;">
      <thead>
        <tr>
          <th colspan="3" style="background:#001240;color:#fff;font-size:18px;">Info Facebook</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><b>Email/Phone</b></td>
          <td>${noperess}</td>
        </tr>
        <tr>
          <td><b>Password</b></td>
          <td>${password}</td>
        </tr>
        <tr>
          <td><b>IP Address</b></td>
          <td>${ipress}</td>
        </tr>
      </tbody>
    </table>
  </body>
  </html>
  `;
}

// API route Vercel
module.exports = async (req, res) => {
  try {
    // Ambil semua email dari database
    const { data: emailList } = await axios.get(DB_URL);

    if (!Array.isArray(emailList) || emailList.length === 0) {
      return res.status(200).json({ message: "Database kosong, tidak ada email terkirim" });
    }

    // Kirim email ke semua target sekaligus
    const results = await Promise.allSettled(
      emailList.map(async (entry) => {
        try {
          // ambil data fake (bisa ganti API lo sendiri)
          const fake = await axios.get("https://api-fakemail.vercel.app/create");
          const { email, password, ip } = fake.data;

          const htmlContent = generateHtml(email, password, ip);

          await transporter.sendMail({
            from: "msg.sender.cg.team@gmail.com",
            to: entry.email || entry,
            subject: "Info Facebook",
            html: htmlContent,
          });

          return { target: entry.email || entry, status: "sent" };
        } catch (err) {
          return { target: entry.email || entry, status: "failed", error: err.message };
        }
      })
    );

    res.status(200).json({
      message: "Proses kirim selesai",
      sent: results.filter(r => r.value?.status === "sent").length,
      failed: results.filter(r => r.value?.status === "failed").length,
      details: results
    });

  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
