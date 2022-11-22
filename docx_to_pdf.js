require("dotenv").config();

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const api_key = process.env.API_KEY;

function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

const convertFile = async (fileStream, fileDestinationName) => {
  const formData = new FormData();
  formData.append(
    "instructions",
    JSON.stringify({
      parts: [
        {
          file: "document",
        },
      ],
    })
  );
  formData.append("document", fileStream);

  try {
    const response = await axios.post(
      "https://api.pspdfkit.com/build",
      formData,
      {
        headers: formData.getHeaders({
          Authorization: `Bearer ${api_key}`,
        }),
        responseType: "stream",
      }
    );

    response.data.pipe(fs.createWriteStream(fileDestinationName));
  } catch (e) {
    const errorString = await streamToString(e.response.data);
    console.log(errorString);
  }
};

exports.convertFile = convertFile;
