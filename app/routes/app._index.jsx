import { useEffect, useRef } from "react";
import { useLoaderData, useNavigate, useFetcher, Link, redirect } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  Badge,
  Button,
  ButtonGroup,
  EmptyState,
  Banner,
  Box,
  InlineStack,
  BlockStack,
} from "@shopify/polaris";
import prisma from "../db.server";
import { authenticate, isTestMode } from "../shopify.server";
import { PLAN_STARTER, PLAN_PRO, PLAN_PREMIUM } from "../constants";
import { syncGalleryToShopify, deleteGalleryFromShopify } from "../shopify.server.helpers";
import { boundary } from "@shopify/shopify-app-react-router/server";
export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = session.shop;

  // Check current billing plan
  const billingCheck = await billing.check({
    plans: [PLAN_STARTER, PLAN_PRO, PLAN_PREMIUM],
    isTest: isTestMode,
  });

  let plan = "FREE";
  if (billingCheck.hasActivePayment && billingCheck.appSubscriptions?.length > 0) {
    plan = billingCheck.appSubscriptions[0].name;
  }

  // Auto-migrate relative local paths and old tunnel domains to absolute URLs using current SHOPIFY_APP_URL
  const appUrl = (process.env.SHOPIFY_APP_URL || "").replace(/\/$/, "");
  const allImages = await prisma.galleryImage.findMany();
  const updatedGalleryIds = new Set();
  let migrationNeeded = false;

  for (const img of allImages) {
    let newUrl = img.image;
    if (img.image.startsWith("/uploads/")) {
      newUrl = `${appUrl}${img.image}`;
    } else if (img.image.includes("/uploads/")) {
      const parts = img.image.split("/uploads/");
      const pathPart = "/uploads/" + parts[parts.length - 1];
      const expectedUrl = `${appUrl}${pathPart}`;
      if (img.image !== expectedUrl) {
        newUrl = expectedUrl;
      }
    }

    if (newUrl !== img.image) {
      migrationNeeded = true;
      await prisma.galleryImage.update({
        where: { id: img.id },
        data: { image: newUrl },
      });
      updatedGalleryIds.add(img.galleryId);
    }
  }

  if (migrationNeeded) {
    // Sync updated paths to Shopify Metaobjects
    const { admin } = await authenticate.admin(request);
    if (admin) {
      for (const galleryId of updatedGalleryIds) {
        const gal = await prisma.gallery.findUnique({
          where: { id: galleryId },
          include: { images: { orderBy: { position: "asc" } } },
        });
        if (gal) {
          await syncGalleryToShopify(admin, gal, gal.images);
        }
      }
    }
  }

  const galleries = await prisma.gallery.findMany({
    where: { shop },
    include: {
      images: {
        orderBy: { position: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return { galleries, plan, shop };
};

export const action = async ({ request }) => {
  const { admin, session, billing } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  const billingCheck = await billing.check({
    plans: [PLAN_STARTER, PLAN_PRO, PLAN_PREMIUM],
    isTest: isTestMode,
  });

  let activePlan = "FREE";
  if (billingCheck.hasActivePayment && billingCheck.appSubscriptions?.length > 0) {
    activePlan = billingCheck.appSubscriptions[0].name;
  }

  if (intent === "create") {
    const galleryCount = await prisma.gallery.count({ where: { shop } });
    
    // Check plan limits
    if (activePlan === "FREE" && galleryCount >= 1) {
      // In free plan, limit to 1 gallery
      return { error: "Free plan is limited to 1 gallery. Please upgrade to create more." };
    } else if (activePlan === PLAN_STARTER && galleryCount >= 3) {
      // In starter plan, limit to 3 galleries
      return { error: "Starter plan is limited to 3 galleries. Please upgrade to create more." };
    }

    const gallery = await prisma.gallery.create({
      data: {
        shop,
        title: "My Gallery Studio",
        layout: "grid",
        plan: activePlan,
        settings: JSON.stringify({
          columnsDesktop: 4,
          columnsTablet: 2,
          columnsMobile: 1,
          gap: 16,
          padding: 16,
          sectionWidth: "1200px",
          borderRadius: 8,
          shadow: "none",
          hoverZoom: true,
          hoverOverlay: true,
          animation: "fade",
          lazyLoad: true,
          headingAlignment: "center",
          backgroundColor: "#ffffff",
          textColor: "#1a1a1a",
          buttonStyle: "primary",
          imageRatio: "1:1",
        }),
      },
    });

    // Create entry in Shopify metaobjects
    await syncGalleryToShopify(admin, gallery, []);

    return redirect(`/app/galleries/${gallery.id}`);
  }

  if (intent === "delete") {
    const id = formData.get("id");
    await prisma.gallery.delete({ where: { id } });
    await deleteGalleryFromShopify(admin, id);
    return { success: true, deleted: true };
  }

  if (intent === "duplicate") {
    const id = formData.get("id");
    const original = await prisma.gallery.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!original) {
      return { error: "Gallery not found" };
    }

    const galleryCount = await prisma.gallery.count({ where: { shop } });
    if (activePlan === "FREE" && galleryCount >= 1) {
      return { error: "Free plan is limited to 1 gallery. Please upgrade to create more." };
    } else if (activePlan === PLAN_STARTER && galleryCount >= 3) {
      return { error: "Starter plan is limited to 3 galleries. Please upgrade to create more." };
    }

    const duplicated = await prisma.gallery.create({
      data: {
        shop,
        title: `${original.title} (Copy)`,
        subtitle: original.subtitle,
        buttonText: original.buttonText,
        buttonLink: original.buttonLink,
        layout: original.layout,
        plan: activePlan,
        settings: original.settings,
        images: {
          create: original.images.map((img) => ({
            image: img.image,
            alt: img.alt,
            position: img.position,
          })),
        },
      },
      include: { images: true },
    });

    await syncGalleryToShopify(admin, duplicated, duplicated.images);
    return { success: true, duplicated: true };
  }

  return null;
};

export default function Dashboard() {
  const { galleries, plan } = useLoaderData();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const handleCreate = () => {
    fetcher.submit({ intent: "create" }, { method: "POST" });
  };

  const handleDuplicate = (id) => {
    fetcher.submit({ intent: "duplicate", id }, { method: "POST" });
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this gallery? This will remove it from your online store.")) {
      fetcher.submit({ intent: "delete", id }, { method: "POST" });
    }
  };

  const totalImages = galleries.reduce((acc, g) => acc + (g.images?.length || 0), 0);
  const errorMessage = fetcher.data?.error;
  const prevFetcherState = useRef("idle");

  useEffect(() => {
    if (fetcher.state === "idle" && prevFetcherState.current !== "idle") {
      if (fetcher.data?.error) {
        if (typeof shopify !== "undefined" && shopify.toast) {
          shopify.toast.show(fetcher.data.error, { isError: true });
        } else {
          alert(fetcher.data.error);
        }
      } else if (fetcher.data?.success) {
        if (fetcher.data.duplicated) {
          if (typeof shopify !== "undefined" && shopify.toast) {
            shopify.toast.show("Gallery duplicated successfully!");
          }
        } else if (fetcher.data.deleted) {
          if (typeof shopify !== "undefined" && shopify.toast) {
            shopify.toast.show("Gallery deleted successfully!");
          }
        }
      }
    }
    prevFetcherState.current = fetcher.state;
  }, [fetcher.state, fetcher.data]);

  return (
    <Page
      title="Gallery Studio"
      subtitle="Create and customize premium image galleries for your Shopify storefront."
      primaryAction={
        <Button variant="primary" onClick={handleCreate} loading={fetcher.state === "submitting" && fetcher.formData?.get("intent") === "create"}>
          Create New Gallery
        </Button>
      }
    >
      <Layout>
        {/* Top Active Plan Bar */}
        <Layout.Section>
          <div
            style={{
              background: plan === "FREE" 
                ? "linear-gradient(135deg, #0f172a 0%, #334155 100%)" // Dark slate for Free
                : plan === PLAN_STARTER 
                ? "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)" // Royal blue for Starter
                : plan === PLAN_PRO 
                ? "linear-gradient(135deg, #064e3b 0%, #059669 100%)" // Emerald green for Pro
                : "linear-gradient(135deg, #1e1b4b 0%, #701a75 100%)", // Cosmic violet for Premium
              color: "#ffffff",
              padding: "12px 20px",
              borderRadius: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              marginBottom: "4px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px" }}>🚀</span>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>
                Active Plan: <span style={{ textTransform: "uppercase", letterSpacing: "0.5px", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "6px", marginLeft: "4px" }}>{plan}</span>
              </span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", marginLeft: "8px" }}>
                {plan === "FREE" 
                  ? "Limited to 1 Gallery & 8 Images. Upgrade to unlock full potential!"
                  : plan === PLAN_STARTER 
                  ? "Enjoy up to 3 Galleries, 20 Images, and 5 layout themes with no branding."
                  : plan === PLAN_PRO 
                  ? "Enjoy Unlimited Galleries & Images, 8 layout themes, and custom designs!"
                  : "Enjoy all 10 Premium Layouts, unlimited galleries, and lifetime updates!"}
              </span>
            </div>
            <button
              onClick={() => navigate("/app/billing")}
              style={{
                background: "#ffffff",
                color: plan === "FREE" ? "#0f172a" : plan === PLAN_STARTER ? "#1d4ed8" : plan === PLAN_PRO ? "#047857" : "#701a75",
                border: "none",
                padding: "6px 16px",
                borderRadius: "6px",
                fontWeight: "bold",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {plan === "FREE" ? "Upgrade Plan" : "Manage Subscription"}
            </button>
          </div>
        </Layout.Section>
        {errorMessage && (
          <Layout.Section>
            <Banner tone="critical" title="Limit Reached">
              <p>{errorMessage}</p>
              <Box paddingBlockStart="200">
                <Button onClick={() => navigate("/app/billing")} variant="secondary">
                  Upgrade Plan
                </Button>
              </Box>
            </Banner>
          </Layout.Section>
        )}

        {/* Premium Welcome Banner & Metrics Header */}
        <Layout.Section>
          <div
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "#ffffff",
              padding: "28px",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              marginBottom: "12px"
            }}
          >
            <BlockStack gap="400">
              <BlockStack gap="100">
                <Text variant="headingXl" as="h1" tone="neutral">
                  Elevate Your Storefront Visuals
                </Text>
                <span style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.5" }}>
                  Natively display responsive image grids, lookbooks, masonry grids, and slideshow sliders inside Shopify Online Store 2.0 theme editor.
                </span>
              </BlockStack>
              
              <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.15)", width: "100%" }} />
              
              {/* Modern Stat Boxes */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "16px",
                  marginTop: "8px"
                }}
              >
                <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <BlockStack gap="100">
                    <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "500" }}>Active Galleries</span>
                    <Text variant="headingLg" as="p" tone="neutral">{galleries.length}</Text>
                  </BlockStack>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <BlockStack gap="100">
                    <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "500" }}>Total Images</span>
                    <Text variant="headingLg" as="p" tone="neutral">{totalImages}</Text>
                  </BlockStack>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <BlockStack gap="100">
                    <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "500" }}>Current Plan Tier</span>
                    <InlineStack gap="200" blockAlign="center">
                      <span style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>{plan}</span>
                      <Button size="micro" onClick={() => navigate("/app/billing")} variant="secondary">
                        Manage
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </div>
              </div>
            </BlockStack>
          </div>
        </Layout.Section>

        {/* Galleries Section */}
        <Layout.Section>
          {galleries.length === 0 ? (
            <EmptyState
              heading="Create your first gallery"
              action={{
                content: "Create Gallery",
                onAction: handleCreate,
                loading: fetcher.state === "submitting" && fetcher.formData?.get("intent") === "create",
              }}
              secondaryAction={{
                content: "Pricing Plans",
                onAction: () => navigate("/app/billing"),
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Upload your images, select from 10 premium layout designs, and add stunning grids to your storefront natively using Theme App Blocks.</p>
            </EmptyState>
          ) : (
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Your Photo Galleries
              </Text>
              
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
                  gap: "24px",
                  marginTop: "8px"
                }}
              >
                {galleries.map((item) => {
                  const id = item.id;
                  const title = item.title;
                  const subtitle = item.subtitle;
                  const imagesCount = item.images?.length || 0;
                  const layoutName = item.layout.charAt(0).toUpperCase() + item.layout.slice(1);
                  const updatedStr = new Date(item.updatedAt).toLocaleDateString("en-US");
                  const firstImages = item.images?.slice(0, 4) || [];

                  return (
                    <div
                      key={id}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e1e3e5",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                        padding: "20px",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)";
                      }}
                    >
                      {/* Visual Cover Preview */}
                      <div
                        style={{
                          height: "160px",
                          borderRadius: "8px",
                          background: firstImages.length > 0
                            ? "#f6f6f7"
                            : "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          position: "relative",
                          border: "1px solid #e1e3e5",
                        }}
                      >
                        {firstImages.length > 0 ? (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: firstImages.length >= 4 ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(60px, 1fr))",
                              gap: "4px",
                              width: "100%",
                              height: "100%",
                              padding: "4px",
                            }}
                          >
                            {firstImages.map((img, idx) => (
                              <img
                                key={idx}
                                src={img.image}
                                alt=""
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  borderRadius: "6px",
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: "center", color: "#ffffff" }}>
                            <span style={{ fontSize: "40px" }}>🖼️</span>
                            <div style={{ fontSize: "13px", marginTop: "6px", fontWeight: "600", color: "rgba(255,255,255,0.9)" }}>
                              No images uploaded
                            </div>
                          </div>
                        )}
                        <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                          <Badge
                            tone={
                              item.layout === "grid" ? "info" :
                              item.layout === "slider" ? "success" :
                              item.layout === "masonry" ? "warning" : "attention"
                            }
                          >
                            {layoutName}
                          </Badge>
                        </div>
                      </div>

                      {/* Detail Info */}
                      <BlockStack gap="100">
                        <Text variant="headingMd" as="h3" truncate>
                          {title}
                        </Text>
                        <Text variant="bodySm" tone="subdued" truncate>
                          {subtitle || "No subtitle configured"}
                        </Text>
                        <InlineStack gap="200" blockAlign="center">
                          <Badge tone="info">{imagesCount} image{imagesCount === 1 ? "" : "s"}</Badge>
                          <Text variant="bodyXs" tone="subdued">
                            Updated {updatedStr}
                          </Text>
                        </InlineStack>
                      </BlockStack>

                      {/* Block Handle Selector */}
                      <div
                        style={{
                          padding: "12px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "8px",
                          border: "1px dashed #cbd5e1",
                        }}
                      >
                        <BlockStack gap="100">
                          <Text variant="bodyXs" fontWeight="bold" tone="subdued">
                            Theme App Block ID:
                          </Text>
                          <InlineStack align="space-between" blockAlign="center">
                            <code style={{ fontSize: "11px", fontWeight: "bold", color: "#0f172a" }}>
                              gallery-{id}
                            </code>
                            <Button
                              size="micro"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(`gallery-${id}`);
                                if (typeof shopify !== "undefined" && shopify.toast) {
                                  shopify.toast.show("App Block ID copied!");
                                } else {
                                  alert("Copied to clipboard: gallery-" + id);
                                }
                              }}
                            >
                              Copy ID
                            </Button>
                          </InlineStack>
                        </BlockStack>
                      </div>

                      <div style={{ height: "1px", backgroundColor: "#e1e3e5", margin: "4px 0" }} />

                      {/* Actions */}
                      <InlineStack align="space-between" blockAlign="center">
                        <Button variant="primary" onClick={() => navigate(`/app/galleries/${id}`)}>
                          Edit
                        </Button>
                        <InlineStack gap="150">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(id);
                            }}
                            loading={fetcher.state === "submitting" && fetcher.formData?.get("id") === id && fetcher.formData?.get("intent") === "duplicate"}
                          >
                            Duplicate
                          </Button>
                          <Button
                            tone="critical"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(id);
                            }}
                            loading={fetcher.state === "submitting" && fetcher.formData?.get("id") === id && fetcher.formData?.get("intent") === "delete"}
                          >
                            Delete
                          </Button>
                        </InlineStack>
                      </InlineStack>
                    </div>
                  );
                })}
              </div>
            </BlockStack>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
