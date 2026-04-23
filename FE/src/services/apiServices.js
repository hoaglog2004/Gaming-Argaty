import apiClient, { unwrapApiResponse } from "./apiClient";

const get = async (url, config) =>
  unwrapApiResponse(await apiClient.get(url, config));
const post = async (url, body, config) =>
  unwrapApiResponse(await apiClient.post(url, body, config));
const put = async (url, body, config) =>
  unwrapApiResponse(await apiClient.put(url, body, config));
const patch = async (url, body, config) =>
  unwrapApiResponse(await apiClient.patch(url, body, config));
const del = async (url, config) =>
  unwrapApiResponse(await apiClient.delete(url, config));

export const catalogApi = {
  listProducts: (params) => get("/products", { params }),
  getProductBySlug: (slug) => get(`/products/slug/${slug}`),
  featuredProducts: (limit = 8) =>
    get("/products/featured", { params: { limit } }),
  newProducts: (limit = 8) => get("/products/new", { params: { limit } }),
  bestSellerProducts: (limit = 8) =>
    get("/products/bestseller", { params: { limit } }),
  saleProducts: (params) => get("/products/sale", { params }),
  searchSuggestions: (q) =>
    get("/products/search/suggestions", { params: { q } }),
};

export const homeApi = {
  data: () => get("/home"),
};

export const newsletterApi = {
  subscribe: (email) => post("/newsletter/subscribe", { email }),
};

export const checkoutApi = {
  preview: (params) => get("/checkout/preview", { params }),
  placeOrder: (payload) => post("/checkout/place-order", payload),
};

export const paymentApi = {
  createSession: (orderCode) => post(`/payments/${orderCode}/session`),
  confirmBank: (orderCode) => post(`/payments/${orderCode}/bank-confirm`),
  status: (orderCode) => get(`/payments/${orderCode}/status`),
};

export const wishlistApi = {
  list: () => get("/wishlist"),
  ids: () => get("/wishlist/ids"),
  toggle: (productId) => post(`/wishlist/${productId}/toggle`),
  remove: (productId) => del(`/wishlist/${productId}`),
};

export const profileApi = {
  me: () => get("/profile/me"),
  updateMe: (payload) => put("/profile/me", payload),
  changePassword: (payload) => post("/profile/change-password", payload),
};

export const addressApi = {
  list: () => get("/addresses"),
  create: (payload) => post("/addresses", payload),
  update: (id, payload) => put(`/addresses/${id}`, payload),
  remove: (id) => del(`/addresses/${id}`),
  setDefault: (id) => patch(`/addresses/${id}/default`),
};

export const orderApi = {
  myOrders: (params) => get("/orders/my", { params }),
  myOrderDetail: (orderCode) => get(`/orders/my/${orderCode}`),
  cancelOrder: (orderCode, reason) =>
    patch(`/orders/my/${orderCode}/cancel`, { reason }),
};

export const reviewApi = {
  myReviews: (params) => get("/reviews/my", { params }),
  remove: (reviewId) => del(`/reviews/${reviewId}`),
};

export const notificationApi = {
  list: (params) => get("/notifications", { params }),
  unread: () => get("/notifications/unread"),
  markRead: (id) => patch(`/notifications/${id}/read`),
  markAllRead: () => patch("/notifications/read-all"),
};

export const fileApi = {
  uploadAvatar: (formData) =>
    post("/files/upload/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  uploadBanner: (formData) =>
    post("/files/upload/banner", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  uploadMultiple: (formData) =>
    post("/files/upload-multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};

export const adminApi = {
  dashboard: () => get("/admin/dashboard"),
  products: {
    list: (params) => get("/admin/products", { params }),
    detail: (id) => get(`/admin/products/${id}`),
    create: (payload) => post("/admin/products", payload),
    update: (id, payload) => put(`/admin/products/${id}`, payload),
    delete: (id) => del(`/admin/products/${id}`),
    toggleFeatured: (id) => patch(`/admin/products/${id}/toggle-featured`),
    toggleNew: (id) => patch(`/admin/products/${id}/toggle-new`),
    metadata: () => get("/admin/products/metadata"),
  },
  categories: {
    list: (params) => get("/admin/categories", { params }),
    detail: (id) => get(`/admin/categories/${id}`),
    create: (payload) => post("/admin/categories", payload),
    update: (id, payload) => put(`/admin/categories/${id}`, payload),
    delete: (id) => del(`/admin/categories/${id}`),
    metadata: () => get("/admin/categories/metadata"),
  },
  brands: {
    list: (params) => get("/admin/brands", { params }),
    detail: (id) => get(`/admin/brands/${id}`),
    create: (payload) => post("/admin/brands", payload),
    update: (id, payload) => put(`/admin/brands/${id}`, payload),
    delete: (id) => del(`/admin/brands/${id}`),
  },
  banners: {
    list: (params) => get("/admin/banners", { params }),
    detail: (id) => get(`/admin/banners/${id}`),
    create: (payload) => post("/admin/banners", payload),
    update: (id, payload) => put(`/admin/banners/${id}`, payload),
    delete: (id) => del(`/admin/banners/${id}`),
  },
  vouchers: {
    list: (params) => get("/admin/vouchers", { params }),
    detail: (id) => get(`/admin/vouchers/${id}`),
    create: (payload) => post("/admin/vouchers", payload),
    update: (id, payload) => put(`/admin/vouchers/${id}`, payload),
    delete: (id) => del(`/admin/vouchers/${id}`),
  },
  users: {
    list: (params) => get("/admin/users", { params }),
    toggleStatus: (id) => patch(`/admin/users/${id}/toggle-status`),
  },
  orders: {
    list: (params) => get("/admin/orders", { params }),
    detail: (id) => get(`/admin/orders/${id}`),
    updateStatus: (id, payload) => patch(`/admin/orders/${id}/status`, payload),
    markPaid: (id) => patch(`/admin/orders/${id}/mark-paid`),
  },
  chat: {
    sessions: () => get("/admin/chat/sessions"),
    queue: () => get("/admin/chat/queue"),
    detail: (sessionId) => get(`/admin/chat/${sessionId}`),
    messages: (sessionId) => get(`/admin/chat/${sessionId}/messages`),
    assign: (sessionId, payload) => post(`/admin/chat/${sessionId}/assign`, payload),
    send: (sessionId, payload) => post(`/admin/chat/${sessionId}/send`, payload),
  },
};

export const chatApi = {
  startGuest: (payload) => post("/chat/start", payload),
  startAuth: () => post("/chat/start-auth"),
  send: (sessionId, payload) => post(`/chat/${sessionId}/send`, payload),
  getMessages: (sessionId) => get(`/chat/${sessionId}/messages`),
  getSession: (sessionId) => get(`/chat/${sessionId}`),
  close: (sessionId, reason) => post(`/chat/${sessionId}/close`, null, { params: { reason } }),
};

export { get, post, put, patch, del };
