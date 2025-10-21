import { APIGatewayProxyHandler } from "aws-lambda";
import crypto from "crypto";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    console.log(`📨 ${event.httpMethod} Request received:`, event.path);

    if (event.httpMethod === "GET") {
      // Webhook Verification (Facebook Setup)
      const params = event.queryStringParameters || {};
      const mode = params["hub.mode"];
      const token = params["hub.verify_token"];
      const challenge = params["hub.challenge"];

      console.log("🔍 Webhook verification:", {
        mode,
        token: token ? "***" : "not present",
        challenge,
      });

      if (mode === "subscribe" && token === process.env.FB_VERIFY_TOKEN) {
        console.log("✅ Webhook verification successful");
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers":
              "authorization, x-client-info, apikey, content-type, x-hub-signature",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          },
          body: challenge || "",
        };
      } else {
        console.log("❌ Webhook verification failed - token mismatch");
        return {
          statusCode: 403,
          body: "Forbidden",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        };
      }
    }

    if (event.httpMethod === "POST") {
      const rawBody = event.body || "{}";
      console.log("📦 POST Body received, length:", rawBody.length);

      // Signature validation
      if (!(await isValidSignature(event, rawBody))) {
        console.log("❌ Invalid signature - request rejected");
        return {
          statusCode: 403,
          body: "Invalid signature",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        };
      }

      try {
        const body = JSON.parse(rawBody);

        if (body.object) {
          console.log("✅ Facebook event received:", {
            object: body.object,
            entry_count: body.entry?.length || 0,
            first_entry: body.entry?.[0]
              ? {
                  id: body.entry[0].id,
                  time: body.entry[0].time,
                  changes_count: body.entry[0].changes?.length || 0,
                }
              : null,
          });

          // Process webhook events
          for (const entry of body.entry || []) {
            try {
              console.log("🔄 Processing entry:", entry.id);

              // Handle different event types
              if (entry.messaging) {
                console.log("📱 Processing messaging events");
              }

              if (entry.changes) {
                // Handle page/feed changes
                for (const change of entry.changes) {
                  console.log(
                    "🔄 Processing change:",
                    change.field,
                    change.value
                  );

                  if (
                    change.field === "feed" &&
                    change.value?.item === "status"
                  ) {
                    console.log("📝 Page status update detected");
                  }

                  if (change.field === "ratings" && change.value?.rating) {
                    console.log("⭐ New rating received:", change.value.rating);
                  }

                  if (change.field === "leadgen" && change.value?.leadgen_id) {
                    console.log(
                      "🎯 Lead generation event detected:",
                      change.value.leadgen_id
                    );
                  }
                }
              }

              console.log("✅ Successfully processed webhook event");
            } catch (processingError) {
              console.error(
                "❌ Error processing webhook event:",
                processingError
              );
            }
          }

          return {
            statusCode: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
            body: "EVENT_RECEIVED",
          };
        } else {
          console.log("⚠️ Unknown event type received");
          return {
            statusCode: 200,
            body: "Unknown event type",
            headers: {
              "Access-Control-Allow-Origin": "*",
            },
          };
        }
      } catch (error) {
        console.error("❌ Error parsing Facebook events:", error);
        return {
          statusCode: 400,
          body: "Invalid JSON",
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        };
      }
    }

    if (event.httpMethod === "OPTIONS") {
      // Handle CORS preflight requests
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type, x-hub-signature",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        },
        body: "",
      };
    }

    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        Allow: "GET, POST, OPTIONS",
      },
      body: "Method Not Allowed",
    };
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };
  }
};

async function isValidSignature(event: any, rawBody: string): Promise<boolean> {
  const signature =
    event.headers["x-hub-signature"] || event.headers["x-hub-signature-256"];
  const appSecret = process.env.FB_APP_SECRET;

  if (!signature || !appSecret) {
    console.log("❌ No signature or app secret present");
    return false;
  }

  try {
    const [algo, receivedHash] = signature.split("=");
    console.log("🔐 Validating signature:", {
      algo,
      receivedHash: receivedHash?.substring(0, 10) + "...",
    });

    // SHA-1 or SHA-256 support
    const hashAlgo = algo === "sha256" ? "sha256" : "sha1";

    const expectedHash = crypto
      .createHmac(hashAlgo, appSecret)
      .update(rawBody)
      .digest("hex");

    const isValid = receivedHash === expectedHash;
    console.log(isValid ? "✅ Signature valid" : "❌ Signature invalid");
    return isValid;
  } catch (error) {
    console.error("❌ Error validating signature:", error);
    return false;
  }
}
