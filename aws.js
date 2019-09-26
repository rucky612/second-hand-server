const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const env = require("./config.json");
const s3Storage = require("multer-sharp-s3");

AWS.config.update({
  accessKeyId: env.AWS.ACCESS_KEY,
  secretAccessKey: env.AWS.SECRET_ACCESS_KEY,
  region: env.AWS.REGION
  // credentials: new AWS.CognitoIdentityCredentials({
  //   IdentityPoolId: env.AWS.IDENTITY_POOL_ID
  // })
});
const AWSS3 = new AWS.S3({ apiVersion: env.AWS.API_VERSION });

const storage = s3Storage({
  s3: AWSS3,
  Bucket: env.AWS.BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  ACL: "public-read",
  Key: function(req, file, cb) {
    cb(null, Date.now().toString());
  },
  resize: {
    width: 500,
    height: 600
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// GET URL Generator
function generateGetUrl(Key = "") {
  const Bucket = env.AWS.BUCKET_NAME;
  return new Promise((resolve, reject) => {
    const params = {
      Bucket,
      Key
    };
    // Note operation in this case is getObject
    AWSS3.getSignedUrl("getObject", params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        // If there is no errors we will send back the pre-signed GET URL
        resolve(data);
      }
    });
  });
}

function deleteImage(Key = "") {
  const Bucket = env.AWS.BUCKET_NAME;
  return new Promise((resolve, reject) => {
    const params = {
      Bucket,
      Key
    };
    // Note operation in this case is getObject
    AWSS3.deleteObject(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        // If there is no errors we will send back the pre-signed GET URL
        resolve(data);
      }
    });
  });
}

// PUT URL Generator
// function generatePutUrl(Key, ContentType) {
//   return new Promise((resolve, reject) => {
//     // Note Bucket is retrieved from the env variable above.
//     const params = { Bucket, Key, ContentType };
//     // Note operation in this case is putObject
//     s3.getSignedUrl("putObject", params, function(err, url) {
//       if (err) {
//         reject(err);
//       }
//       // If there is no errors we can send back the pre-signed PUT URL
//       resolve(url);
//     });
//   });
// }

exports.upload = upload;
exports.s3 = AWSS3;
exports.getUrl = generateGetUrl;
exports.deleteImg = deleteImage;
