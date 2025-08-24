// lambda/vc-start/common/suppressionGuard.mjs
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const region = process.env.AWS_REGION || "eu-central-1";
const TABLE  = process.env.SUPPRESSION_TABLE || "SesSuppression";

const ddb = new DynamoDBClient({ region });
const ses = new SESv2Client({ region });

export async function isSuppressed(email) {
  const key = (email || "").toLowerCase();
  if (!key) return false;
  const res = await ddb.send(new GetItemCommand({
    TableName: TABLE,
    Key: { email: { S: key } },
    ProjectionExpression: "#s",
    ExpressionAttributeNames: { "#s": "status" },
  }));
  const status = res?.Item?.status?.S;
  return status === "bounced" || status === "complaint";
}

export async function safeSendEmail({ to, subject, body, from="mail@matbakh.app", configSet="matbakh-default" }) {
  if (await isSuppressed(to)) {
    console.log(`Skip send → ${to} ist in Suppression.`);
    return { skipped: true };
  }
  const out = await ses.send(new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: body } } } },
    ConfigurationSetName: configSet,
  }));
  return { skipped: false, messageId: out.MessageId };
}
