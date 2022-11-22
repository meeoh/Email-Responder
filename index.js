require("dotenv").config();

const notifier = require("mail-notifier");
const nodemailer = require("nodemailer");
const convertFile = require("./docx_to_pdf").convertFile;
const { Duplex } = require("stream"); // Native Node Module

const email = process.env.EMAIL;
const password = process.env.PASSWORD;

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: email,
    pass: password,
  },
});

const imap = {
  user: email,
  password: password,
  host: "imap.gmail.com",
  port: 993, // imap port
  tls: true, // use secure connection
  tlsOptions: { rejectUnauthorized: false },
};

function bufferToStream(myBuffer) {
  let tmp = new Duplex();
  tmp.push(myBuffer);
  tmp.push(null);
  return tmp;
}

const cleanFileName = (fileName) => {
  let parts = fileName.split(".");
  parts = parts.slice(0, -1);
  return `${parts.join("")}.pdf`;
};

const processMail = async (mail) => {
  console.log("received");

  const attachments = mail.attachments;
  const resultFileNames = [];

  for (const attachment of attachments) {
    const myReadableStream = bufferToStream(attachment.content);

    const fileName = cleanFileName(attachment.generatedFileName);
    await convertFile(myReadableStream, fileName);
    resultFileNames.push(fileName);
  }

  const mailOptions = {
    from: email,
    to: mail.from,
    subject: "Result PDFs",
    text: "See PDF(s) attached",
    attachments: resultFileNames.map((filename) => ({
      filename,
      contentType: "application/pdf",
      path: filename,
    })),
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });

  resultFileNames.forEach((filename) => {
    fs.rmSync(filename);
  });
};

notifier(imap)
  .on("mail", (mail) => processMail(mail))
  .start();
