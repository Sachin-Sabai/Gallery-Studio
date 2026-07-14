import fs from "fs";
import path from "path";
import { useLoaderData, useFetcher, Form, useNavigation } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  Box,
  InlineStack,
  BlockStack,
  Icon,
  Banner,
  Badge,
} from "@shopify/polaris";
import { CheckIcon, XIcon } from "@shopify/polaris-icons";
import { authenticate, isTestMode } from "../shopify.server";
import { PLAN_STARTER, PLAN_PRO, PLAN_PREMIUM } from "../constants";
import { boundary } from "@shopify/shopify-app-react-router/server";
export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);

  const billingCheck = await billing.check({
    plans: [PLAN_STARTER, PLAN_PRO, PLAN_PREMIUM],
    isTest: isTestMode,
  });


  let activePlan = "FREE";
  if (billingCheck.hasActivePayment && billingCheck.appSubscriptions?.length > 0) {
    activePlan = billingCheck.appSubscriptions[0].name;
  }

  return { activePlan, shop: session.shop };
};

export const action = async ({ request }) => {
  const { admin, session, billing, redirect } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const planName = formData.get("planName");

  const billingCheck = await billing.check({
    plans: [PLAN_STARTER, PLAN_PRO, PLAN_PREMIUM],
    isTest: isTestMode,
  });

  if (intent === "subscribe") {
    const appUrl = (process.env.SHOPIFY_APP_URL || "").replace(/\/$/, "");
    const returnUrl = `${appUrl}/app/billing?shop=${session.shop}`;
    
    try {
      return await billing.request({
        plan: planName,
        isTest: isTestMode,
        returnUrl,
      });
    } catch (error) {
      if (error instanceof Response) {
        throw error;
      }
      console.error("Billing request failed. Full error:", error);
      try {
        const logContent = `Timestamp: ${new Date().toISOString()}\nMessage: ${error.message}\nStack: ${error.stack}\nData: ${JSON.stringify(error.errorData, null, 2)}\n`;
        fs.writeFileSync(path.join(process.cwd(), "billing_error.log"), logContent, "utf-8");
      } catch (logErr) {
        console.error("Failed to write billing error log:", logErr);
      }
      return {
        error: error.message || "Billing request failed",
        errorDetails: error.errorData || [],
      };
    }
  }

  if (intent === "cancel") {
    if (billingCheck.hasActivePayment && billingCheck.appSubscriptions?.length > 0) {
      const activeSubscriptionId = billingCheck.appSubscriptions[0].id;
      
      const cancelMutation = `
        mutation AppSubscriptionCancel($id: ID!) {
          appSubscriptionCancel(id: $id) {
            appSubscription {
              id
              status
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        await admin.graphql(cancelMutation, {
          variables: { id: activeSubscriptionId },
        });
      } catch (err) {
        console.error("Failed to cancel subscription via Shopify GraphQL API:", err);
      }
    }

    return redirect(`/app/billing?shop=${session.shop}`);
  }

  return null;
};

const CheckSvg = () => (
  <svg style={{ width: "14px", height: "14px", color: "#4ade80", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CrossSvg = () => (
  <svg style={{ width: "14px", height: "14px", color: "#f87171", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PLAN_TIERS = {
  "FREE": 0,
  [PLAN_STARTER]: 1,
  [PLAN_PRO]: 2,
  [PLAN_PREMIUM]: 3,
};

export default function Billing() {
  const { activePlan } = useLoaderData();
  const fetcher = useFetcher();
  const navigation = useNavigation();

  const handleSubscribe = (planName) => {
    fetcher.submit(
      { intent: "subscribe", planName },
      { method: "POST" }
    );
  };

  const plans = [
    {
      name: "FREE",
      price: "$0",
      description: "Perfect for testing or small galleries",
      features: [
        { text: "1 Gallery maximum", available: true },
        { text: "Up to 8 images per gallery", available: true },
        { text: "2 Professional layouts (Grid, Slider)", available: true },
        { text: "Gallery Studio branding", available: true },
        { text: "Advanced layout settings", available: false },
        { text: "Custom themes & colors", available: false },
      ],
      action: null,
    },
    {
      name: PLAN_STARTER,
      price: "$49",
      period: "/ month",
      description: "Great for growing stores",
      features: [
        { text: "3 Galleries maximum", available: true },
        { text: "Up to 20 images per gallery", available: true },
        { text: "5 Professional layouts", available: true },
        { text: "Remove branding", available: true },
        { text: "Advanced layout settings", available: false },
        { text: "Custom themes & colors", available: false },
      ],
      action: () => handleSubscribe(PLAN_STARTER),
    },
    {
      name: PLAN_PRO,
      price: "$79",
      period: "/ month",
      description: "Most popular for brands",
      recommended: true,
      features: [
        { text: "Unlimited galleries", available: true },
        { text: "Unlimited images", available: true },
        { text: "8 Professional layouts", available: true },
        { text: "Remove branding", available: true },
        { text: "Advanced layout settings", available: true },
        { text: "Custom themes & colors", available: true },
      ],
      action: () => handleSubscribe(PLAN_PRO),
    },
    {
      name: PLAN_PREMIUM,
      price: "$120",
      period: "/ month",
      description: "For ultimate creative control",
      features: [
        { text: "Unlimited galleries", available: true },
        { text: "Unlimited images", available: true },
        { text: "All 10 Professional layouts", available: true },
        { text: "Remove branding", available: true },
        { text: "Advanced settings (Hover, Shadow, etc.)", available: true },
        { text: "Custom themes & colors", available: true },
        { text: "Future layouts automatically unlocked", available: true },
      ],
      action: () => handleSubscribe(PLAN_PREMIUM),
    },
  ];

  return (
    <Page
      title="Pricing Plans"
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <Layout>
        {fetcher.data?.error && (
          <Layout.Section>
            <Banner tone="critical" title="Billing Action Failed">
              <BlockStack gap="200">
                <Text as="p">{fetcher.data.error}</Text>
                {fetcher.data.errorDetails && fetcher.data.errorDetails.length > 0 && (
                  <pre style={{ background: "#f4f6f8", padding: "12px", borderRadius: "4px", overflowX: "auto", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(fetcher.data.errorDetails, null, 2)}
                  </pre>
                )}
              </BlockStack>
            </Banner>
          </Layout.Section>
        )}


        <Layout.Section>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              paddingBottom: "40px",
            }}
          >
            {plans.map((planItem) => {
              const isActive = activePlan === planItem.name;
              const isSubmittingThis = 
                (navigation.state === "submitting" && 
                 navigation.formData?.get("intent") === "subscribe" && 
                 navigation.formData?.get("planName") === planItem.name) ||
                (fetcher.state === "submitting" && 
                 fetcher.formData?.get("intent") === "subscribe" && 
                 fetcher.formData?.get("planName") === planItem.name);

              const isFree = planItem.name === "FREE";
              const isPremium = planItem.name === PLAN_PREMIUM;
              const isPro = planItem.name === PLAN_PRO;
              const isStarter = planItem.name === PLAN_STARTER;

              let cardBg = "#ffffff";
              let cardTextColor = "#1e293b";
              let cardSubtextColor = "#64748b";
              let dividerColor = "#e1e3e5";
              let featureTextColor = (available) => available ? "#cbd5e1" : "rgba(255,255,255,0.35)";
              let cardShadow = "0 4px 12px rgba(0, 0, 0, 0.02)";
              let cardBorder = "1px solid #e1e3e5";
              let buttonBg = "#0f172a";
              let buttonTextColor = "#ffffff";

              if (isFree) {
                cardBg = "linear-gradient(135deg, #0f172a 0%, #334155 100%)";
                cardTextColor = "#ffffff";
                cardSubtextColor = "#cbd5e1";
                dividerColor = "rgba(255,255,255,0.12)";
                cardShadow = "0 10px 30px rgba(0, 0, 0, 0.15)";
                cardBorder = "none";
                buttonBg = "#ffffff";
                buttonTextColor = "#0f172a";
              } else if (isStarter) {
                cardBg = "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)";
                cardTextColor = "#ffffff";
                cardSubtextColor = "#93c5fd";
                dividerColor = "rgba(255,255,255,0.15)";
                cardShadow = "0 10px 30px rgba(29, 78, 216, 0.2)";
                cardBorder = "none";
                buttonBg = "#ffffff";
                buttonTextColor = "#1d4ed8";
              } else if (isPro) {
                cardBg = "linear-gradient(135deg, #064e3b 0%, #059669 100%)";
                cardTextColor = "#ffffff";
                cardSubtextColor = "#a7f3d0";
                dividerColor = "rgba(255,255,255,0.15)";
                cardShadow = "0 12px 36px rgba(5, 150, 105, 0.25)";
                cardBorder = "none";
                buttonBg = "#ffffff";
                buttonTextColor = "#047857";
              } else if (isPremium) {
                cardBg = "linear-gradient(135deg, #1e1b4b 0%, #701a75 100%)";
                cardTextColor = "#ffffff";
                cardSubtextColor = "#fbcfe8";
                dividerColor = "rgba(255,255,255,0.15)";
                cardShadow = "0 12px 36px rgba(112, 26, 117, 0.3)";
                cardBorder = "none";
                buttonBg = "#ffffff";
                buttonTextColor = "#701a75";
              }

              let cardStyle = {
                borderRadius: "16px",
                background: cardBg,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "24px 20px",
                transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease",
                cursor: "pointer",
                minHeight: "480px",
                border: cardBorder,
                boxShadow: isActive ? "0 0 0 4px #008060, " + cardShadow : cardShadow,
                color: cardTextColor,
              };

              const renderButton = () => {
                if (isActive) {
                  return (
                    <button
                      disabled
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        fontSize: "13px",
                        border: "none",
                        background: "#ffffff",
                        color: isFree ? "#0f172a" : isStarter ? "#1d4ed8" : isPro ? "#059669" : "#701a75",
                        cursor: "default",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <svg style={{ width: "14px", height: "14px", color: isFree ? "#10b981" : "inherit" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Current Plan
                    </button>
                  );
                }

                const isDowngrade = (PLAN_TIERS[planItem.name] || 0) < (PLAN_TIERS[activePlan] || 0);

                if (isDowngrade) {
                  if (planItem.name === "FREE") {
                    const isSubmittingCancel = 
                      (navigation.state === "submitting" && navigation.formData?.get("intent") === "cancel") ||
                      (fetcher.state === "submitting" && fetcher.formData?.get("intent") === "cancel");

                    return (
                      <Form
                        method="POST"
                        style={{ width: "100%" }}
                        onSubmit={(e) => {
                          if (!confirm("Are you sure you want to downgrade to the Free plan? You will lose premium layouts and custom designs.")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="intent" value="cancel" />
                        <button
                          type="submit"
                          disabled={isSubmittingCancel}
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            fontSize: "13px",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            background: buttonBg,
                            color: buttonTextColor,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.03)";
                            e.currentTarget.style.filter = "brightness(1.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.filter = "none";
                          }}
                        >
                          {isSubmittingCancel ? "Downgrading..." : "Downgrade to Free"}
                        </button>
                      </Form>
                    );
                  } else {
                    return (
                      <Form
                        method="POST"
                        style={{ width: "100%" }}
                        onSubmit={(e) => {
                          if (!confirm(`Are you sure you want to downgrade to the ${planItem.name} plan?`)) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="intent" value="subscribe" />
                        <input type="hidden" name="planName" value={planItem.name} />
                        <button
                          type="submit"
                          disabled={isSubmittingThis}
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            fontSize: "13px",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            background: buttonBg,
                            color: buttonTextColor,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.03)";
                            e.currentTarget.style.filter = "brightness(1.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.filter = "none";
                          }}
                        >
                          {isSubmittingThis ? "Downgrading..." : `Downgrade to ${planItem.name}`}
                        </button>
                      </Form>
                    );
                  }
                }

                // Upgrade state
                return (
                  <Form method="POST" style={{ width: "100%" }}>
                    <input type="hidden" name="intent" value="subscribe" />
                    <input type="hidden" name="planName" value={planItem.name} />
                    <button
                      type="submit"
                      disabled={isSubmittingThis}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        fontSize: "13px",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        background: buttonBg,
                        color: buttonTextColor,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.03)";
                        e.currentTarget.style.filter = "brightness(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.filter = "none";
                      }}
                    >
                      {isSubmittingThis ? "Processing..." : `Upgrade to ${planItem.name}`}
                    </button>
                  </Form>
                );
              };

              return (
                <div
                  key={planItem.name}
                  style={cardStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    if (isFree) {
                      e.currentTarget.style.boxShadow = "0 12px 28px rgba(0, 0, 0, 0.2)";
                    } else if (isStarter) {
                      e.currentTarget.style.boxShadow = "0 16px 40px rgba(29, 78, 216, 0.4)";
                    } else if (isPro) {
                      e.currentTarget.style.boxShadow = "0 16px 40px rgba(5, 150, 105, 0.45)";
                    } else if (isPremium) {
                      e.currentTarget.style.boxShadow = "0 16px 40px rgba(112, 26, 117, 0.5)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    if (isFree) {
                      e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.15)";
                    } else if (isStarter) {
                      e.currentTarget.style.boxShadow = "0 10px 30px rgba(29, 78, 216, 0.2)";
                    } else if (isPro) {
                      e.currentTarget.style.boxShadow = "0 10px 30px rgba(5, 150, 105, 0.25)";
                    } else if (isPremium) {
                      e.currentTarget.style.boxShadow = "0 10px 30px rgba(112, 26, 117, 0.3)";
                    }
                  }}
                >
                  {!isActive && planItem.recommended && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-12px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "linear-gradient(135deg, #ff9f43, #ff5252)",
                        color: "#ffffff",
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: "bold",
                        letterSpacing: "0.5px",
                        boxShadow: "0 4px 10px rgba(255, 82, 82, 0.3)",
                      }}
                    >
                      RECOMMENDED
                    </div>
                  )}

                  {!isActive && isPremium && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-12px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "linear-gradient(135deg, #ffe259, #ffa751)",
                        color: "#0f172a",
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: "bold",
                        letterSpacing: "0.5px",
                        boxShadow: "0 4px 10px rgba(255, 167, 81, 0.3)",
                      }}
                    >
                      ULTIMATE
                    </div>
                  )}


                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                        <span>{planItem.name}</span>
                        {isActive && (
                          <span style={{ fontSize: "9px", fontWeight: "bold", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.4)", textTransform: "none", color: "#ffffff" }}>
                            Active
                          </span>
                        )}
                      </span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                        <span style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px" }}>
                          {planItem.price}
                        </span>
                        {planItem.period && (
                          <span style={{ fontSize: "11px", color: cardSubtextColor }}>
                            {planItem.period}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "11px", color: cardSubtextColor, minHeight: "32px", display: "block", lineHeight: "1.3" }}>
                        {planItem.description}
                      </span>
                    </div>

                    <div style={{ borderTop: `1px solid ${dividerColor}`, margin: "4px 0" }} />

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {planItem.features.map((feature, fIdx) => (
                        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", lineHeight: "1.4" }} key={fIdx}>
                          <div style={{ display: "flex", alignItems: "center", height: "18px", flexShrink: 0 }}>
                            {feature.available ? <CheckSvg /> : <CrossSvg />}
                          </div>
                          <span
                            style={{
                              fontSize: "11px",
                              lineHeight: "18px",
                              color: featureTextColor(feature.available),
                              fontWeight: feature.available ? "500" : "400",
                              textAlign: "left",
                            }}
                          >
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    {renderButton()}
                  </div>
                </div>
              );
            })}
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
