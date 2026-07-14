// Helper to check and create the metaobject definition
export async function ensureMetaobjectDefinition(admin) {
  const checkQuery = `
    query GetMetaobjectDefinition {
      metaobjectDefinitionByType(type: "gallery_studio") {
        id
      }
    }
  `;

  try {
    const checkResponse = await admin.graphql(checkQuery);
    const checkData = await checkResponse.json();

    if (checkData.data?.metaobjectDefinitionByType) {
      return checkData.data.metaobjectDefinitionByType.id;
    }

    // Definition doesn't exist, create it
    const createMutation = `
      mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $definition) {
          metaobjectDefinition {
            id
            type
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      definition: {
        name: "Gallery Studio Gallery",
        type: "gallery_studio",
        fieldDefinitions: [
          {
            key: "title",
            name: "Title",
            type: "single_line_text_field",
          },
          {
            key: "subtitle",
            name: "Subtitle",
            type: "multi_line_text_field",
          },
          {
            key: "button_text",
            name: "Button Text",
            type: "single_line_text_field",
          },
          {
            key: "button_link",
            name: "Button Link",
            type: "single_line_text_field",
          },
          {
            key: "layout",
            name: "Layout",
            type: "single_line_text_field",
          },
          {
            key: "settings",
            name: "Settings",
            type: "json",
          },
          {
            key: "images",
            name: "Images",
            type: "json",
          },
        ],
      },
    };

    const createResponse = await admin.graphql(createMutation, { variables });
    const createData = await createResponse.json();

    if (createData.errors || createData.data?.metaobjectDefinitionCreate?.userErrors?.length > 0) {
      console.error("Metaobject Definition creation errors:", createData.errors || createData.data.metaobjectDefinitionCreate.userErrors);
    }
    return createData.data?.metaobjectDefinitionCreate?.metaobjectDefinition?.id;
  } catch (error) {
    console.error("Error in ensureMetaobjectDefinition:", error);
  }
}

// Helper to sync Gallery details to Shopify Metaobjects
export async function syncGalleryToShopify(admin, gallery, images) {
  await ensureMetaobjectDefinition(admin);

  const handle = `gallery-${gallery.id}`;

  const findQuery = `
    query GetMetaobjectByHandle($handle: MetaobjectHandleInput!) {
      metaobjectByHandle(handle: $handle) {
        id
        handle
      }
    }
  `;

  let metaobjectId = null;
  try {
    const findResponse = await admin.graphql(findQuery, { variables: { handle: { handle, type: "gallery_studio" } } });
    const findData = await findResponse.json();
    metaobjectId = findData.data?.metaobjectByHandle?.id;
  } catch (err) {
    console.error("Error finding metaobject:", err);
  }

  // Format images array for JSON saving
  const formattedImages = images.map((img) => ({
    id: img.id,
    image: img.image,
    alt: img.alt || "",
    position: img.position,
  }));

  // Format settings JSON
  const settingsData = typeof gallery.settings === "string" ? JSON.parse(gallery.settings) : gallery.settings;

  const fields = [
    { key: "title", value: gallery.title || "" },
    { key: "subtitle", value: gallery.subtitle || "" },
    { key: "button_text", value: gallery.buttonText || "" },
    { key: "button_link", value: gallery.buttonLink || "" },
    { key: "layout", value: gallery.layout || "grid" },
    { key: "settings", value: JSON.stringify(settingsData) },
    { key: "images", value: JSON.stringify(formattedImages) },
  ];

  if (metaobjectId) {
    // Update existing
    const updateMutation = `
      mutation UpdateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
        metaobjectUpdate(id: $id, metaobject: $metaobject) {
          metaobject {
            id
            handle
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(updateMutation, {
      variables: {
        id: metaobjectId,
        metaobject: { fields },
      },
    });
    return await response.json();
  } else {
    // Create new
    const createMutation = `
      mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject {
            id
            handle
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(createMutation, {
      variables: {
        metaobject: {
          type: "gallery_studio",
          handle,
          fields,
        },
      },
    });
    return await response.json();
  }
}

// Delete helper
export async function deleteGalleryFromShopify(admin, galleryId) {
  const handle = `gallery-${galleryId}`;

  const findQuery = `
    query GetMetaobjectByHandle($handle: MetaobjectHandleInput!) {
      metaobjectByHandle(handle: $handle) {
        id
      }
    }
  `;

  try {
    const findResponse = await admin.graphql(findQuery, { variables: { handle: { handle, type: "gallery_studio" } } });
    const findData = await findResponse.json();
    const metaobjectId = findData.data?.metaobjectByHandle?.id;

    if (metaobjectId) {
      const deleteMutation = `
        mutation DeleteMetaobject($id: ID!) {
          metaobjectDelete(id: $id) {
            deletedId
            userErrors {
              field
              message
            }
          }
        }
      `;
      await admin.graphql(deleteMutation, { variables: { id: metaobjectId } });
    }
  } catch (err) {
    console.error("Error deleting metaobject from Shopify:", err);
  }
}

// Upload file to Shopify Staged Uploads and register it in Files API
export async function uploadImageToShopify(admin, fileName, fileSize, fileMimeType, fileBuffer) {
  // 1. Get staged upload details
  const stagedMutation = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

    variables: {
      input: [
        {
          filename: fileName,
          httpMethod: "PUT",
          mimeType: fileMimeType,
          fileSize: String(fileBuffer.byteLength),
          resource: "FILE",
        },
      ],
    },
  });

  const stagedData = await stagedResponse.json();
  const errors = stagedData.data?.stagedUploadsCreate?.userErrors || [];
  if (errors.length > 0) {
    throw new Error(errors[0].message);
  }

  const target = stagedData.data?.stagedUploadsCreate?.stagedTargets?.[0];
  if (!target) {
    throw new Error("Failed to generate staged upload link");
  }

  // 2. Upload the raw binary file to Google Cloud Storage / S3 target using PUT
  const uploadRes = await fetch(target.url, {
    method: "PUT",
    headers: {
      "Content-Type": fileMimeType,
    },
    body: fileBuffer,
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    console.error("Cloud storage upload error response:", errorText);
    throw new Error(`Cloud storage upload failed: ${uploadRes.statusText}. Details: ${errorText}`);
  }

  // 3. Register the file inside Shopify Files using the resourceUrl
  const fileCreateMutation = `
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          alt
          status
          ... on MediaImage {
            image {
              url
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const fileCreateResponse = await admin.graphql(fileCreateMutation, {
    variables: {
      files: [
        {
          originalSource: target.resourceUrl,
          contentType: "IMAGE",
        },
      ],
    },
  });

  const fileCreateData = await fileCreateResponse.json();
  const fileCreateErrors = fileCreateData.data?.fileCreate?.userErrors || [];
  if (fileCreateErrors.length > 0) {
    throw new Error(fileCreateErrors[0].message);
  }

  const file = fileCreateData.data?.fileCreate?.files?.[0];
  if (!file) {
    throw new Error("Failed to register image inside Shopify Files");
  }

  // 4. Poll/Wait until status is READY
  let finalUrl = file.image?.url;
  let fileId = file.id;
  let attempts = 0;
  
  while (!finalUrl && attempts < 10) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const pollResponse = await admin.graphql(`
      query GetFile($id: ID!) {
        node(id: $id) {
          ... on MediaImage {
            status
            image {
              url
            }
          }
        }
      }
    `, { variables: { id: fileId } });
    
    const pollData = await pollResponse.json();
    const node = pollData.data?.node;
    if (node?.status === "READY") {
      finalUrl = node.image?.url;
      break;
    } else if (node?.status === "FAILED") {
      throw new Error("Shopify processing failed for this image file");
    }
    attempts++;
  }

  if (!finalUrl) {
    return target.resourceUrl;
  }

  return finalUrl;
}
