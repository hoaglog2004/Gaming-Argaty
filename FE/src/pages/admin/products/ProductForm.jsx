import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { adminApi, fileApi } from "../../../services/apiServices";

const emptyVariant = {
  id: null,
  name: "",
  sku: "",
  color: "",
  size: "",
  additionalPrice: 0,
  quantity: 0,
  imageUrls: [],
};

const parseSpecifications = (raw) => {
  if (!raw || typeof raw !== "string") return [{ key: "", value: "" }];
  const rows = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const splitIndex = line.indexOf(":");
      if (splitIndex === -1) {
        return { key: line, value: "" };
      }
      return {
        key: line.slice(0, splitIndex).trim(),
        value: line.slice(splitIndex + 1).trim(),
      };
    })
    .filter((item) => item.key || item.value);

  return rows.length ? rows : [{ key: "", value: "" }];
};

const ProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVariantImageIndex, setUploadingVariantImageIndex] =
    useState(null);
  const [tier1ValuesInput, setTier1ValuesInput] = useState("");
  const [tier2ValuesInput, setTier2ValuesInput] = useState("");
  const descriptionEditorRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    slug: "",
    tier1Name: "",
    tier2Name: "",
    shortDescription: "",
    description: "",
    specifications: [{ key: "", value: "" }],
    price: 0,
    salePrice: 0,
    quantity: 0,
    categoryId: "",
    brandId: "",
    isActive: true,
    isFeatured: false,
    isBestSeller: false,
    isNew: true,
    images: [],
    variants: [],
  });

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const metadata = await adminApi.products.metadata();
        setCategories(metadata?.categories || []);
        setBrands(metadata?.brands || []);
      } catch {
        setCategories([]);
        setBrands([]);
      }
    };

    loadMeta();
  }, []);

  useEffect(() => {
    const loadDetail = async () => {
      if (!isEdit) return;
      try {
        const detail = await adminApi.products.detail(id);
        const nextImages = (detail?.images || detail?.imageUrls || []).map(
          (img, index) => ({
            id: img?.id || `${Date.now()}-${index}`,
            url: img?.imageUrl || img?.url || img,
          }),
        );

        const nextVariants = Array.isArray(detail?.variants)
          ? detail.variants.map((variant, index) => ({
              id: variant.id || null,
              name: variant.name || "",
              sku: variant.sku || "",
              color: variant.color || "",
              size: variant.size || "",
              additionalPrice: Number(variant.additionalPrice || 0),
              quantity: Number(variant.quantity || 0),
              imageUrls: (variant.images || []).filter(Boolean),
              key: `${variant.id || "variant"}-${index}`,
            }))
          : [];

        setFormData((prev) => ({
          ...prev,
          ...detail,
          tier1Name: detail?.tier1Name || "",
          tier2Name: detail?.tier2Name || "",
          categoryId: detail?.category?.id || detail?.categoryId || "",
          brandId: detail?.brand?.id || detail?.brandId || "",
          specifications: parseSpecifications(detail?.specifications),
          images: nextImages,
          variants: nextVariants,
        }));
      } catch {
        showToast("error", "Lỗi", "Không thể tải dữ liệu sản phẩm");
      }
    };

    loadDetail();
  }, [id, isEdit, showToast]);

  const payload = useMemo(
    () => {
      const priceValue = Number(formData.price || 0);
      const rawSalePrice = Number(formData.salePrice || 0);
      const salePriceValue =
        rawSalePrice > 0 && priceValue > 0 && rawSalePrice < priceValue
          ? rawSalePrice
          : null;

      return {
      ...formData,
      categoryId: formData.categoryId ? Number(formData.categoryId) : null,
      brandId: formData.brandId ? Number(formData.brandId) : null,
      price: priceValue,
      salePrice: salePriceValue,
      specifications: formData.specifications
        .filter((item) => item.key?.trim() || item.value?.trim())
        .map((item) =>
          `${item.key?.trim() || ""}: ${item.value?.trim() || ""}`.trim(),
        )
        .join("\n"),
      imageUrls: formData.images.map((img) => img.url).filter(Boolean),
      variants: (formData.variants || [])
        .filter(
          (variant) =>
            variant.name?.trim() ||
            variant.color?.trim() ||
            variant.size?.trim(),
        )
        .map((variant) => ({
          id: variant.id || null,
          name:
            variant.name?.trim() ||
            `${variant.color || ""} ${variant.size || ""}`.trim() ||
            "Biến thể",
          sku: variant.sku?.trim() || null,
          color: variant.color?.trim() || null,
          size: variant.size?.trim() || null,
          additionalPrice: Number(variant.additionalPrice || 0),
          quantity: Number(variant.quantity || 0),
          imageUrls: (variant.imageUrls || []).filter(Boolean),
        })),
    };
    },
    [formData],
  );

  const setField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const editor = descriptionEditorRef.current;
    if (!editor) return;
    const nextHtml = formData.description || "";
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
  }, [formData.description]);

  const applyDescriptionFormat = (command, value = undefined) => {
    const editor = descriptionEditorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, value);
    setField("description", editor.innerHTML);
  };

  const normalizeOptionValues = (raw) => {
    const values = String(raw || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return [...new Set(values)];
  };

  const buildVariantName = (color, size) => {
    const first = String(color || "").trim();
    const second = String(size || "").trim();
    return [first, second].filter(Boolean).join(" - ") || "Biến thể";
  };

  const generateVariantCombinations = () => {
    const tier1Values = normalizeOptionValues(tier1ValuesInput);
    const tier2Values = normalizeOptionValues(tier2ValuesInput);

    if (!tier1Values.length) {
      showToast(
        "warning",
        "Thiếu dữ liệu",
        "Vui lòng nhập ít nhất một giá trị nhóm phân loại 1",
      );
      return;
    }

    const existingMap = new Map();
    (formData.variants || []).forEach((variant) => {
      const key = `${variant.color || ""}__${variant.size || ""}`;
      existingMap.set(key, variant);
    });

    const combos = [];
    const secondGroup = tier2Values.length ? tier2Values : [""];

    tier1Values.forEach((tier1Value) => {
      secondGroup.forEach((tier2Value) => {
        const key = `${tier1Value}__${tier2Value}`;
        const existed = existingMap.get(key);
        combos.push({
          id: existed?.id || null,
          name: existed?.name || buildVariantName(tier1Value, tier2Value),
          sku: existed?.sku || "",
          color: tier1Value,
          size: tier2Value,
          additionalPrice: Number(existed?.additionalPrice || 0),
          quantity: Number(existed?.quantity || 0),
          imageUrls: Array.isArray(existed?.imageUrls) ? existed.imageUrls : [],
          key:
            existed?.key || `combo-${tier1Value}-${tier2Value}-${Date.now()}`,
        });
      });
    });

    setFormData((prev) => ({ ...prev, variants: combos }));
    showToast(
      "success",
      "Đã tạo tổ hợp",
      `Đã tạo ${combos.length} biến thể theo nhóm phân loại`,
    );
  };

  const handleSpecChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) =>
        i === index ? { ...spec, [field]: value } : spec,
      ),
    }));
  };

  const addSpec = () => {
    setFormData((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { key: "", value: "" }],
    }));
  };

  const removeSpec = (index) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      setUploadingImage(true);
      const formPayload = new FormData();
      files.forEach((file) => formPayload.append("files", file));
      formPayload.append("directory", "products");
      const uploaded = await fileApi.uploadMultiple(formPayload);
      const urls = uploaded?.urls || [];

      setFormData((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          ...urls.map((url, index) => ({ id: `${Date.now()}-${index}`, url })),
        ],
      }));
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể tải ảnh lên",
      );
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const removeImage = (imageId) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((image) => image.id !== imageId),
    }));
  };

  const moveImage = (fromIndex, toIndex) => {
    setFormData((prev) => {
      const next = [...prev.images];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...prev, images: next };
    });
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { ...emptyVariant, key: `new-${Date.now()}` },
      ],
    }));
  };

  const updateVariant = (index, key, value) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, i) =>
        i === index ? { ...variant, [key]: value } : variant,
      ),
    }));
  };

  const parseNumberInput = (value) => (value === "" ? "" : Number(value));

  const removeVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const uploadVariantImages = async (index, event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      setUploadingVariantImageIndex(index);
      const formPayload = new FormData();
      files.forEach((file) => formPayload.append("files", file));
      formPayload.append("directory", "variants");
      const uploaded = await fileApi.uploadMultiple(formPayload);
      const urls = uploaded?.urls || [];
      updateVariant(index, "imageUrls", [
        ...(formData.variants[index]?.imageUrls || []),
        ...urls,
      ]);
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể tải ảnh biến thể",
      );
    } finally {
      setUploadingVariantImageIndex(null);
      event.target.value = "";
    }
  };

  const removeVariantImage = (variantIndex, imageIndex) => {
    const current = formData.variants[variantIndex]?.imageUrls || [];
    updateVariant(
      variantIndex,
      "imageUrls",
      current.filter((_, index) => index !== imageIndex),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      if (isEdit) {
        await adminApi.products.update(id, payload);
      } else {
        await adminApi.products.create(payload);
      }
      showToast(
        "success",
        "Thành công",
        isEdit ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm",
      );
      navigate("/admin/products");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể lưu sản phẩm",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-page-header d-flex justify-between align-center mb-4">
        <h1 className="admin-page-title">
          {isEdit ? "CẬP NHẬT SẢN PHẨM" : "THÊM SẢN PHẨM MỚI"}
        </h1>
        <Link to="/admin/products" className="btn btn-outline">
          <i className="bx bx-arrow-back"></i> Quay lại
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "24px",
          }}
        >
          <div>
            <div className="admin-form-card mb-4">
              <div className="admin-form-card__header">
                <h4 className="admin-form-card__title">
                  <i className="bx bx-info-circle text-primary"></i> Thông tin
                  cơ bản
                </h4>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">
                  Tên sản phẩm <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
              </div>

              <div
                className="d-grid"
                style={{
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.sku || ""}
                    onChange={(e) => setField("sku", e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Slug</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.slug || ""}
                    onChange={(e) => setField("slug", e.target.value)}
                  />
                </div>
              </div>

              <div
                className="d-grid"
                style={{
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label className="form-label">Nhóm phân loại 1</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.tier1Name || ""}
                    onChange={(e) => setField("tier1Name", e.target.value)}
                    placeholder="VD: Màu sắc"
                  />
                </div>
                <div>
                  <label className="form-label">Nhóm phân loại 2</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.tier2Name || ""}
                    onChange={(e) => setField("tier2Name", e.target.value)}
                    placeholder="VD: Loại switch"
                  />
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Mô tả ngắn</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={formData.shortDescription || ""}
                  onChange={(e) => setField("shortDescription", e.target.value)}
                ></textarea>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Mô tả chi tiết</label>
                <div
                  className="card"
                  style={{
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-card)",
                  }}
                >
                  <div
                    className="d-flex flex-wrap gap-2 p-2"
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => applyDescriptionFormat("bold")}
                    >
                      <i className="bx bx-bold"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => applyDescriptionFormat("italic")}
                    >
                      <i className="bx bx-italic"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => applyDescriptionFormat("underline")}
                    >
                      <i className="bx bx-underline"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        applyDescriptionFormat("insertUnorderedList")
                      }
                    >
                      <i className="bx bx-list-ul"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        applyDescriptionFormat("insertOrderedList")
                      }
                    >
                      <i className="bx bx-list-ol"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        const url = window.prompt("Nhập liên kết");
                        if (url) applyDescriptionFormat("createLink", url);
                      }}
                    >
                      <i className="bx bx-link"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => applyDescriptionFormat("removeFormat")}
                    >
                      <i className="bx bx-eraser"></i>
                    </button>
                  </div>
                  <div
                    ref={descriptionEditorRef}
                    className="form-control"
                    contentEditable
                    suppressContentEditableWarning
                    style={{
                      minHeight: "220px",
                      border: "none",
                      background: "transparent",
                    }}
                    onInput={(e) =>
                      setField("description", e.currentTarget.innerHTML)
                    }
                  ></div>
                </div>
              </div>

              <div
                className="pt-3"
                style={{ borderTop: "1px solid var(--border-color)" }}
              >
                <label className="form-label text-primary">
                  <i className="bx bx-list-ul"></i> THÔNG SỐ KỸ THUẬT
                </label>
                <div className="d-flex flex-column gap-2 mb-2">
                  {formData.specifications.map((spec, index) => (
                    <div key={index} className="d-flex gap-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Thuộc tính"
                        value={spec.key}
                        onChange={(e) =>
                          handleSpecChange(index, "key", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Giá trị"
                        value={spec.value}
                        onChange={(e) =>
                          handleSpecChange(index, "value", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => removeSpec(index)}
                      >
                        <i className="bx bx-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={addSpec}
                >
                  <i className="bx bx-plus"></i> Thêm dòng thông số
                </button>
              </div>
            </div>

            <div className="admin-form-card mb-4">
              <div className="admin-form-card__header d-flex justify-between align-center">
                <h4
                  className="admin-form-card__title mb-0"
                  style={{ borderBottom: "none", paddingBottom: 0 }}
                >
                  <i className="bx bx-image text-primary"></i> Thư viện ảnh
                </h4>
              </div>

              <label className="image-upload mb-4 d-block cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="d-none"
                  onChange={handleImageUpload}
                />
                <div className="image-upload__icon">
                  <i className="bx bx-cloud-upload"></i>
                </div>
                <h6>
                  {uploadingImage ? "Đang tải ảnh..." : "Click để chọn ảnh"}
                </h6>
              </label>

              <div
                className="d-flex flex-wrap gap-3"
                style={{ minHeight: "50px" }}
              >
                {formData.images.map((image, index) => (
                  <div
                    key={image.id}
                    className="position-relative"
                    style={{ width: "120px", height: "120px" }}
                  >
                    <span
                      className="badge"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        zIndex: 2,
                      }}
                    >
                      {index === 0 ? "Ảnh chính" : `#${index + 1}`}
                    </span>
                    <img
                      src={image.url}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                      }}
                    />
                    <button
                      type="button"
                      className="table-action-btn"
                      style={{
                        position: "absolute",
                        bottom: "4px",
                        left: "4px",
                      }}
                      disabled={index === 0}
                      onClick={() => moveImage(index, index - 1)}
                    >
                      <i className="bx bx-left-arrow-alt"></i>
                    </button>
                    <button
                      type="button"
                      className="table-action-btn"
                      style={{
                        position: "absolute",
                        bottom: "4px",
                        left: "40px",
                      }}
                      disabled={index + 1 >= formData.images.length}
                      onClick={() => moveImage(index, index + 1)}
                    >
                      <i className="bx bx-right-arrow-alt"></i>
                    </button>
                    <button
                      type="button"
                      className="table-action-btn delete"
                      style={{ position: "absolute", top: "4px", right: "4px" }}
                      onClick={() => removeImage(image.id)}
                    >
                      <i className="bx bx-x"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-form-card mb-4">
              <div className="admin-form-card__header d-flex justify-between align-center">
                <h4
                  className="admin-form-card__title mb-0"
                  style={{ borderBottom: "none", paddingBottom: 0 }}
                >
                  <i className="bx bx-layer text-primary"></i> Biến thể
                </h4>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={addVariant}
                >
                  <i className="bx bx-plus"></i> Thêm biến thể
                </button>
              </div>

              <p className="text-muted mb-3" style={{ fontSize: "13px" }}>
                Thiết lập nhóm phân loại, nhập danh sách giá trị rồi tạo tổ hợp
                SKU tự động như bản Thymeleaf cũ.
              </p>

              <div
                className="d-grid"
                style={{
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <label className="form-label">
                    Giá trị nhóm 1 (phân tách dấu phẩy)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Đen, Trắng"
                    value={tier1ValuesInput}
                    onChange={(e) => setTier1ValuesInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">
                    Giá trị nhóm 2 (tuỳ chọn)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Blue, Red"
                    value={tier2ValuesInput}
                    onChange={(e) => setTier2ValuesInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={generateVariantCombinations}
                >
                  <i className="bx bx-grid-alt"></i> Tạo tổ hợp
                </button>
              </div>

              {formData.variants.length === 0 ? (
                <p className="text-muted mb-0">Chưa có biến thể.</p>
              ) : null}

              {formData.variants.map((variant, index) => (
                <div
                  key={variant.key || variant.id || index}
                  className="card p-3 mb-3"
                  style={{ border: "1px solid var(--border-color)" }}
                >
                  <div className="d-flex justify-between align-center mb-3">
                    <strong className="text-primary">
                      Biến thể #{index + 1}
                    </strong>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => removeVariant(index)}
                    >
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                  <div
                    className="d-grid"
                    style={{
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <label className="form-label">Tên hiển thị</label>
                      <input
                        type="text"
                        className="form-control"
                        value={variant.name || ""}
                        onChange={(e) =>
                          updateVariant(index, "name", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="form-label">SKU</label>
                      <input
                        type="text"
                        className="form-control"
                        value={variant.sku || ""}
                        onChange={(e) =>
                          updateVariant(index, "sku", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="form-label">Số lượng</label>
                      <input
                        type="number"
                        min={0}
                        className="form-control"
                        value={variant.quantity ?? 0}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "quantity",
                            parseNumberInput(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>

                  <div
                    className="d-grid"
                    style={{
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <label className="form-label">
                        {formData.tier1Name || "Phân loại 1"}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={variant.color || ""}
                        onChange={(e) =>
                          updateVariant(index, "color", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="form-label">
                        {formData.tier2Name || "Phân loại 2"}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={variant.size || ""}
                        onChange={(e) =>
                          updateVariant(index, "size", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="form-label">Giá chênh lệch</label>
                      <input
                        type="number"
                        className="form-control"
                        value={variant.additionalPrice ?? 0}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "additionalPrice",
                            parseNumberInput(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Ảnh biến thể</label>
                    <div className="d-flex align-center gap-2 mb-2">
                      <label
                        className="btn btn-outline btn-sm mb-0"
                        style={{ cursor: "pointer" }}
                      >
                        <i className="bx bx-image-add"></i>{" "}
                        {uploadingVariantImageIndex === index
                          ? "Đang tải..."
                          : "Thêm ảnh"}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="d-none"
                          onChange={(event) =>
                            uploadVariantImages(index, event)
                          }
                        />
                      </label>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {(variant.imageUrls || []).map((url, imageIndex) => (
                        <div
                          key={`${url}-${imageIndex}`}
                          style={{
                            width: "42px",
                            height: "42px",
                            position: "relative",
                          }}
                        >
                          <img
                            src={url}
                            alt="Variant"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "4px",
                              border: "1px solid var(--border-color)",
                            }}
                          />
                          <button
                            type="button"
                            className="table-action-btn delete"
                            style={{
                              position: "absolute",
                              top: "-8px",
                              right: "-8px",
                              width: "18px",
                              height: "18px",
                              minWidth: "18px",
                            }}
                            onClick={() =>
                              removeVariantImage(index, imageIndex)
                            }
                          >
                            <i className="bx bx-x"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              className="admin-form-card mb-4"
              style={{ borderTop: "4px solid var(--primary)" }}
            >
              <div className="admin-form-card__header">
                <h4 className="admin-form-card__title mb-0">Xuất bản</h4>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mb-4"
                disabled={saving}
              >
                <i className="bx bx-save"></i>{" "}
                {saving ? "Đang lưu..." : "LƯU SẢN PHẨM"}
              </button>

              <label className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={formData.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                />
                <span className="form-check-label">Hiển thị public</span>
              </label>
              <label className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={formData.isFeatured}
                  onChange={(e) => setField("isFeatured", e.target.checked)}
                />
                <span className="form-check-label">Sản phẩm nổi bật</span>
              </label>
              <label className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={formData.isBestSeller}
                  onChange={(e) => setField("isBestSeller", e.target.checked)}
                />
                <span className="form-check-label">Bán chạy nhất</span>
              </label>
              <label className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={formData.isNew}
                  onChange={(e) => setField("isNew", e.target.checked)}
                />
                <span className="form-check-label">Sản phẩm mới</span>
              </label>
            </div>

            <div className="admin-form-card mb-4">
              <div className="admin-form-card__header">
                <h4 className="admin-form-card__title mb-0">Giá & Kho</h4>
              </div>
              <div className="form-group mb-3">
                <label className="form-label">
                  Giá gốc ₫ <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  required
                  value={formData.price}
                  onChange={(e) => setField("price", parseNumberInput(e.target.value))}
                />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Giá ưu đãi (Sale) ₫</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.salePrice}
                  onChange={(e) =>
                    setField("salePrice", parseNumberInput(e.target.value))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tổng tồn kho</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.quantity}
                  onChange={(e) => setField("quantity", parseNumberInput(e.target.value))}
                />
              </div>
            </div>

            <div className="admin-form-card">
              <div className="admin-form-card__header">
                <h4 className="admin-form-card__title mb-0">Phân loại</h4>
              </div>
              <div className="form-group mb-3">
                <label className="form-label">
                  Danh mục <span className="text-danger">*</span>
                </label>
                <select
                  className="form-control form-select"
                  required
                  value={formData.categoryId}
                  onChange={(e) => setField("categoryId", e.target.value)}
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Thương hiệu</label>
                <select
                  className="form-control form-select"
                  value={formData.brandId}
                  onChange={(e) => setField("brandId", e.target.value)}
                >
                  <option value="">Chọn thương hiệu</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default ProductForm;
