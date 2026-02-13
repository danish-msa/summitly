/**
 * One-time script: set public-read ACL on all existing objects under
 * images/agents/ in the Summitly S3 bucket so they load without 403.
 *
 * Prerequisites:
 * - AWS CLI installed and configured (aws configure), or env vars:
 *   S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, AWS_REGION (optional, default ca-central-1)
 * - Bucket "Block public access" must allow ACLs (unchecked for ACL-related blocks)
 *
 * Run from project root:
 *   node scripts/s3-set-agent-images-public.js
 *
 * Or with npx and env from .env.local:
 *   npx dotenv -e .env.local -- node scripts/s3-set-agent-images-public.js
 */

const { S3Client, ListObjectsV2Command, PutObjectAclCommand } = require('@aws-sdk/client-s3');

const BUCKET = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || 'summitly-storage';
const PREFIX = 'images/agents/';

const ACCESS_KEY = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

async function main() {
  const client = new S3Client({
    region: process.env.S3_REGION || process.env.AWS_REGION || 'ca-central-1',
    credentials: ACCESS_KEY
      ? {
          accessKeyId: ACCESS_KEY,
          secretAccessKey: SECRET_KEY,
        }
      : undefined,
  });

  let continuationToken;
  let total = 0;
  let updated = 0;

  do {
    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: PREFIX,
        ContinuationToken: continuationToken,
      })
    );

    const keys = (list.Contents || []).map((o) => o.Key).filter(Boolean);
    total += keys.length;

    for (const Key of keys) {
      try {
        await client.send(
          new PutObjectAclCommand({
            Bucket: BUCKET,
            Key,
            ACL: 'public-read',
          })
        );
        updated++;
        console.log('OK:', Key);
      } catch (err) {
        console.error('FAIL:', Key, err.message);
      }
    }

    continuationToken = list.NextContinuationToken;
  } while (continuationToken);

  console.log(`\nDone. Listed ${total} objects, set public-read on ${updated}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
