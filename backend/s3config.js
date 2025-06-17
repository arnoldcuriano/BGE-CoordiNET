require('dotenv').config();
const { S3Client } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: 'https://s3-ap-southeast-1.amazonaws.com',
});

module.exports = {
  s3Client,
  bucket: process.env.AWS_S3_BUCKET,
};