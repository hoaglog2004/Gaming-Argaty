import { useEffect, useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import { addressApi } from "../../services/apiServices";

const emptyForm = {
  receiverName: "",
  phone: "",
  address: "",
  city: "",
  district: "",
  ward: "",
  isDefault: false,
};

const Addresses = () => {
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [locationData, setLocationData] = useState([]);
  const [loadError, setLoadError] = useState("");

  const fetchAddresses = async () => {
    const data = await addressApi.list();
    return Array.isArray(data) ? data : [];
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const list = await fetchAddresses();
        if (isMounted) setAddresses(list);
        if (isMounted) setLoadError("");
      } catch {
        if (isMounted) setAddresses([]);
        if (isMounted)
          setLoadError(
            "Không thể tải sổ địa chỉ từ hệ thống. Vui lòng thử lại.",
          );
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const loadLocationData = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json",
        );
        const data = await response.json();
        setLocationData(Array.isArray(data) ? data : []);
      } catch {
        setLocationData([]);
      }
    };

    loadLocationData();
  }, []);

  const selectedCity = locationData.find((city) => city.Name === formData.city);
  const districtOptions = selectedCity?.Districts || [];
  const selectedDistrict = districtOptions.find(
    (district) => district.Name === formData.district,
  );
  const wardOptions = selectedDistrict?.Wards || [];

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;
    try {
      await addressApi.remove(id);
      const list = await fetchAddresses();
      setAddresses(list);
      showToast("success", "Đã xóa", "Địa chỉ đã được xóa khỏi sổ địa chỉ.");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể xóa địa chỉ",
      );
    }
  };

  const setAsDefault = async (id) => {
    try {
      await addressApi.setDefault(id);
      const list = await fetchAddresses();
      setAddresses(list);
      showToast("success", "Thành công", "Đã lưu địa chỉ mặc định");
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể đặt mặc định",
      );
    }
  };

  const openForm = (addr = null) => {
    if (addr) {
      setFormData({
        receiverName: addr.receiverName || "",
        phone: addr.phone || "",
        address: addr.address || "",
        city: addr.city || "",
        district: addr.district || "",
        ward: addr.ward || "",
        isDefault: Boolean(addr.isDefault),
      });
      setEditingId(addr.id);
    } else {
      setFormData(emptyForm);
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await addressApi.update(editingId, formData);
        showToast("success", "Đã cập nhật", "Cập nhật địa chỉ thành công!");
      } else {
        await addressApi.create(formData);
        showToast("success", "Đã thêm", "Thêm địa chỉ mới thành công!");
      }
      setIsModalOpen(false);
      const list = await fetchAddresses();
      setAddresses(list);
    } catch (error) {
      showToast(
        "error",
        "Lỗi",
        error?.response?.data?.message || "Không thể lưu địa chỉ",
      );
    }
  };

  const handleCityChange = (value) => {
    setFormData((prev) => ({ ...prev, city: value, district: "", ward: "" }));
  };

  const handleDistrictChange = (value) => {
    setFormData((prev) => ({ ...prev, district: value, ward: "" }));
  };

  return (
    <>
      <div className="profile-content__header">
        <h2 className="profile-content__title">Sổ địa chỉ</h2>
        <button className="btn btn-primary" onClick={() => openForm()}>
          <i className="bx bx-plus"></i> Thêm địa chỉ
        </button>
      </div>

      {loadError && (
        <div className="alert alert-danger mb-4">
          <i className="bx bx-error-circle"></i> {loadError}
        </div>
      )}

      {addresses.length > 0 ? (
        <div className="address-list">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`address-card ${addr.isDefault ? "selected" : ""}`}
              onClick={() => !addr.isDefault && setAsDefault(addr.id)}
            >
              <input
                type="radio"
                name="defaultAddress"
                className="address-card__radio"
                checked={Boolean(addr.isDefault)}
                readOnly
              />
              <div className="d-flex justify-between align-center mb-3">
                <div className="address-card__name">{addr.receiverName}</div>
                {addr.isDefault && (
                  <span className="address-card__default-badge">Mặc định</span>
                )}
              </div>

              <div className="address-card__phone">{addr.phone}</div>
              <div className="address-card__detail mb-3">
                {addr.fullAddress}
              </div>

              <div className="d-flex gap-2 flex-wrap">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openForm(addr);
                  }}
                >
                  <i className="bx bx-edit"></i> Sửa
                </button>
                {!addr.isDefault && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(addr.id);
                    }}
                  >
                    <i className="bx bx-trash"></i> Xóa
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">
            <i className="bx bx-map"></i>
          </div>
          <h3 className="empty-state__title">Chưa có địa chỉ</h3>
          <p className="empty-state__desc">
            Thêm địa chỉ giao hàng để đặt hàng nhanh hơn
          </p>
          <button className="btn btn-primary" onClick={() => openForm()}>
            <i className="bx bx-plus"></i> Thêm địa chỉ đầu tiên
          </button>
        </div>
      )}

      <div className={`modal-overlay ${isModalOpen ? "active" : ""}`}>
        <div className="modal profile-address-modal">
          <div className="modal-header">
            <h3 className="modal-title">
              {editingId ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
            </h3>
            <button
              type="button"
              className="modal-close"
              onClick={() => setIsModalOpen(false)}
            >
              <i className="bx bx-x"></i>
            </button>
          </div>

          <form onSubmit={handleSave}>
            <div className="modal-body">
              <div className="address-form-grid-2">
                <div className="form-group">
                  <label className="form-label">Họ tên người nhận *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.receiverName}
                    onChange={(e) =>
                      setFormData({ ...formData, receiverName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại *</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="address-form-grid-3">
                <div className="form-group">
                  <label className="form-label">Tỉnh/Thành phố *</label>
                  <select
                    className="form-control form-select"
                    value={formData.city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    required
                  >
                    <option value="">Chọn Tỉnh/TP</option>
                    {locationData.map((city) => (
                      <option key={city.Id} value={city.Name}>
                        {city.Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quận/Huyện *</label>
                  <select
                    className="form-control form-select"
                    value={formData.district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    required
                  >
                    <option value="">Chọn Quận/Huyện</option>
                    {districtOptions.map((district) => (
                      <option key={district.Id} value={district.Name}>
                        {district.Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Phường/Xã</label>
                  <select
                    className="form-control form-select"
                    value={formData.ward}
                    onChange={(e) =>
                      setFormData({ ...formData, ward: e.target.value })
                    }
                  >
                    <option value="">Chọn Phường/Xã</option>
                    {wardOptions.map((ward) => (
                      <option key={ward.Id} value={ward.Name}>
                        {ward.Name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ chi tiết *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Số nhà, tên đường..."
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group mb-0">
                <label className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                  />
                  <span className="form-check-label">
                    Đặt làm địa chỉ mặc định
                  </span>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsModalOpen(false)}
              >
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                <i className="bx bx-save"></i> Lưu địa chỉ
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Addresses;
