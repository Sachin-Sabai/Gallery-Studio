import { useState, useEffect } from "react";
import { useLoaderData, useNavigate, useFetcher, redirect } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  TextField,
  Select,
  Button,
  ButtonGroup,
  Box,
  InlineStack,
  BlockStack,
  FormLayout,
  Divider,
  Icon,
  Banner,
  Collapsible,
  Checkbox,
  ColorPicker,
} from "@shopify/polaris";
import { ChevronUpIcon, ChevronDownIcon, DeleteIcon, ImageIcon, MobileIcon, TabletIcon, PlayIcon } from "@shopify/polaris-icons";
import prisma from "../db.server";
import { authenticate, isTestMode } from "../shopify.server";
import { PLAN_STARTER, PLAN_PRO, PLAN_PREMIUM } from "../constants";
import { syncGalleryToShopify } from "../shopify.server.helpers";
import { boundary } from "@shopify/shopify-app-react-router/server";
export const loader = async ({ request, params }) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = session.shop;

  const billingCheck = await billing.check({
    plans: [PLAN_STARTER, PLAN_PRO, PLAN_PREMIUM],
    isTest: isTestMode,
  });

  let plan = "FREE";
  if (billingCheck.hasActivePayment && billingCheck.appSubscriptions?.length > 0) {
    plan = billingCheck.appSubscriptions[0].name;
  }

  const gallery = await prisma.gallery.findUnique({
    where: { id: params.id },
    include: {
      images: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!gallery || gallery.shop !== shop) {
    return redirect("/app");
  }

  return { gallery, plan };
};

export const action = async ({ request, params }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  
  const title = formData.get("title");
  const subtitle = formData.get("subtitle");
  const buttonText = formData.get("buttonText");
  const buttonLink = formData.get("buttonLink");
  const layout = formData.get("layout");
  const settings = formData.get("settings");
  const imagesData = JSON.parse(formData.get("images"));

  // Start prisma transaction
  const updatedGallery = await prisma.$transaction(async (tx) => {
    // 1. Update Gallery
    const gall = await tx.gallery.update({
      where: { id: params.id },
      data: {
        title,
        subtitle,
        buttonText,
        buttonLink,
        layout,
        settings,
      },
    });

    // 2. Delete existing images
    await tx.galleryImage.deleteMany({
      where: { galleryId: params.id },
    });

    // 3. Create updated images
    const createdImages = [];
    for (let i = 0; i < imagesData.length; i++) {
      const img = imagesData[i];
      const createdImg = await tx.galleryImage.create({
        data: {
          galleryId: params.id,
          image: img.image,
          alt: img.alt || "",
          position: i,
        },
      });
      createdImages.push(createdImg);
    }

    return { gallery: gall, images: createdImages };
  });

  // Sync to Shopify Metaobjects
  await syncGalleryToShopify(admin, updatedGallery.gallery, updatedGallery.images);

  return { success: true };
};

export default function GalleryEditor() {
  const { gallery, plan } = useLoaderData();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  // State fields
  const [title, setTitle] = useState(gallery.title || "");
  const [subtitle, setSubtitle] = useState(gallery.subtitle || "");
  const [buttonText, setButtonText] = useState(gallery.buttonText || "");
  const [buttonLink, setButtonLink] = useState(gallery.buttonLink || "");
  const [layout, setLayout] = useState(gallery.layout || "grid");

  // Parse default settings
  const defaultSettings = JSON.parse(gallery.settings || "{}");
  const [columnsDesktop, setColumnsDesktop] = useState(defaultSettings.columnsDesktop || 4);
  const [columnsTablet, setColumnsTablet] = useState(defaultSettings.columnsTablet || 2);
  const [columnsMobile, setColumnsMobile] = useState(defaultSettings.columnsMobile || 1);
  const [gap, setGap] = useState(defaultSettings.gap || 16);
  const [sectionWidth, setSectionWidth] = useState(defaultSettings.sectionWidth || "1200px");
  const [padding, setPadding] = useState(defaultSettings.padding || 16);
  const [borderRadius, setBorderRadius] = useState(defaultSettings.borderRadius || 8);
  const [shadow, setShadow] = useState(defaultSettings.shadow || "none");
  const [hoverZoom, setHoverZoom] = useState(defaultSettings.hoverZoom ?? true);
  const [hoverOverlay, setHoverOverlay] = useState(defaultSettings.hoverOverlay ?? true);
  const [animation, setAnimation] = useState(defaultSettings.animation || "fade");
  const [lazyLoad, setLazyLoad] = useState(defaultSettings.lazyLoad ?? true);
  const [headingAlignment, setHeadingAlignment] = useState(defaultSettings.headingAlignment || "center");
  const [backgroundColor, setBackgroundColor] = useState(defaultSettings.backgroundColor || "#ffffff");
  const [textColor, setTextColor] = useState(defaultSettings.textColor || "#1a1a1a");
  const [buttonStyle, setButtonStyle] = useState(defaultSettings.buttonStyle || "primary");
  const [imageRatio, setImageRatio] = useState(defaultSettings.imageRatio || "1:1");

  // Local images state
  const [images, setImages] = useState(gallery.images || []);

  // UI state
  const [previewMode, setPreviewMode] = useState("desktop"); // desktop, tablet, mobile
  const [openSection, setOpenSection] = useState("layout"); // layout, styling, effects, text

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const maxImagesLimit = plan === "FREE" ? 8 : plan === PLAN_STARTER ? 20 : Infinity;

  // Reordering functions
  const moveImage = (index, direction) => {
    const newImages = [...images];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    newImages.forEach((img, idx) => {
      img.position = idx;
    });
    setImages(newImages);
  };

  const deleteImage = (index) => {
    const newImages = images.filter((_, idx) => idx !== index);
    newImages.forEach((img, idx) => {
      img.position = idx;
    });
    setImages(newImages);
  };

  const handleAltChange = (index, val) => {
    const newImages = [...images];
    newImages[index].alt = val;
    setImages(newImages);
  };

  // Image upload handler
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImagesLimit) {
      setUploadError(`Upload limit reached. Your current plan (${plan}) allows a maximum of ${maxImagesLimit} images.`);
      return;
    }

    setUploading(true);
    setUploadError("");

    for (let file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.url) {
          const newImg = {
            id: `temp-${Date.now()}-${Math.random()}`,
            image: data.url,
            alt: "",
            position: images.length,
          };
          setImages((prev) => [...prev, newImg]);
        } else if (data.error) {
          setUploadError(data.error);
        }
      } catch (err) {
        console.error("Upload error:", err);
        setUploadError("Image upload failed. Storing locally as fallback.");
      }
    }
    setUploading(false);
  };

  // Save handler
  const handleSave = () => {
    const settingsObj = {
      columnsDesktop,
      columnsTablet,
      columnsMobile,
      gap,
      sectionWidth,
      padding,
      borderRadius,
      shadow,
      hoverZoom,
      hoverOverlay,
      animation,
      lazyLoad,
      headingAlignment,
      backgroundColor,
      textColor,
      buttonStyle,
      imageRatio,
    };

    fetcher.submit(
      {
        title,
        subtitle,
        buttonText,
        buttonLink,
        layout,
        settings: JSON.stringify(settingsObj),
        images: JSON.stringify(images),
      },
      { method: "POST" }
    );
  };

  // Enforce layout limits based on plans
  const availableLayouts = [
    { label: "Classic Grid", value: "grid", plan: "FREE" },
    { label: "Simple Slider", value: "slider", plan: "FREE" },
    { label: "Rounded Cards", value: "rounded", plan: "Starter" },
    { label: "Luxury Masonry", value: "masonry", plan: "Starter" },
    { label: "Editorial Grid", value: "editorial", plan: "Starter" },
    { label: "Magazine Gallery", value: "magazine", plan: "Pro" },
    { label: "Stack Layout", value: "stack", plan: "Pro" },
    { label: "Hover Reveal", value: "reveal", plan: "Pro" },
    { label: "Split Gallery", value: "split", plan: "Premium" },
    { label: "Luxury Showcase", value: "showcase", plan: "Premium" },
  ];

  const getPlanRank = (p) => {
    if (p === "Premium") return 4;
    if (p === "Pro") return 3;
    if (p === "Starter") return 2;
    return 1;
  };

  const isLayoutAllowed = (layoutPlan) => {
    return getPlanRank(plan) >= getPlanRank(layoutPlan);
  };

  const layoutOptions = availableLayouts.map((l) => {
    const allowed = isLayoutAllowed(l.plan);
    return {
      label: allowed ? l.label : `${l.label} (${l.plan} Plan Only)`,
      value: l.value,
      disabled: !allowed,
    };
  });

  return (
    <Page
      title={`Edit Gallery: ${title || "Untitled"}`}
      backAction={{ content: "Dashboard", url: "/app" }}
      primaryAction={
        <Button variant="primary" onClick={handleSave} loading={fetcher.state === "submitting"}>
          Save Gallery
        </Button>
      }
    >
      <Layout>
        {fetcher.data?.success && (
          <Layout.Section>
            <Banner tone="success" title="Gallery Saved" onDismiss={() => {}}>
              <p>Your storefront gallery has been updated and synced to your Shopify store.</p>
            </Banner>
          </Layout.Section>
        )}

        {uploadError && (
          <Layout.Section>
            <Banner tone="critical" title="Upload Alert" onDismiss={() => setUploadError("")}>
              <p>{uploadError}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            {/* Basic Content */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  Gallery Details
                </Text>
                <FormLayout>
                  <TextField label="Gallery Title" value={title} onChange={setTitle} autocomplete="off" />
                  <TextField label="Gallery Subtitle" value={subtitle} onChange={setSubtitle} multiline={2} autocomplete="off" />
                  <TextField label="Button Text" value={buttonText} onChange={setButtonText} placeholder="e.g. Shop Collection" autocomplete="off" />
                  <TextField label="Button Link" value={buttonLink} onChange={setButtonLink} placeholder="e.g. /collections/all" autocomplete="off" />
                </FormLayout>
              </BlockStack>
            </Card>

            {/* Design & Settings Drawer */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h3">
                  Design & Styling Settings
                </Text>
                
                <Select
                  label="Select Gallery Design Layout"
                  options={layoutOptions}
                  value={layout}
                  onChange={(val) => {
                    if (isLayoutAllowed(availableLayouts.find(l => l.value === val).plan)) {
                      setLayout(val);
                    }
                  }}
                />

                <Divider />

                {/* Collapsible settings block */}
                <BlockStack gap="200">
                  <Button
                    onClick={() => setOpenSection(openSection === "layout" ? "" : "layout")}
                    ariaExpanded={openSection === "layout"}
                    variant="plain"
                    textAlign="left"
                    fullWidth
                  >
                    <InlineStack align="space-between">
                      <Text variant="bodyMd" fontWeight="semibold">Layout & Responsive Columns</Text>
                      <Text variant="bodyMd">{openSection === "layout" ? "▲" : "▼"}</Text>
                    </InlineStack>
                  </Button>
                  <Collapsible id="layout-settings" open={openSection === "layout"}>
                    <Box padding="200">
                      <FormLayout>
                        <Select
                          label="Columns on Desktop"
                          options={[
                            { label: "1 Column", value: "1" },
                            { label: "2 Columns", value: "2" },
                            { label: "3 Columns", value: "3" },
                            { label: "4 Columns", value: "4" },
                            { label: "5 Columns", value: "5" },
                            { label: "6 Columns", value: "6" },
                          ]}
                          value={String(columnsDesktop)}
                          onChange={(val) => setColumnsDesktop(Number(val))}
                        />
                        <Select
                          label="Columns on Tablet"
                          options={[
                            { label: "1 Column", value: "1" },
                            { label: "2 Columns", value: "2" },
                            { label: "3 Columns", value: "3" },
                            { label: "4 Columns", value: "4" },
                          ]}
                          value={String(columnsTablet)}
                          onChange={(val) => setColumnsTablet(Number(val))}
                        />
                        <Select
                          label="Columns on Mobile"
                          options={[
                            { label: "1 Column", value: "1" },
                            { label: "2 Columns", value: "2" },
                          ]}
                          value={String(columnsMobile)}
                          onChange={(val) => setColumnsMobile(Number(val))}
                        />
                        <Select
                          label="Grid Gap"
                          options={[
                            { label: "0px (None)", value: "0" },
                            { label: "8px (Extra Small)", value: "8" },
                            { label: "16px (Small)", value: "16" },
                            { label: "24px (Medium)", value: "24" },
                            { label: "32px (Large)", value: "32" },
                          ]}
                          value={String(gap)}
                          onChange={(val) => setGap(Number(val))}
                        />
                        <Select
                          label="Section Width"
                          options={[
                            { label: "Full Width", value: "100%" },
                            { label: "1400px (Extra Large)", value: "1400px" },
                            { label: "1200px (Large)", value: "1200px" },
                            { label: "1000px (Medium)", value: "1000px" },
                            { label: "800px (Small)", value: "800px" },
                          ]}
                          value={String(sectionWidth)}
                          onChange={setSectionWidth}
                        />
                      </FormLayout>
                    </Box>
                  </Collapsible>

                  <Divider />

                  <Button
                    onClick={() => setOpenSection(openSection === "styling" ? "" : "styling")}
                    ariaExpanded={openSection === "styling"}
                    variant="plain"
                    textAlign="left"
                    fullWidth
                  >
                    <InlineStack align="space-between">
                      <Text variant="bodyMd" fontWeight="semibold">Cards & Theme Styling</Text>
                      <Text variant="bodyMd">{openSection === "styling" ? "▲" : "▼"}</Text>
                    </InlineStack>
                  </Button>
                  <Collapsible id="styling-settings" open={openSection === "styling"}>
                    <Box padding="200">
                      <FormLayout>
                        <Select
                          label="Image Aspect Ratio"
                          options={[
                            { label: "Square (1:1)", value: "1:1" },
                            { label: "Standard (4:3)", value: "4:3" },
                            { label: "Widescreen (16:9)", value: "16:9" },
                            { label: "Tall (3:4)", value: "3:4" },
                            { label: "Original (Auto)", value: "auto" },
                          ]}
                          value={imageRatio}
                          onChange={setImageRatio}
                        />
                        <Select
                          label="Image Corner Roundedness"
                          options={[
                            { label: "0px (Sharp)", value: "0" },
                            { label: "4px (Slight)", value: "4" },
                            { label: "8px (Soft)", value: "8" },
                            { label: "16px (Card)", value: "16" },
                            { label: "24px (Highly Rounded)", value: "24" },
                            { label: "999px (Circular)", value: "999" },
                          ]}
                          value={String(borderRadius)}
                          onChange={(val) => setBorderRadius(Number(val))}
                        />
                        <Select
                          label="Card Shadow Effect"
                          options={[
                            { label: "No Shadow", value: "none" },
                            { label: "Soft Glow", value: "soft" },
                            { label: "Hard shadow", value: "hard" },
                          ]}
                          value={shadow}
                          onChange={setShadow}
                        />
                        <TextField label="Background Color (Hex)" value={backgroundColor} onChange={setBackgroundColor} autocomplete="off" />
                        <TextField label="Text Color (Hex)" value={textColor} onChange={setTextColor} autocomplete="off" />
                        <Select
                          label="Button Style"
                          options={[
                            { label: "Solid Color Filled", value: "primary" },
                            { label: "Outline / Transparent", value: "secondary" },
                          ]}
                          value={buttonStyle}
                          onChange={setButtonStyle}
                        />
                      </FormLayout>
                    </Box>
                  </Collapsible>

                  <Divider />

                  <Button
                    onClick={() => setOpenSection(openSection === "effects" ? "" : "effects")}
                    ariaExpanded={openSection === "effects"}
                    variant="plain"
                    textAlign="left"
                    fullWidth
                  >
                    <InlineStack align="space-between">
                      <Text variant="bodyMd" fontWeight="semibold">Hover Effects & Animations</Text>
                      <Text variant="bodyMd">{openSection === "effects" ? "▲" : "▼"}</Text>
                    </InlineStack>
                  </Button>
                  <Collapsible id="effects-settings" open={openSection === "effects"}>
                    <Box padding="200">
                      <FormLayout>
                        <Checkbox label="Enable Image Zoom on Hover" checked={hoverZoom} onChange={setHoverZoom} />
                        <Checkbox label="Enable Overlay Dimming on Hover" checked={hoverOverlay} onChange={setHoverOverlay} />
                        <Select
                          label="Entrance Animation"
                          options={[
                            { label: "None / Instant", value: "none" },
                            { label: "Fade In", value: "fade" },
                            { label: "Zoom In / Scale", value: "scale" },
                            { label: "Slide Up", value: "slide" },
                          ]}
                          value={animation}
                          onChange={setAnimation}
                        />
                        <Checkbox label="Lazy Load Images" checked={lazyLoad} onChange={setLazyLoad} />
                      </FormLayout>
                    </Box>
                  </Collapsible>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        {/* Middle and Right Previews */}
        <Layout.Section>
          <BlockStack gap="400">
            {/* Image Manager Panel */}
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h3">
                    Images ({images.length} / {maxImagesLimit === Infinity ? "Unlimited" : maxImagesLimit})
                  </Text>
                  <div>
                    <label style={{ display: "inline-block", padding: "6px 12px", background: "#008060", color: "#ffffff", borderRadius: "4px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}>
                      Upload Images
                      <input type="file" multiple accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} disabled={uploading} />
                    </label>
                  </div>
                </InlineStack>

                {uploading && (
                  <Banner title="Uploading your images..." tone="info">
                    <p>Registering files directly with Shopify CDN. Please wait...</p>
                  </Banner>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                  {images.length === 0 ? (
                    <Box padding="400" borderStyle="dashed" borderWidth="1" borderRadius="200" borderColor="border" textAlign="center">
                      <Text variant="bodyMd" tone="subdued">No images uploaded yet. Upload images to populate your gallery.</Text>
                    </Box>
                  ) : (
                    images.map((img, index) => (
                      <div
                        key={img.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px",
                          border: "1px solid #e1e3e5",
                          borderRadius: "6px",
                          background: "#fafbfb",
                        }}
                      >
                        <img src={img.image} alt={img.alt || ""} style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }} />
                        <div style={{ flexGrow: 1 }}>
                          <TextField
                            label="Image Alt Description"
                            labelHidden
                            value={img.alt || ""}
                            onChange={(val) => handleAltChange(index, val)}
                            placeholder="Add Alt Text for SEO..."
                            autocomplete="off"
                          />
                        </div>
                        <ButtonGroup>
                          <Button icon={ChevronUpIcon} onClick={() => moveImage(index, "up")} disabled={index === 0} />
                          <Button icon={ChevronDownIcon} onClick={() => moveImage(index, "down")} disabled={index === images.length - 1} />
                          <Button icon={DeleteIcon} tone="critical" onClick={() => deleteImage(index)} />
                        </ButtonGroup>
                      </div>
                    ))
                  )}
                </div>
              </BlockStack>
            </Card>

            {/* Premium Branding banner for Free plan */}
            {plan === "FREE" && (
              <Banner tone="attention" title="Gallery Studio branding is enabled">
                <p>A "Powered by Gallery Studio" watermark will be visible at the bottom of the storefront layout. Upgrade to remove branding.</p>
              </Banner>
            )}

            {/* Live Canvas Preview Panel */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingMd" as="h3">
                    Instant Live Preview
                  </Text>
                  <ButtonGroup variant="segmented">
                    <Button onClick={() => setPreviewMode("desktop")} pressed={previewMode === "desktop"}>Desktop</Button>
                    <Button onClick={() => setPreviewMode("tablet")} pressed={previewMode === "tablet"} icon={TabletIcon} />
                    <Button onClick={() => setPreviewMode("mobile")} pressed={previewMode === "mobile"} icon={MobileIcon} />
                  </ButtonGroup>
                </InlineStack>

                <div
                  style={{
                    background: "#f4f6f6",
                    padding: "20px",
                    display: "flex",
                    justifyContent: "center",
                    borderRadius: "6px",
                    border: "1px solid #e1e3e5",
                  }}
                >
                  <div
                    style={{
                      width: previewMode === "mobile" ? "375px" : previewMode === "tablet" ? "768px" : "100%",
                      transition: "width 0.3s ease",
                      background: backgroundColor,
                      color: textColor,
                      padding: `${padding}px`,
                      borderRadius: "6px",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                    }}
                  >
                    {/* Preview Gallery Header */}
                    {(title || subtitle) && (
                      <div style={{ textAlign: headingAlignment, marginBottom: "30px" }}>
                        {title && <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 10px 0", color: textColor }}>{title}</h2>}
                        {subtitle && <p style={{ fontSize: "16px", margin: 0, opacity: 0.8, color: textColor }}>{subtitle}</p>}
                      </div>
                    )}

                    {/* Preview Images Layout Engine */}
                    {images.length === 0 ? (
                      <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed #ccc", borderRadius: `${borderRadius}px` }}>
                        <Text variant="bodyMd" tone="subdued">Live preview will show here after uploading images</Text>
                      </div>
                    ) : (
                      renderPreviewGallery(layout, images, {
                        columnsDesktop,
                        columnsTablet,
                        columnsMobile,
                        gap,
                        borderRadius,
                        shadow,
                        hoverZoom,
                        hoverOverlay,
                        imageRatio,
                        previewMode,
                      })
                    )}

                    {/* Preview CTA Button */}
                    {buttonText && (
                      <div style={{ display: "flex", justifyContent: headingAlignment, marginTop: "30px" }}>
                        <a
                          href={buttonLink || "#"}
                          onClick={(e) => e.preventDefault()}
                          style={{
                            display: "inline-block",
                            padding: "10px 24px",
                            borderRadius: "4px",
                            textDecoration: "none",
                            fontWeight: "bold",
                            fontSize: "15px",
                            backgroundColor: buttonStyle === "primary" ? textColor : "transparent",
                            color: buttonStyle === "primary" ? backgroundColor : textColor,
                            border: buttonStyle === "secondary" ? `2px solid ${textColor}` : "none",
                          }}
                        >
                          {buttonText}
                        </a>
                      </div>
                    )}

                    {/* Branding watermark */}
                    {plan === "FREE" && (
                      <div style={{ textAlign: "center", marginTop: "24px", fontSize: "12px", opacity: 0.5, borderTop: "1px solid #ccc", paddingTop: "12px" }}>
                        Powered by <strong>Gallery Studio</strong>
                      </div>
                    )}
                  </div>
                </div>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// React Preview renderer mimicking the 10 designs
function renderPreviewGallery(layoutName, imageList, opts) {
  const { columnsDesktop, columnsTablet, columnsMobile, gap, borderRadius, shadow, hoverZoom, hoverOverlay, imageRatio, previewMode } = opts;

  // Determine actual responsive columns
  const cols = previewMode === "mobile" ? columnsMobile : previewMode === "tablet" ? columnsTablet : columnsDesktop;

  // Shadow styling
  const shadowStyle = shadow === "soft" ? "0 4px 12px rgba(0,0,0,0.08)" : shadow === "hard" ? "0 8px 0 #1a1a1a" : "none";

  // Aspect ratio helper
  const getAspectRatioString = (ratio) => {
    if (ratio === "1:1") return "1 / 1";
    if (ratio === "4:3") return "4 / 3";
    if (ratio === "16:9") return "16 / 9";
    if (ratio === "3:4") return "3 / 4";
    return "auto";
  };

  const aspect = getAspectRatioString(imageRatio);

  const containerStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: `${gap}px`,
  };

  const cardStyle = {
    position: "relative",
    overflow: "hidden",
    borderRadius: `${borderRadius}px`,
    boxShadow: shadowStyle,
    aspectRatio: aspect,
  };

  const imageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.4s ease",
  };

  if (layoutName === "slider") {
    return (
      <div style={{ display: "flex", gap: `${gap}px`, overflowX: "auto", paddingBottom: "10px" }}>
        {imageList.map((img) => (
          <div key={img.id} style={{ ...cardStyle, flex: `0 0 ${100 / cols - 1}%`, minWidth: previewMode === "mobile" ? "80%" : "250px" }}>
            <img src={img.image} alt={img.alt || ""} style={imageStyle} />
          </div>
        ))}
      </div>
    );
  }

  if (layoutName === "rounded") {
    // Large roundedness & card container style
    return (
      <div style={containerStyle}>
        {imageList.map((img) => (
          <div key={img.id} style={{ ...cardStyle, borderRadius: "20px", border: "1px solid #f0f0f0", boxShadow: "0 6px 16px rgba(0,0,0,0.06)" }}>
            <img src={img.image} alt={img.alt || ""} style={imageStyle} />
          </div>
        ))}
      </div>
    );
  }

  if (layoutName === "masonry") {
    // Simplistic CSS masonry columns
    return (
      <div style={{ columnCount: cols, columnGap: `${gap}px` }}>
        {imageList.map((img) => (
          <div key={img.id} style={{ display: "inline-block", width: "100%", marginBottom: `${gap}px`, borderRadius: `${borderRadius}px`, overflow: "hidden", boxShadow: shadowStyle }}>
            <img src={img.image} alt={img.alt || ""} style={{ width: "100%", display: "block" }} />
          </div>
        ))}
      </div>
    );
  }

  if (layoutName === "editorial") {
    // Editorial layout grid spans
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: `${gap}px` }}>
        {imageList.map((img, idx) => {
          const isLarge = idx % 5 === 0;
          return (
            <div key={img.id} style={{ ...cardStyle, gridColumn: isLarge ? "span 2" : "span 1", gridRow: isLarge ? "span 2" : "span 1", aspectRatio: "auto", height: isLarge ? "320px" : "150px" }}>
              <img src={img.image} alt={img.alt || ""} style={imageStyle} />
            </div>
          );
        })}
      </div>
    );
  }

  if (layoutName === "magazine") {
    // Alternating full and grid styles
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: `${gap}px` }}>
        {imageList.map((img, idx) => {
          const span = idx % 3 === 0 ? "span 4" : "span 2";
          return (
            <div key={img.id} style={{ ...cardStyle, gridColumn: span, height: "200px" }}>
              <img src={img.image} alt={img.alt || ""} style={imageStyle} />
            </div>
          );
        })}
      </div>
    );
  }

  if (layoutName === "stack") {
    // Stack overlapping or full width blocks
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: `${gap}px` }}>
        {imageList.map((img) => (
          <div key={img.id} style={{ ...cardStyle, aspectRatio: "21 / 9", maxHeight: "250px" }}>
            <img src={img.image} alt={img.alt || ""} style={imageStyle} />
          </div>
        ))}
      </div>
    );
  }

  if (layoutName === "reveal") {
    // Text overlay reveals on hover
    return (
      <div style={containerStyle}>
        {imageList.map((img) => (
          <div key={img.id} style={cardStyle}>
            <img src={img.image} alt={img.alt || ""} style={imageStyle} />
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", textAlign: "center", color: "#fff", transition: "opacity 0.3s ease" }}>
              <span style={{ fontSize: "14px", fontWeight: "semibold" }}>{img.alt || "Hover View"}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (layoutName === "split") {
    // One large image on left, grid on right
    if (imageList.length < 2) {
      return (
        <div style={containerStyle}>
          {imageList.map((img) => (
            <div key={img.id} style={cardStyle}><img src={img.image} alt={img.alt || ""} style={imageStyle} /></div>
          ))}
        </div>
      );
    }
    const [largeImage, ...smallImages] = imageList;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: `${gap}px` }}>
        <div style={{ ...cardStyle, height: "100%" }}>
          <img src={largeImage.image} alt={largeImage.alt || ""} style={imageStyle} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: `${gap}px` }}>
          {smallImages.slice(0, 3).map((img) => (
            <div key={img.id} style={{ ...cardStyle, height: "100px" }}>
              <img src={img.image} alt={img.alt || ""} style={imageStyle} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layoutName === "showcase") {
    // Showcase layout - featured main image, thumbnail grids underneath
    if (imageList.length === 0) return null;
    const featured = imageList[0];
    const thumbnails = imageList.slice(1);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: `${gap}px` }}>
        <div style={{ ...cardStyle, height: "300px" }}>
          <img src={featured.image} alt={featured.alt || ""} style={imageStyle} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: `${gap}px` }}>
          {thumbnails.map((img) => (
            <div key={img.id} style={{ ...cardStyle, aspectRatio: "1 / 1" }}>
              <img src={img.image} alt={img.alt || ""} style={imageStyle} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback: Grid layout
  return (
    <div style={containerStyle}>
      {imageList.map((img) => (
        <div key={img.id} style={cardStyle}>
          <img src={img.image} alt={img.alt || ""} style={imageStyle} />
        </div>
      ))}
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
